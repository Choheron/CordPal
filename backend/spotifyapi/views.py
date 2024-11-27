from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict

from .utils import (
  getAuthB64,
  createSpotifyUserFromResponse,
  isSpotifyTokenExpired,
  refreshSpotifyToken,
  isUserSpotifyConnected,
)

from users.utils import getSpotifyUser

from users.models import User
from .models import (
  SpotifyUserData,
  Album,
  Review,
  DailyAlbum
)

import logging
import requests
from dotenv import load_dotenv
import os
import json
import datetime
import random

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


###
# Check if a user has connected spotify to their account
###
def isSpotifyConnected(request: HttpRequest):
  logger.info("isSpotifyConnected called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("isSpotifyConnected called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # return jsonResponse containing status
  return JsonResponse({'connected': isUserSpotifyConnected(request)})


###
# Get a list of users who have connected spotify
###
def getSpotifyUsersObj(request: HttpRequest):
  logger.info("getSpotifyUsersList called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyUsersList called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Iterate and retrieve SpotifyUserData entries
  spotUserList = SpotifyUserData.objects.all()
  # Declare and populate out dict
  out = {}
  for spotUser in spotUserList:
    tempDict = model_to_dict(spotUser)
    tempDict['discord_id'] = spotUser.user.discord_id
    # Store tempDict in out json
    out[tempDict['discord_id']] = tempDict
  return JsonResponse(out)


###
# Exchange spotify auth code for spotify api token. This will create a spotify user data entry, which has a one-to-one relationship with a user.
###
def doSpotifyTokenSwap(request: HttpRequest):
  logger.info("getSpotifyToken called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("getSpotifyToken called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Body data
  reqBody = json.loads(request.body)
  # Retrieve code from request
  spotifyCode = reqBody['code']
  # Retrieve required data from ENV files
  spotifyRedirectURI = os.getenv("SPOTIFY_REDIRECT_URI")
  # Prepare Header Data
  reqHeaders = { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': f"Basic {getAuthB64()}"
  }
  # Prepare body data
  reqData = {
    'grant_type': 'authorization_code',
    'code': spotifyCode,
    'redirect_uri': spotifyRedirectURI,
  }
  # Make request to spotify api
  logger.info("Making request to spotify api for Auth Token...")
  spotifyAuthRes = requests.post("https://accounts.spotify.com/api/token", headers=reqHeaders, data=reqData)
  if(spotifyAuthRes.status_code != 200):
    print("Error in request:\n" + str(spotifyAuthRes.json()))
    spotifyAuthRes.raise_for_status()
  # Convert response to Json
  logger.info("Spotify api returned, converting to json...")
  spotifyAuthResJSON = spotifyAuthRes.json()
  # Retrieve spotify user data to set up an account
  reqHeaders = {
    'Authorization': f"Bearer {spotifyAuthResJSON['access_token']}"
  }
  try:
    logger.info("Making request to spotify api for User Data to create spotify user entry...")
    logger.info(f"Making request to spotify with headers: {reqHeaders}...")
    spotifyRes = requests.get("https://api.spotify.com/v1/me", headers=reqHeaders)
    if(spotifyRes.status_code != 200):
      print("Error in request:\n" + str(spotifyRes))
      spotifyRes.raise_for_status()
  except Exception as e:
    logger.warning(f"Error getting user data from spotify! Error: {e}")
    return HttpResponse(status=500)
  # Convert response to Json
  spotifyResJSON = spotifyRes.json()
  # Create spotify user data object if required (includes auth data now)
  createSpotifyUserFromResponse(request, spotifyResJSON, spotifyAuthResJSON)
  # Write success message
  messageOut = { 'message': "Success" }
  # Return Code
  logger.info("Returning HTTP 200 Response...")
  return HttpResponse(content=messageOut, content_type='text/json', status=200)
  

###
# Retrieve spotify Data from databse for current user
###
def getSpotifyData(request: HttpRequest):
  logger.info("getSpotifyData called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user object
  userObj = getSpotifyUser(request.session.get('discord_id'))
  # Ensure user has authenticated with spotify before
  if(userObj.spotify_connected):
    userSpotObj = SpotifyUserData.objects.filter(user = userObj).first()
    dir_response = model_to_dict(userSpotObj)
    dir_response['user'] = userSpotObj.user.nickname
    dir_response['user_discord_id'] = userSpotObj.user.discord_id
    return JsonResponse(dir_response)
  else:
    return JsonResponse({})
  

###
# Get Top Items for User, expects body items of type, time_range, limit, and offset...
###
def getTopItems(request: HttpRequest, item_type, time_range, limit, offset):
  logger.info("getTopItems called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getTopItems called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check for expired token
  if(isSpotifyTokenExpired(request)):
    refreshSpotifyToken(request)
  # Retrieve user data obj from DB
  spotUserDataObj = SpotifyUserData.objects.filter(user = getSpotifyUser(request.session.get('discord_id'))).first()
  # Prepare Header Data
  reqHeaders = { 
    'Authorization': f"Bearer {spotUserDataObj.access_token}"
  }
  # Make request to spotify api
  logger.info(f"Making request to spotify for top items with following requests: type={item_type}, time_range={time_range}, limit={limit}, offset={offset} USER: {request.session.get('discord_id')}...")
  spotifyRes = requests.get(f"https://api.spotify.com/v1/me/top/{item_type}?time_range={time_range}&limit={limit}&offset={offset}", headers=reqHeaders)
  if(spotifyRes.status_code != 200):
    print("Error in request:\n" + str(spotifyRes.json()))
    spotifyRes.raise_for_status()
  # Convert response to Json
  logger.info("Spotify api returned, converting to json...")
  spotifyResJSON = spotifyRes.json()
  # Store top song data in user TODO: Make this not as clunky (Refactor this to store time based data on users)
  if(item_type == "tracks"):
    if(time_range == "long_term"):
      logger.info(f"Storing long term track for user {spotUserDataObj.display_name}...")
      spotUserDataObj.top_track_long_term = json.dumps(spotifyResJSON['items'][0])
      spotUserDataObj.save()
  # TODO: Add logic here to store this data (massive data) to allow users to view other user's data
  # Return Spotify Response
  return JsonResponse(spotifyResJSON)


###
# Submit a search query to spotify to get items...
###
def spotifySearch(request: HttpRequest, item_type, query, limit, offset):
  logger.info("spotifySearch called...")
  # Check for expired token
  if(isSpotifyTokenExpired(request)):
    refreshSpotifyToken(request)
  # Retrieve user data obj from DB
  spotUserDataObj = SpotifyUserData.objects.filter(user = getSpotifyUser(request.session.get('discord_id'))).first()
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyToken called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Prepare Header Data
  reqHeaders = { 
    'Authorization': f"Bearer {spotUserDataObj.access_token}"
  }
  # Make request to spotify api
  logger.info(f"Making request to spotify search with following urlParams: type={item_type}, query={query}, limit={limit}, offset={offset} USER: {request.session.get('discord_id')}...")
  spotifySearchRes = requests.get(f"https://api.spotify.com/v1/search?type={item_type}&q={query}&limit={limit}&market=US&offset={offset}", headers=reqHeaders)
  if(spotifySearchRes.status_code != 200):
    print("Error in request:\n" + str(spotifySearchRes))
    spotifySearchRes.raise_for_status()
  # Convert response to Json
  logger.info("Spotify search api returned, converting to json...")
  spotifyResJSON = spotifySearchRes.json()
  # Return Spotify Response
  return JsonResponse(spotifyResJSON)

###
# Check if an album already exists in the database
###
def checkIfAlbumAlreadyExists(request: HttpRequest, album_spotify_id: str):
  logger.info("checkIfAlbumAlreadyExists called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfAlbumAlreadyExists called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert response to Json
  logger.info(f"Checking if album with ID {album_spotify_id} is already submitted...")
  # Declare out dict
  out = {}
  # Get album from batabase
  try:
    albumObject = Album.objects.get(spotify_id = album_spotify_id)
    if(albumObject):
      logger.info(f"Album does already exist, name: {albumObject.title}!")
    out['exists'] = True
  except ObjectDoesNotExist as e:
    out['exists'] = False
  # Return Spotify Response
  return JsonResponse(out)


###
# Submit an Album to the album of the day pool.
###
def submitAlbum(request: HttpRequest):
  logger.info("submitAlbum called...")
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
    albumObject = Album.objects.get(spotify_id = reqBody['album']['id'])
    if(albumObject):
      logger.info(f"Album already exists, name: {albumObject.title}!")
    return HttpResponse(400)
  except ObjectDoesNotExist as e:
    # Get user from database
    user = getSpotifyUser(request.session.get('discord_id'))
    # Declare new album object
    newAlbum = Album(
      spotify_id=reqBody['album']['id'],
      title=reqBody['album']['name'],
      artist=reqBody['album']['artists'][0]['name'],
      artist_url=reqBody['album']['artists'][0]['external_urls']['spotify'],
      cover_url=reqBody['album']['images'][0]['url'],
      spotify_url=reqBody['album']['external_urls']['spotify'],
      submitted_by=user,
      user_comment=(reqBody['user_comment'] if reqBody['user_comment'] != "" else "No Comment Provided"),
      raw_data=reqBody,
    )
    # Save new album data
    newAlbum.save()
    return HttpResponse(200)
  

###
# Submit an Album to the album of the day pool.
###
def getAlbum(request: HttpRequest, album_spotify_id: str):
  logger.info("submitAlbum called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("submitAlbum called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve album from database
  albumObj = Album.objects.get(spotify_id=album_spotify_id)
  # Build return object
  out = {}
  out['raw_data'] = model_to_dict(albumObj)
  out['raw_album_data'] = json.dumps(albumObj.raw_data)
  out['title'] = albumObj.title
  out['album_id'] = albumObj.spotify_id
  out['album_img_src'] = albumObj.cover_url
  out['album_src'] = albumObj.spotify_url
  out['artist'] = {}
  out['artist']['name'] = albumObj.artist
  out['artist']['href'] = (albumObj.artist_url if albumObj.artist_url != "" else albumObj.raw_data['album']['artists'][0]['external_urls']['spotify'])
  out['submitter'] = albumObj.submitted_by.discord_id
  out['submitter_comment'] = albumObj.user_comment
  out['submission_date'] = albumObj.submission_date.strftime('%Y-%m-%d')
  # Return final object
  return JsonResponse(out)


###
# Get the average rating for an album.
###
def getAlbumAvgRating(request: HttpRequest, album_spotify_id: str):
  logger.info("getAlbumAvgRating called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumAvgRating called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve album from database
  albumObj = Album.objects.get(spotify_id=album_spotify_id)
  # Get average review score of album
  reviewList = Review.objects.filter(album=albumObj)
  review_sum = 0.0
  for review in reviewList:
    review_sum += float(review.score)
  # Calculate Average
  rating = (round((review_sum/float(len(reviewList)))*2)/2 if len(reviewList) > 0 else 0.0)
  return JsonResponse({"rating": rating})


###
# Submit a new review of an album by a user.
###
def submitReview(request: HttpRequest):
  logger.info("submitReview called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("submitReview called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Get user from database
  userObj = getSpotifyUser(request.session.get('discord_id'))
  # Get Album from the database
  albumObj = Album.objects.get(spotify_id=reqBody['album_id'])
  # Check if a review already exists for this user
  try:
    reviewObj = Review.objects.get(album=albumObj, user=userObj)
    reviewObj.score = float(reqBody['score'])
    reviewObj.review_text = reqBody['comment']
    # Save/Update Object
    reviewObj.save()
  except Review.DoesNotExist:
    # Declare new Review object
    newReview = Review(
      album=albumObj,
      user=userObj,
      score=float(reqBody['score']),
      review_text=reqBody['comment'],
    )
    # Save new Review data
    newReview.save()
  return HttpResponse(200)


###
# Get All Reviews for a specific album. //TODO: Test with album
###
def getReviewsForAlbum(request: HttpRequest, album_spotify_id: str):
  logger.info("getReviewsForAlbum called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getReviewsForAlbum called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get Album from the database
  albumObj = Album.objects.get(spotify_id=album_spotify_id)
  # Get all reivews for album
  reviewsObj = Review.objects.filter(album=albumObj)
  # Declare outlist and populate
  outList = []
  for review in reviewsObj:
    outObj = {}
    outObj['user_id'] = review.user.discord_id
    outObj['album_id'] = review.album.spotify_id
    outObj['score'] = review.score
    outObj['comment'] = review.review_text
    outObj['review_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['last_upated'] = review.last_updated.strftime("%m/%d/%Y, %H:%M:%S")
    # Append to list
    outList.append(outObj)
  # Return list of reviews
  return JsonResponse({"review_list": outList})


###
# Get All Reviews for a specific album. Returns a spotify album id and date
###
def getAlbumOfDay(request: HttpRequest, date: str = datetime.date.today().strftime('%Y-%m-%d')):
  logger.info("getAlbumOfDay called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumOfDay called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert String to date
  date_format = '%Y-%m-%d'
  albumDay = datetime.datetime.strptime(date, date_format).date()
  # Get Album from the database
  try:
    dailyAlbumObj = DailyAlbum.objects.get(date=albumDay)
  except DailyAlbum.DoesNotExist:
    out = {}
    out['err_message'] = 'Not Found'
    print(f'Daily Album not Found for: {date}')
    return JsonResponse(out)
  # Return album of passed in day
  out = {} 
  out['raw_response'] = model_to_dict(dailyAlbumObj)
  out['album_id'] = dailyAlbumObj.album.spotify_id
  out['album_name'] = dailyAlbumObj.album.title
  out['date'] = date
  return JsonResponse(out)


###
# Get All Reviews for a specific album. Returns a spotify album id and date
###
def getLastXAlbums(request: HttpRequest, count: int):
  logger.info("getLastXAlbums called...")
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
    albumObj['album_img_src'] = album.cover_url
    albumObj['album_src'] = album.spotify_url
    albumObj['submitter'] = album.submitted_by.nickname
    albumObj['submission_date'] = album.submission_date
    albumObj['raw_album'] = album.raw_data
    # Append to List
    album_list.append(albumObj)
  return JsonResponse({ "album_list": album_list, "timestamp" : datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")})


###
# Set a new album of the day.. return 
###
def setAlbumOfDay(request: HttpRequest):
  logger.info("setAlbumOfDay called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("setAlbumOfDay called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get current date
  day = datetime.date.today()
  # Check if a current album of the day already exists
  try:
    currDayAlbum = DailyAlbum.objects.get(date=day)
    logger.warning(f"WARN: Album of the day already selected: {currDayAlbum}")
    return HttpResponse(425)
  except DailyAlbum.DoesNotExist:
    print("Today does not yet have an album, selecting one...")
  # Get Date a year ago to filter by
  one_year_ago = day - datetime.timedelta(days=365)
  # Define a boolean for selecting the right album
  selected = False
  # Define Album Object
  albumOfTheDay = None
  while(not selected):
    tempAlbum = random.choice(Album.objects.all())
    try:
      albumCheck = DailyAlbum.objects.filter(date__gte=one_year_ago).get(album=tempAlbum)
    except DailyAlbum.DoesNotExist:
      albumOfTheDay = tempAlbum
      selected = True
  # Create an album of the day object
  albumOfTheDayObj = DailyAlbum(
    album=albumOfTheDay,
    date=day
  )
  # Save object
  albumOfTheDayObj.save()
  # Print success
  logger.info(f'Successfully selected album of the day: {albumOfTheDayObj}')
  return HttpResponse(200)