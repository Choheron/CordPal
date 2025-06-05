from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict
from django.utils import timezone
import numpy

from .utils import (
  getAlbumRating,
)
from users.utils import getUserObj
from .models import (
  AotdUserData,
  Album,
  Review,
  DailyAlbum
)


import logging
from dotenv import load_dotenv
import os
import json
import datetime
import pytz
import requests

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


## Helper Method
def parseReleaseDate(date_str):
  if(len(date_str) > 7):
    return datetime.datetime.strptime(date_str, "%Y-%m-%d")
  elif(len(date_str) > 4): 
    return datetime.datetime.strptime(date_str, "%Y-%m")
  elif(len(date_str) > 0):
    return datetime.datetime.strptime(date_str, "%Y")
  else:
    return None

## =========================================================================================================================================================================================
## ALBUM METHODS
## =========================================================================================================================================================================================

###
# Check if an album already exists in the database
###
def checkIfAlbumAlreadyExists(request: HttpRequest, mbid: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfAlbumAlreadyExists called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert response to Json
  logger.info(f"Checking if album with ID {mbid} is already submitted...")
  # Declare out dict
  out = {}
  # Get album from database
  try:
    albumObject = Album.objects.get(mbid = mbid)
    if(albumObject):
      logger.info(f"Album does already exist, name: {albumObject.title}!")
    out['exists'] = True
  except ObjectDoesNotExist as e:
    out['exists'] = False
  # Return aotd Response
  return JsonResponse(out)


###
# If the user meets the criteria to be able to submit an album.
###
def checkIfUserCanSubmit(request: HttpRequest, date: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfUserCanSubmit called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare object to decide if they can be submitted
  validityStatus = {}
  validityStatus['canSubmit'] = True
  validityStatus['reason'] = "User is able to submit albums."
  # Get user from database
  userObj = getUserObj(request.session.get('discord_id'))
  # Fill date if it isnt provided (Defauly to current time)
  if(date == ""):
    date = datetime.datetime.now(tz=pytz.timezone('America/Chicago')).strftime('%Y-%m-%d')
  ## Check if user is being album limited (USER CAN ONLY SUBMIT ONE ALBUM A DAY)
  # Convert String to date
  date_format = '%Y-%m-%d'
  albumDay = datetime.datetime.strptime(date, date_format).date()
  # Filter submissions by date
  dateSubmissions = Album.objects.filter(submitted_by=userObj)
  for submission in dateSubmissions:
    if(submission.submission_date.astimezone(tz=pytz.timezone('America/Chicago')).date().strftime('%Y-%m-%d') == date):
      validityStatus['canSubmit'] = False
      validityStatus['reason'] = f"You have already submitted an album for today! ({albumDay}) (CST)"
      return JsonResponse(validityStatus)
  ## Check if a user has submitted a review for the current album, if not, they cannot submit an album
  # Check for review submitted for the current date
  try:
    review = Review.objects.filter(review_date__date=albumDay).get(user=userObj)
  except ObjectDoesNotExist as e:
    validityStatus['canSubmit'] = False
    validityStatus['reason'] = f"You have not submitted a review for the current album!"
  ## Check if the user has 100 or more unpicked submissions, users are limited to 100 unpicked albums
  # Get count of user submissions
  userSubCount = Album.objects.filter(submitted_by=userObj).count()
  userPickCount = DailyAlbum.objects.filter(album__submitted_by=userObj).count()
  userUnpickCount = userSubCount - userPickCount
  if(userUnpickCount >= 100):
    validityStatus['canSubmit'] = False
    validityStatus['reason'] = f"You have 100 or more unpicked albums submitted ({userUnpickCount}). A user is limited to 100 unpicked albums."
  # Return Statuses
  return JsonResponse(validityStatus)


###
# Check if an album already exists in the database
###
def checkIfAlbumAlreadyExists(request: HttpRequest, release_group_id: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfAlbumAlreadyExists called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert response to Json
  logger.info(f"Checking if album with a release group ID {release_group_id} is already submitted...")
  # Declare out dict
  out = {}
  # Get album from database
  try:
    kwargs = {'raw_data__release-group__id': release_group_id}
    albumObject = Album.objects.get(**kwargs)
    # Check if any other album of the same release-group exists
    if(albumObject):
      logger.info(f"Album does already exist, name: {albumObject.title}!")
    out['exists'] = True
    out['submitter_id'] = albumObject.submitted_by.discord_id
    out['submitter_nickname'] = albumObject.submitted_by.nickname
  except ObjectDoesNotExist as e:
    out['exists'] = False
  # Return aotd Response
  return JsonResponse(out)


###
# Submit an Album to the album of the day pool.
###
def submitAlbum(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("submitAlbum called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Ensure that album doesnt already exist in the pool
  try:
    albumObject = Album.objects.get(mbid = reqBody['album']['id'])
    if(albumObject):
      logger.info(f"Album already exists, name: {albumObject.title}!")
    return HttpResponse(status=400)
  except ObjectDoesNotExist as e:
    # Get user from database
    user = getUserObj(request.session.get('discord_id'))
    # Query musicbrainz to get track list
    # Build Tracks Url
    url = f"https://musicbrainz.org/ws/2/release/{reqBody['album']['id']}"
    params = {
      'inc': 'recordings',
      'fmt': 'json'
    }
    headers = {
      'User-Agent': 'CordPal/0.0.1 ( www.cordpal.app )'
    }
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    # Declare new album object
    newAlbum = Album(
      mbid=reqBody['album']['id'],
      title=reqBody['album']['title'],
      artist=reqBody['album']['artist-credit'][0]['name'],
      artist_url=f"https://musicbrainz.org/artist/{reqBody['album']['artist-credit'][0]['artist']['id']}",
      cover_url=f"https://coverartarchive.org/release/{reqBody['album']['id']}/front",
      album_url=f"https://musicbrainz.org/release/{reqBody['album']['id']}",
      submitted_by=user,
      user_comment=reqBody['user_comment'] if (reqBody['user_comment'] != "") else "No Comment Provided",
      disambiguation=reqBody['album']['disambiguation'] if ('disambiguation' in reqBody['album'].keys()) else "",
      release_date=parseReleaseDate(reqBody['album']['date']),
      release_date_str=reqBody['album']['date'],
      raw_data=reqBody['album'],
      track_list={ 'tracks': data['media'][0]['tracks'] },
    )
    # Save new album data
    newAlbum.save()
    return HttpResponse(status=200)


###
# Attempt to Delete an Album from the AOtD Pool.
###
def deleteAlbum(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("deleteAlbum called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Ensure that album exists in the database and has been submitted by this user
  try:
    albumObject = Album.objects.get(mbid = reqBody['album_id'])
    # Get user object from request
    user = getUserObj(request.session['discord_id'])
    # If user has not submitted the attempted delete, throw an error (Does not apply to admins)
    if((albumObject.submitted_by != user) and (not user.is_staff)):
      logger.warning(f"deleteAlbum: User {user.discord_id}/{user.nickname} attempted to delete Album: {reqBody['album_id']}, however did not submit said Album!")
      return HttpResponse(status=403)
    # Check if the album has been AOtD
    if(DailyAlbum.objects.filter(album=albumObject).count() > 0):
      logger.warning(f"deleteAlbum: User {user.discord_id}/{user.nickname} attempted to delete Album: {reqBody['album_id']}, FAILED due to Album having been AOtD!")
      return HttpResponse(status=403)
    # Delete album object from database
    albumObject.delete(deleter=user, reason=reqBody['reason'])
    logger.info(f"Album {reqBody['album_id']} has been deleted...")
    return HttpResponse(status=200)
  except ObjectDoesNotExist as e:
    # Throw error if the album is not in the database
    logger.warning(f"deleteAlbum: Album {reqBody['album_id']} does not exist in Albums DB")
    return HttpResponse(status=404)
  

###
# Get an Album from the album of the day pool.
###
def getAlbum(request: HttpRequest, mbid: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("submitAlbum called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve album from database
  albumObj = Album.objects.get(mbid=mbid)
  # Build return object
  out = {}
  out['raw_album_data'] = json.dumps(albumObj.raw_data)
  out['release_group'] = json.dumps(albumObj.raw_data['release-group'])
  out['title'] = albumObj.title
  out['album_id'] = albumObj.mbid
  out['album_img_src'] = albumObj.cover_url
  out['album_src'] = albumObj.album_url
  out['artist'] = {}
  out['artist']['name'] = albumObj.artist
  out['artist']['href'] = (albumObj.artist_url if albumObj.artist_url != "" else albumObj.raw_data['album']['artists'][0]['external_urls']['aotd'])
  out['submitter'] = albumObj.submitted_by.discord_id
  out['submitter_nickname'] = albumObj.submitted_by.nickname
  out['submitter_comment'] = albumObj.user_comment
  out['submission_date'] = albumObj.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
  out['release_date_str'] = albumObj.release_date_str
  out['release_date'] = parseReleaseDate(albumObj.release_date_str)
  out['track_list'] = albumObj.track_list if albumObj.track_list else {"tracks": []}
  # Return final object
  return JsonResponse(out)


###
# Get ALL Album from the album of the day pool.
###
def getAllAlbums(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllAlbums called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve all albums from database
  albumObj = Album.objects.all()
  # Declare list of albums
  albumList = []
  # Iterate through albums
  for album in albumObj:
    # Build album object
    albumObj = {}
    albumObj['title'] = album.title
    albumObj['album_id'] = album.mbid
    albumObj['album_img_src'] = album.cover_url
    albumObj['album_src'] = album.album_url
    albumObj['artist'] = {}
    albumObj['artist']['name'] = album.artist
    albumObj['artist']['href'] = (album.artist_url if album.artist_url != "" else album.raw_data['album']['artists'][0]['external_urls']['aotd'])
    albumObj['submitter'] = album.submitted_by.discord_id
    albumObj['submitter_avatar_url'] = album.submitted_by.get_avatar_url()
    albumObj['submitter_nickname'] = album.submitted_by.nickname
    albumObj['submitter_comment'] = album.user_comment
    albumObj['submission_date'] = album.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
    albumObj['release_date_str'] = album.release_date_str
    albumObj['release_date'] = album.release_date.strftime("%m/%d/%Y, %H:%M:%S") if album.release_date else None
    # Check if album has been aotd
    try:
      # Get most recent AOtD date
      albumObj['last_aotd'] = DailyAlbum.objects.filter(album=album).filter(date__lte=datetime.datetime.now(tz=pytz.timezone('America/Chicago'))).latest('date').date # Return most recent instance of album
      # Get most recent review rating from AOtD
      albumObj['rating'] = getAlbumRating(mbid=album.mbid, rounded=False, date=albumObj['last_aotd'])
    except:
      albumObj['last_aotd'] = None
      albumObj['rating'] = None 
    # Append to List
    albumList.append(albumObj)
  # Return final object
  return JsonResponse({"timestamp": datetime.datetime.now(), "albums_list": albumList})


###
# Get the average rating for an album.
# If a date is not provided in the url bar, will return the most recent aotd ratings for that album
###
def getAlbumAvgRating(request: HttpRequest, mbid: str, rounded: str = "true", date: str = None):
  # If date is not provided grab the most recent date of AOtD
  aotd_date = date if (date) else DailyAlbum.objects.filter(album__mbid=mbid).latest('date').date
  # Convert bool to string
  if(rounded == "true"):
    rounded = True
  else: 
    rounded = False
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumAvgRating called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  rating = getAlbumRating(mbid, rounded=rounded, date=aotd_date)
  return JsonResponse({"rating": rating})


###
# Get the standard deviation for the ratings for an album.
# If a date is not provided in the url bar, will return the most recent aotd standard deviation for that album
###
def getAlbumSTD(request: HttpRequest, mbid: str, date: str = None):
  # If date is not provided grab the most recent date of AOtD
  aotd_date = date if (date) else DailyAlbum.objects.filter(album__mbid=mbid).latest('date').date
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumSTD called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all ratings for an album
  reviewList = Review.objects.filter(album__mbid=mbid).filter(aotd_date=aotd_date)
  # Iterate review list and get scores
  reviewScores = [rev.score for rev in reviewList]
  # Get standard deviation
  standardDev = numpy.std(reviewScores)
  return JsonResponse({"standard_deviation": standardDev})


###
# Get All Reviews for a specific album. Returns a aotd album id and date
###
def getLastXAlbums(request: HttpRequest, count: int):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getLastXAlbums called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get last X count of albums
  last_X = Album.objects.all().order_by('-id')[:count]
  # Build list of custom Album Objects
  album_list = []
  for album in last_X:
    albumObj = {}
    albumObj['title'] = album.title
    albumObj['album_id'] = album.mbid
    albumObj['album_img_src'] = album.cover_url
    albumObj['album_src'] = album.album_url
    albumObj['submitter'] = album.submitted_by.nickname
    albumObj['submission_date'] = album.submission_date
    # Append to List
    album_list.append(albumObj)
  return JsonResponse({ "album_list": album_list, "timestamp" : datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")})


###
# Get Album Stats (submission numbers)
###
def getAlbumsStats(request: HttpRequest):
  # Avoid circular import
  from .views_aotd import getChanceOfAotdSelect
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumsStats called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare out object
  out = {}
  # Get total album count
  out['total_albums'] = Album.objects.all().count()
  # Get all aotd users
  spotUsers = AotdUserData.objects.all()
  # Iterate through and build user json
  userStatsList = []
  for user in spotUsers:
    userData = {}
    userData['submission_count'] = Album.objects.filter(submitted_by=user.user).count()
    userData['aotd_count'] = DailyAlbum.objects.filter(album__submitted_by=user.user).count()
    userData['unpicked_count'] = f"{(Album.objects.filter(submitted_by=user.user).count() - DailyAlbum.objects.filter(album__submitted_by=user.user).count())}/100"
    userData['discord_id'] = user.user.discord_id
    userData['nickname'] = user.user.nickname
    chance_view_response = json.loads(getChanceOfAotdSelect(request, user.user.discord_id).content)
    userData['selection_blocked'] = (chance_view_response['block_type'] != None)
    userData['selection_chance'] = chance_view_response['percentage']
    userData['block_type'] = chance_view_response['block_type']
    userData['reason'] = chance_view_response['reason']
    userData['admin_outage'] = chance_view_response['outage']['admin_outage'] if (userData['block_type'] == "OUTAGE") else None
    if(userData['block_type'] == "OUTAGE"):
      userData['outage_start'] = chance_view_response['outage']['outage_start']
      userData['outage_end'] = chance_view_response['outage']['outage_end']
    # Append to List
    userStatsList.append(userData)
  # Add list to out
  out['user_objs'] = userStatsList
  # Return Object
  return JsonResponse(out)

###
# Get Lowest and Highest Rated Albums
###
def getLowestHighestAlbumStats(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getLowestHighestAlbumStats called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare out object
  out = {}
  # Get all albums from album of the day
  all_albums = DailyAlbum.objects.all()
  # Declare placeholders 
  lowest_album = None
  lowest_album_rating = 0.0
  lowest_album_date = None
  highest_album = None
  highest_album_rating = 0.0
  highest_album_date = None
  # Iterate through and retreive data
  for dailyAlbum in all_albums:
    album_rating = getAlbumRating(dailyAlbum.album.mbid, rounded=False, date=dailyAlbum.date)
    # If album rating is none, skip
    if(album_rating == None):
      continue
    # Check to see if album meets review requirements (must have 4 or more reviews) [ONLY MAKE THIS CHECK IF IN PROD]
    if((os.getenv("APP_ENV") == "PROD") and (Review.objects.filter(album=dailyAlbum.album).count() < 4)):
      continue
    # Check for lowest album
    if((lowest_album == None) or ((album_rating != None) and (album_rating < lowest_album_rating))):
      lowest_album = dailyAlbum.album
      lowest_album_rating = album_rating
      lowest_album_date = dailyAlbum.date
    # Check for highest album
    if(highest_album == None or (album_rating != None and album_rating > highest_album_rating)):
      highest_album = dailyAlbum.album
      highest_album_rating = album_rating
      highest_album_date = dailyAlbum.date
  # Populate out objects
  out['lowest_album'] = lowest_album.toJSON() if lowest_album else {}
  out['lowest_album']['rating'] = getAlbumRating(lowest_album.mbid, rounded=False) if lowest_album else 0.0
  out['lowest_album']['date'] = lowest_album_date if lowest_album_date else datetime.datetime.now().strftime("%Y-%m-%d")
  out['highest_album'] = highest_album.toJSON() if highest_album else {}
  out['highest_album']['rating'] = getAlbumRating(highest_album.mbid, rounded=False) if highest_album else 0.0
  out['highest_album']['date'] = highest_album_date if highest_album_date else datetime.datetime.now().strftime("%Y-%m-%d")
  # Return Object
  return JsonResponse(out)


###
# Get Submission count per user by month
###
def getSubmissionsByMonth(request: HttpRequest, year: str, month: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSubmissionsByMonth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare out object
  out = {}
  # Get all submissions this month
  submissions = Album.objects.filter(submission_date__year=year, submission_date__month=month)
  users = submissions.values_list('submitted_by__discord_id', flat=True).distinct()
  # Iterate through and get counts
  out['submission_counts'] = []
  for user_id in users:
    out['submission_counts'].append({
        "discord_id": user_id, 
        "count": submissions.filter(submitted_by__discord_id=user_id).count(),
        "percent": ((submissions.filter(submitted_by__discord_id=user_id).count()/float(len(submissions))) * 100)
      })
  # Also build out an object containing all of the users submissions for the month and that users stats for the month
  out['user_stats'] = {}
  for user_id in users:
    # Temp stats dict
    user_stats = {}
    # Get submissions by this user
    submissions_temp = submissions.filter(submitted_by__discord_id=user_id)
    # Populate stats object
    user_stats['discord_id'] = f"{user_id}", 
    user_stats["count"] = submissions_temp.count(),
    user_stats["percent"] = ((submissions_temp.count()/float(len(submissions))) * 100) if (len(submissions_temp) != 0) else 0
    user_stats["submissions"] = []
    for album in submissions_temp:
      user_stats["submissions"].append(album.toJSON())
    # Attach stats object to user_stats dict
    out['user_stats'][user_id] = user_stats
  # Mark single value of all submissions
  out['submission_total'] = submissions.count()
   # Attach timestamp
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return Object
  return JsonResponse(out)


###
# Return true if user is the uploader of the selected album, false if not
###
def isUserAlbumUploader(request: HttpRequest, mbid: str, user_discord_id: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("isUserAlbumUploader called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # If a user id is not provided, retrieve from request
  user = getUserObj(user_discord_id if user_discord_id else request.session['discord_id'])
  # Get album using aotd ID
  album = Album.objects.get(mbid=mbid)
  # Get submitter status
  out = (user == album.submitted_by)
  # Return Object
  return JsonResponse({'uploader': out})