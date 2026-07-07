from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from .utils import (
  getAlbumRating,
  calculateUserReviewData,
  get_album_from_mb,
  retrieveAlbumSTD,
  hasReviewedToday
)
from users.utils import getUserObj
from .models import (
  AotdUserData,
  Album,
  AlbumCommentHistory,
  AlbumOwnershipHistory,
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
from datetime import timedelta
from django.db.models import Count, Q, F

# Declare logging
logger = logging.getLogger()

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
# If the user meets the criteria to be able to submit an album.
###
def checkIfUserCanSubmit(request: HttpRequest, date: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"checkIfUserCanSubmit called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
  # Calculate start and end of day
  start_of_day = datetime.datetime.combine(albumDay, datetime.time.min)
  end_of_day = start_of_day + datetime.timedelta(days=1)
  # Check if the user has submitted an album today
  already_submitted = Album.objects.filter(
      submitted_by=userObj,
      submission_date__gte=start_of_day,
      submission_date__lt=end_of_day
  ).exists()
  # If user has already submitted, they cannot submit again today
  if already_submitted:
    validityStatus['canSubmit'] = False
    validityStatus['reason'] = f"You have already submitted an album for today! ({albumDay}) (CST)"
    return JsonResponse(validityStatus)
  # A rescue also counts as a submission for the day
  already_rescued = AlbumOwnershipHistory.objects.filter(
      new_owner=userObj,
      transferred_at__gte=start_of_day,
      transferred_at__lt=end_of_day
  ).exists()
  if already_rescued:
    validityStatus['canSubmit'] = False
    validityStatus['reason'] = f"You have already rescued an album today! ({albumDay}) (CST)"
    return JsonResponse(validityStatus)
  # If the user has reviewed today, they can submit
  if not hasReviewedToday(userObj):
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
    logger.warning(f"checkIfAlbumAlreadyExists called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert response to Json
  logger.info(f"Checking if album with a release group ID {release_group_id} is already submitted...", extra={'crid': request.crid})
  # Declare out dict
  out = {}
  # Get album from database
  try:
    albumObject = Album.objects.get(release_group_id=release_group_id)
    if(albumObject):
      logger.info(f"Album does already exist, name: {albumObject.title}!", extra={'crid': request.crid})
    out['exists'] = True
    out['submitter_id'] = albumObject.submitted_by.discord_id
    out['submitter_nickname'] = albumObject.submitted_by.nickname
    out['submitter_active'] = albumObject.submitted_by.aotd_data.active # Determine if the user who submitted this album is active
    out['has_been_aotd'] = (DailyAlbum.objects.filter(album=albumObject).count() > 0) # Determine if the album attempting to be submitted as been AOTD before
    if(out['has_been_aotd']):
      # Get current timestamp 
      now = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
      out['last_aotd_date'] = DailyAlbum.objects.filter(album=albumObject, date__lte=now).order_by('-date')[0].date # Get last AOTD date
    out['valid_submission'] = (not out['submitter_active']) and (not out['has_been_aotd']) # If this is a valid submission despite existing already (This is an inactive user or "yard sale" situation)
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
    logger.warning(f"submitAlbum called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Ensure that album doesnt already exist in the pool
  try:
    albumObject = Album.objects.get(release_group_id=reqBody['album']['release-group']['id'])
    if(albumObject):
      logger.info(f"Album with release group already exists, name: {albumObject.title}!", extra={'crid': request.crid})
    out = {'succesful': False, 'status': 400, 'err_message': f'Album from release group already exists!'}
    return JsonResponse(out, status=out['status'])
  except ObjectDoesNotExist as e:
    # Get user from database
    user = getUserObj(request.session.get('discord_id'))
    # Query musicbrainz to get full album data using mbid (to avoid issues with params)
    newAlbum = get_album_from_mb(reqBody['album']['id'])
    # Populate submitter and user comment
    newAlbum.release_group_id = reqBody['album']['release-group']['id']
    newAlbum.submitted_by = user
    newAlbum.user_comment = reqBody['user_comment'] if (reqBody['user_comment'] != "") else "No Comment Provided"
    # Parse hidden field (if submitter wants the submission to be hidden (should only be admins))
    if("hidden" in reqBody['album']):
      hidden = reqBody['album']['hidden']
    else:
      hidden = False
    newAlbum.hidden = hidden
    # Save new album data
    newAlbum.save()
    # Update user data
    calculateUserReviewData(AotdUserData.objects.get(user=user))
    out = {'succesful': True, 'status': 200, 'err_message': 'N/A'}
    return JsonResponse(out, status=out['status'])
  

###
# Method to change ownership of an album, not submit a new one
###
def rescueAlbum(request: HttpRequest):
  """
  Change ownership of an album, expects the same request body as submitAlbum.
  This should only see use during a "yard-sale" or "rescue" event.
  """
  if request.method != "POST":
    logger.warning(f"rescueAlbum called with a non-POST method, returning 405.", extra={'crid': request.crid})
    return HttpResponse(status=405)
  reqBody = json.loads(request.body)
  user = getUserObj(request.session.get('discord_id'))
  release_group_id = reqBody['album']['release-group']['id']
  logger.info(f"User {user.nickname} attempting to rescue album with release group ID {release_group_id}.", extra={'crid': request.crid})
  try:
    kwargs = {'raw_data__release-group__id': release_group_id}
    albumObject = Album.objects.get(**kwargs)
  except ObjectDoesNotExist:
    logger.warning(f"rescueAlbum: Album with release group ID {release_group_id} not found.", extra={'crid': request.crid})
    out = {'succesful': False, 'status': 404, 'err_message': f'Provided Album ({reqBody["album"]["id"]}) does not exist!'}
    return JsonResponse(out, status=out['status'])
  # Re-validate rescue eligibility server-side
  submitter_active = albumObject.submitted_by.aotd_data.active
  has_been_aotd = DailyAlbum.objects.filter(album=albumObject).exists()
  if submitter_active or has_been_aotd:
    logger.warning(f"rescueAlbum: Album \"{albumObject.title}\" is not rescue-eligible (submitter_active={submitter_active}, has_been_aotd={has_been_aotd}). Returning 403.", extra={'crid': request.crid})
    out = {'succesful': False, 'status': 403, 'err_message': f'Provided Album ({reqBody["album"]["id"]}) is not eligible for rescue!'}
    return JsonResponse(out, status=out['status'])
  comment = reqBody.get('user_comment') or None
  logger.info(f"Transferring ownership of \"{albumObject.title}\" from {albumObject.submitted_by.nickname} to {user.nickname}.", extra={'crid': request.crid})
  albumObject.rescue(rescuer=user, comment=comment)
  calculateUserReviewData(AotdUserData.objects.get(user=user))
  logger.info(f"Album \"{albumObject.title}\" successfully rescued by {user.nickname}.", extra={'crid': request.crid})
  out = {'succesful': True, 'status': 200, 'err_message': "N/A"}
  return JsonResponse(out, status=out['status'])


###
# Attempt to Delete an Album from the AOtD Pool.
###
def deleteAlbum(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning(f"deleteAlbum called with a non-POST method, returning 405.", extra={'crid': request.crid})
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
      logger.warning(f"deleteAlbum: User {user.discord_id}/{user.nickname} attempted to delete Album: {reqBody['album_id']}, however did not submit said Album!", extra={'crid': request.crid})
      return HttpResponse(status=403)
    # Check if the album has been AOtD
    if(DailyAlbum.objects.filter(album=albumObject).count() > 0):
      logger.warning(f"deleteAlbum: User {user.discord_id}/{user.nickname} attempted to delete Album: {reqBody['album_id']}, FAILED due to Album having been AOtD!", extra={'crid': request.crid})
      return HttpResponse(status=403)
    # Delete album object from database
    albumObject.delete(deleter=user, reason=reqBody['reason'])
    logger.info(f"Album {reqBody['album_id']} has been deleted...", extra={'crid': request.crid})
    return HttpResponse(status=200)
  except ObjectDoesNotExist as e:
    # Throw error if the album is not in the database
    logger.warning(f"deleteAlbum: Album {reqBody['album_id']} does not exist in Albums DB", extra={'crid': request.crid})
    return HttpResponse(status=404)
  

###
# Get an Album from the album of the day pool.
###
def getAlbum(request: HttpRequest, mbid: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"submitAlbum called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    # Retrieve album from database
    albumObj = Album.objects.get(mbid=mbid)
    # Build return object
    out = {}
    out['album_pk'] = albumObj.pk
    out['raw_album_data'] = json.dumps(albumObj.raw_data)
    out['release_group'] = json.dumps(albumObj.raw_data['release-group'])
    out['disambiguation'] = albumObj.disambiguation
    out['title'] = albumObj.title
    out['album_id'] = albumObj.mbid
    out['mbid'] = albumObj.mbid
    out['album_img_src'] = albumObj.cover_url
    out['album_src'] = albumObj.album_url
    out['artist'] = {}
    out['artist']['name'] = albumObj.artist
    out['artist']['href'] = (albumObj.artist_url if albumObj.artist_url != "" else albumObj.raw_data['album']['artists'][0]['external_urls']['aotd'])
    out['submitter'] = albumObj.submitted_by.discord_id
    out['submitter_nickname'] = albumObj.submitted_by.nickname
    out['submitter_comment'] = albumObj.user_comment
    out['submission_date'] = timezone.localtime(albumObj.submission_date).strftime("%m/%d/%Y, %H:%M:%S")
    # If this album has been rescued, the original submitter is the previous owner in history
    recent_transfer = albumObj.ownership_history.order_by('-transferred_at').first()
    if recent_transfer and recent_transfer.previous_owner:
      out['submitter'] = recent_transfer.previous_owner.discord_id
      out['submitter_nickname'] = recent_transfer.previous_owner.nickname
      out['owner'] = albumObj.submitted_by.discord_id
      out['transfer_date'] = timezone.localtime(recent_transfer.transferred_at).strftime("%m/%d/%Y, %H:%M:%S")
    out['release_date_str'] = albumObj.raw_data['release-group']['first-release-date'] if ('first-release-date' in albumObj.raw_data['release-group'].keys()) else albumObj.release_date_str
    out['release_date'] = parseReleaseDate(out['release_date_str'])
    out['track_list'] = albumObj.track_list if albumObj.track_list else {"tracks": []}
  except ObjectDoesNotExist as e:
    out = {}
  # Return final object
  return JsonResponse(out)


###
# Replace an Album via its backend primary key, as is auto-assigned by the database.
###
def replaceAlbum(request: HttpRequest, album_pk: str, new_mbid: str):
  '''Replace an Album via its backend primary key, as is auto-assigned by the database. Expected to recieve an album pk and a replacement mbid.'''
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning(f"replaceAlbum called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare out object
  out = {}
  oldAlbumRaw = None
  newAlbumRaw = None
  try:
    # Retrieve old album from database
    oldAlbum = Album.objects.get(pk=album_pk)
    oldAlbumRaw = oldAlbum.raw_data
    # Query musicbrainz
    newAlbum = get_album_from_mb(new_mbid)
    newAlbumRaw = newAlbum.raw_data
    # Replace old album data with new album data. NOTE: NOT SAVING NEW ALBUM BECAUSE WE WANT TO REPLACE THE OLD ALBUM NOT GET A NEW ONE
    oldAlbum.mbid=newAlbum.mbid
    oldAlbum.title=newAlbum.title
    oldAlbum.artist=newAlbum.artist
    oldAlbum.artist_url=newAlbum.artist_url
    oldAlbum.cover_url=newAlbum.cover_url
    oldAlbum.album_url=newAlbum.album_url
    oldAlbum.disambiguation=newAlbum.disambiguation
    oldAlbum.release_date=newAlbum.release_date
    oldAlbum.release_date_str=newAlbum.release_date_str
    oldAlbum.raw_data=newAlbum.raw_data
    oldAlbum.track_list=newAlbum.track_list
    # Update old album
    oldAlbum.save()
    # Update out object
    out['successful'] = True
    out['status'] = 200
    out['album_mbid'] = oldAlbum.mbid
  except Album.DoesNotExist as e:
    out['successful'] = False
    out['status'] = 404
    out['err_message'] = f"Unable to find album with PK of {album_pk}!"
  except Exception as e:
    out['successful'] = False
    out['status'] = 500
    out['err_message'] = f"Unable to complete replace action, error: {e}"
  # Return final object
  log_extras = {
    "album_pk": album_pk,
    "new_mbid": new_mbid,
    "response_object": out,
    "crid": request.crid,
    "old_album_raw": oldAlbumRaw,
    "new_album_raw": newAlbumRaw,
    "response_obj": out
  }
  if(out['successful']):
    logger.info(
      f"Successfully replaced album {album_pk} with new mbid infomration.",
      extra=log_extras
    )
  else:
    logger.warning(
      f"Failed to replace album {album_pk} with new mbid information.",
      extra={**log_extras, **{"err_message": out['err_message']}}
    )
    logger.critical(out['err_message'])
  # Return JSON Response
  return JsonResponse(out, status=out['status'])


###
# Get ALL Album from the album of the day pool.
###
def getAllAlbums(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getAllAlbums called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res

  now = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))

  # Single DISTINCT ON query: latest DailyAlbum per album — replaced 3 correlated subqueries
  latest_daily = {
    d['album_id']: d
    for d in DailyAlbum.objects
      .filter(date__lte=now)
      .order_by('album_id', '-date')
      .distinct('album_id')
      .values('album_id', 'date', 'rating', 'standard_deviation')
  }

  albums = list(
    Album.objects
    .select_related('submitted_by')
    .defer('raw_data', 'track_list')
  )

  albumList = []
  for album in albums:
    user = album.submitted_by
    daily = latest_daily.get(album.pk, {})

    raw_rating = daily.get('rating')
    # 11.0 is the sentinel value meaning "day in progress, no stored rating yet"
    effective_rating = None if (raw_rating is None or raw_rating == 11.0) else raw_rating

    stddev = daily.get('standard_deviation')
    effective_stddev = stddev if (stddev is not None and stddev != 0.00) else None

    albumList.append({
      'title': album.title,
      'album_id': album.mbid,
      'album_img_src': album.cover_url,
      'album_src': album.album_url,
      'artist': {
        'name': album.artist,
        'href': album.artist_url,
      },
      'submitter': user.discord_id if user else None,
      'submitter_avatar_url': user.get_avatar_url() if user else None,
      'submitter_nickname': user.nickname if user else None,
      'submitter_comment': album.user_comment,
      'submission_date': timezone.localtime(album.submission_date).strftime("%m/%d/%Y, %H:%M:%S"),
      'release_date_str': album.release_date_str,
      'release_date': album.release_date.strftime("%m/%d/%Y, %H:%M:%S") if album.release_date else None,
      'last_aotd': daily.get('date'),
      'rating': effective_rating,
      'standard_deviation': effective_stddev,
      # Get user generated tags for the album
      'tags': [tag.toJSON(short=True) for tag in album.tags.filter(is_approved=True)]
    })

  return JsonResponse({"timestamp": datetime.datetime.now(), "albums_list": albumList})


###
# Get the average rating for an album.
# If a date is not provided in the url bar, will return the most recent aotd ratings for that album
###
def getAlbumAvgRating(request: HttpRequest, mbid: str, rounded: str = "true", date: str = None):
  # If date is not provided grab the most recent date of AOtD
  aotd_date = datetime.datetime.strptime(date, "%Y-%m-%d") if (date) else DailyAlbum.objects.filter(album__mbid=mbid).latest('date').date
  # Convert bool to string
  if(rounded == "true"):
    rounded = True
  else: 
    rounded = False
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getAlbumAvgRating called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getAlbumSTD called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  standardDev = retrieveAlbumSTD(mbid, date)
  return JsonResponse({"standard_deviation": standardDev})


###
# Return last X submitted or rescued albums
###
def getLastXSubOrRescueAlbums(request: HttpRequest, count: int):
  '''
  Return the last X submitted or rescued albums for use with the "Recent Album Submissions" UI
  '''
  from users.models import UserAction
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getLastXSubOrRescueAlbums called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get last X count of albums, excluding any that have since been deleted
  existing_album_ids = Album.objects.values_list('id', flat=True)
  last_X_submissions_or_rescues = UserAction.objects.filter(
    (Q(action_type='CREATE', entity_type='ALBUM') | Q(action_type='UPDATE', entity_type='ALBUM_OWNER')),
    entity_id__in=existing_album_ids
  ).order_by('-timestamp')[:count]
  # Build list of custom Album Objects
  action_list = []
  for album_action in last_X_submissions_or_rescues:
    obj = {}
    obj['action'] = album_action.action_type
    obj['entity'] = album_action.entity_type
    obj['entity_id'] = album_action.entity_id
    obj['album'] = Album.objects.get(id=album_action.entity_id).toJSON(include_raw=False)
    obj['action_details'] = album_action.details
    if(album_action.action_type == "UPDATE"):
      # Dynamically append user data if it appears in action details (TODO: Make this more dynamic than just hardcoded stuff)
      obj['action_details']['new_owner_nick'] = AotdUserData.objects.get(user__discord_id=obj['action_details']['new_owner_id']).user.nickname
      obj['action_details']['previous_owner_nick'] = AotdUserData.objects.get(user__discord_id=obj['action_details']['previous_owner_id']).user.nickname
    # Append to List
    action_list.append(obj)
  return JsonResponse({ "action_list": action_list, "timestamp" : datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")})


###
# Return last X submitted albums
###
def getLastXAlbums(request: HttpRequest, count: int):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getLastXAlbums called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get last X count of albums
  last_X = Album.objects.all().exclude(hidden=True).order_by('-submission_date')[:count]
  # Build list of custom Album Objects
  album_list = []
  for album in last_X:
    albumObj = {}
    albumObj['title'] = album.title
    albumObj['album_id'] = album.mbid
    albumObj['album_img_src'] = album.cover_url
    albumObj['artist'] = album.artist
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
    logger.warning(f"getAlbumsStats called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    two_year_ago = datetime.date.today() - datetime.timedelta(days=730)
    userData['submission_count'] = Album.objects.filter(submitted_by=user.user).count()
    userData['aotd_count'] = DailyAlbum.objects.filter(album__submitted_by=user.user).count()
    userData['unpicked_count'] = f"{max(0, (Album.objects.filter(submitted_by=user.user).count() - DailyAlbum.objects.filter(album__submitted_by=user.user, date__gte=two_year_ago).count()))}/100"
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
    userData['active'] = user.active
    # Append to List
    userStatsList.append(userData)
  # Add list to out
  out['user_objs'] = userStatsList
  # Return Object
  return JsonResponse(out)


###
# Get a specific user's Album Stats
###
def getUserAlbumsStats(request: HttpRequest, user_discord_id: str | None = None):
  # Avoid circular import
  from .views_aotd import getChanceOfAotdSelect
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getAlbumsStats called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all aotd users
  spotUser = AotdUserData.objects.get(user__discord_id=user_discord_id) if user_discord_id else AotdUserData.objects.get(user__discord_id=(request.session.get('discord_id')))
  # Get user Data
  userData = {}
  two_year_ago = datetime.date.today() - datetime.timedelta(days=730)
  userData['submission_count'] = Album.objects.filter(submitted_by=spotUser.user).count()
  userData['aotd_count'] = DailyAlbum.objects.filter(album__submitted_by=spotUser.user).count()
  try:
    last_selected_date = DailyAlbum.objects.filter(album__submitted_by=spotUser.user).filter(date__lte=datetime.datetime.now(tz=pytz.timezone('America/Chicago'))).order_by("-date").first().date
    time_since_last_selection: timedelta = datetime.datetime.now(tz=pytz.timezone('America/Chicago')).date() - last_selected_date
    userData['last_selected_date'] = last_selected_date.strftime("%Y-%m-%d")
    userData['days_since_selected'] = time_since_last_selection.days
  except:
    userData['last_selected_date'] = "--"
    userData['days_since_selected'] = (datetime.datetime.now(tz=pytz.timezone('America/Chicago')).date() - spotUser.creation_timestamp.date()).days
  userData['unpicked_count'] = f"{max(0, (Album.objects.filter(submitted_by=spotUser.user).count() - DailyAlbum.objects.filter(album__submitted_by=spotUser.user, date__gte=two_year_ago).count()))}/100"
  userData['discord_id'] = spotUser.user.discord_id
  userData['nickname'] = spotUser.user.nickname
  chance_view_response = json.loads(getChanceOfAotdSelect(request, spotUser.user.discord_id).content)
  userData['selection_blocked'] = (chance_view_response['block_type'] != None)
  userData['selection_chance'] = chance_view_response['percentage']
  userData['block_type'] = chance_view_response['block_type']
  userData['reason'] = chance_view_response['reason']
  userData['admin_outage'] = chance_view_response['outage']['admin_outage'] if (userData['block_type'] == "OUTAGE") else None
  if(userData['block_type'] == "OUTAGE"):
    userData['outage_start'] = chance_view_response['outage']['outage_start']
    userData['outage_end'] = chance_view_response['outage']['outage_end']
  # Return Object
  return JsonResponse(userData)


###
# Get Lowest and Highest Rated Albums
###
def getLowestHighestAlbumStats(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getLowestHighestAlbumStats called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Declare out object
  out = {}
  # Declare placeholders 
  lowest_album_date = None
  highest_album_date = None
  # Determine how many reviews to count
  review_count_limit = 4 if (os.getenv("APP_ENV") == "PROD") else 1
  # Query albums that have been aotd and sort by rating
  daily_albums = DailyAlbum.objects \
    .exclude(rating=11.0) \
    .exclude(rating=None) \
    .annotate(review_count=Count('album__reviews', filter=Q(album__reviews__aotd_date=F('date')))) \
    .filter(review_count__gte=review_count_limit) \
    .order_by('-rating', '-date')
  # Get the last album
  lowest_daily_album = daily_albums.last()
  lowest_album = lowest_daily_album.album
  lowest_album_date = lowest_daily_album.date
  # Get the first album
  highest_daily_album = daily_albums.first()
  highest_album = highest_daily_album.album
  highest_album_date = highest_daily_album.date
  # Guard against empty queryset
  if highest_daily_album is None or lowest_daily_album is None:
    return JsonResponse({'highest_album': {}, 'lowest_album': {}})
  # Populate out objects
  out['lowest_album'] = lowest_album.toJSON() if lowest_album else {}
  out['lowest_album']['rating'] = lowest_daily_album.rating
  out['lowest_album']['date'] = lowest_album_date if lowest_album_date else datetime.datetime.now().strftime("%Y-%m-%d")
  out['highest_album'] = highest_album.toJSON() if highest_album else {}
  out['highest_album']['rating'] = highest_daily_album.rating
  out['highest_album']['date'] = highest_album_date if highest_album_date else datetime.datetime.now().strftime("%Y-%m-%d")
  # Return Object
  return JsonResponse(out)


###
# Get Submission count per user by month
###
def getSubmissionsByMonth(request: HttpRequest, year: str, month: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getSubmissionsByMonth called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    logger.warning(f"isUserAlbumUploader called with a non-GET method, returning 405.", extra={'crid': request.crid})
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


###
# Update the user_comment on an album. Only the original submitter or an admin may do this.
# Creates an AlbumCommentHistory snapshot before overwriting and logs a UserAction for the audit trail.
###
def updateAlbumSubmission(request: HttpRequest):
  if request.method != "POST":
    logger.warning(f"updateAlbumSubmission called with a non-POST method, returning 405.", extra={'crid': request.crid})
    return HttpResponse("Method not allowed", status=405)
  # Parse request body
  reqBody = json.loads(request.body)
  mbid = reqBody.get('mbid', '')
  new_comment = reqBody.get('new_comment', '')
  # Reject empty comments
  if not new_comment or not new_comment.strip():
    return HttpResponse("Comment may not be empty", status=400)
  try:
    album = Album.objects.get(mbid=mbid)
  except ObjectDoesNotExist:
    return HttpResponse("Album not found", status=404)
  # Only the original submitter or staff may edit
  user = getUserObj(request.session.get('discord_id'))
  if album.submitted_by != user and not user.is_staff:
    logger.warning(f"updateAlbumSubmission: User {user.discord_id}/{user.nickname} attempted to edit comment on album {mbid} without permission.", extra={'crid': request.crid})
    return HttpResponse("Forbidden", status=403)
  album.user_comment = new_comment
  album.save(edited_by=user)
  logger.info(f"updateAlbumSubmission: User {user.discord_id}/{user.nickname} updated comment on album {mbid}.", extra={'crid': request.crid})
  return HttpResponse(status=200)


###
# Return the full comment edit history for an album, newest first, with the current
# comment prepended as the "current" entry for diff display.
#
# Timestamp note: AlbumCommentHistory.recorded_at is when a version was *replaced*,
# not when it *started*. We compute created_at as the *start* time of each version:
#   - original comment: Album.submission_date
#   - each subsequent version: the recorded_at of the entry it replaced
#   - current version: the recorded_at of the most recent history entry
###
def getAlbumCommentHistory(request: HttpRequest, mbid: str):
  if request.method != "GET":
    logger.warning(f"getAlbumCommentHistory called with a non-GET method, returning 405.", extra={'crid': request.crid})
    return HttpResponse("Method not allowed", status=405)
  try:
    album = Album.objects.get(mbid=mbid)
  except ObjectDoesNotExist:
    return HttpResponse("Album not found", status=404)
  # Newest-first so the last entry in the final list is the original comment
  history_qs = list(AlbumCommentHistory.objects.filter(album=album).order_by('-recorded_at'))
  entries = []
  last_i = len(history_qs) - 1
  for i, entry in enumerate(history_qs):
    # created_at: when this version *started*. For non-original entries it's when the
    # preceding (older) edit was recorded; for the original it's the album submission date.
    created_at = history_qs[i + 1].recorded_at if i < last_i else album.submission_date
    row = entry.toJSON()
    row['created_at'] = timezone.localtime(created_at).strftime("%m/%d/%Y, %H:%M:%S") if created_at else None
    # admin_edit: was *this* version created by an admin edit? That's the edit captured in
    # the next (older) history entry. The original was never created by an edit.
    row['admin_edit'] = history_qs[i + 1].admin_edit if i < last_i else False
    entries.append(row)
  # Current version started when the most recent history entry was recorded
  current_created_at = timezone.localtime(history_qs[0].recorded_at).strftime("%m/%d/%Y, %H:%M:%S") if history_qs else None
  current_entry = {
    "id": None,
    "user_comment": album.user_comment,
    "created_at": current_created_at,
    "edited_by": history_qs[0].edited_by.discord_id,
    "edited_by_nickname": history_qs[0].edited_by.nickname,
    "admin_edit": history_qs[0].admin_edit if history_qs else False
  }
  entries.insert(0, current_entry)
  return JsonResponse({"history": entries})


###
# Return the comment that was in effect on a given AOTD date, plus a flag indicating
# whether it has since been updated. Used by the calendar page to show the original message.
#
# Logic: AlbumCommentHistory stores the *previous* comment before each edit.
# The first history entry with recorded_at > aotd_midnight is the earliest edit
# that happened *after* the AOTD date, meaning its stored comment was the one
# in effect AT the AOTD time.
###
def getAlbumCommentAtDate(request: HttpRequest, mbid: str, aotd_date: str):
  if request.method != "GET":
    logger.warning(f"getAlbumCommentAtDate called with a non-GET method, returning 405.", extra={'crid': request.crid})
    return HttpResponse("Method not allowed", status=405)
  try:
    album = Album.objects.get(mbid=mbid)
    DailyAlbum.objects.get(album=album, date=aotd_date)
  except ObjectDoesNotExist:
    return HttpResponse("Album or AOTD date not found", status=404)
  # Treat AOTD selection as occurring at midnight CST on the given date
  cst = pytz.timezone('America/Chicago')
  aotd_midnight = cst.localize(datetime.datetime.strptime(aotd_date, "%Y-%m-%d"))
  # The earliest edit recorded after that midnight holds the comment that was live at selection time
  first_edit_after = (
    AlbumCommentHistory.objects
    .filter(album=album, recorded_at__gt=aotd_midnight)
    .order_by('recorded_at')
    .first()
  )
  if first_edit_after:
    # Comment was changed after AOTD; the history entry holds the pre-edit (original) text
    return JsonResponse({
      "comment": first_edit_after.user_comment,
      "was_updated_since_aotd": True
    })
  # No edits after AOTD — current comment is the one that was live at selection time
  return JsonResponse({
    "comment": album.user_comment,
    "was_updated_since_aotd": False
  })