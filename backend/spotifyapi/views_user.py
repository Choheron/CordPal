from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict

from .utils import (
  isSpotifyTokenExpired,
  refreshSpotifyToken,
)

from users.utils import getSpotifyUser

from .models import (
  SpotifyUserData,
)

import logging
import requests
from dotenv import load_dotenv
import os
import json

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


## =========================================================================================================================================================================================
## USER METHODS
## =========================================================================================================================================================================================


###
# Get a list of users who have connected spotify
###
def getSpotifyUsersObj(request: HttpRequest):
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
# Get a list of users who have connected spotify as a raw list
###
def getSpotifyUsersList(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyUsersList called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Iterate and retrieve SpotifyUserData entries
  spotUserList = SpotifyUserData.objects.all()
  # Declare and populate out dict
  out = []
  for spotUser in spotUserList:
    tempDict = model_to_dict(spotUser)
    tempDict['discord_id'] = spotUser.user.discord_id
    tempDict['avatar_src'] = spotUser.user.get_avatar_url()
    tempDict['nickname'] = spotUser.user.nickname
    # Store tempDict in out json
    out.append(tempDict)
  return JsonResponse({"users": out})


###
# Get a count of all users in the Spotify DB
###
def getSpotifyUserCount(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyUserCount called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Return user count
  userCount = SpotifyUserData.objects.count()
  # Create response 
  usersCountData = {"count": str(userCount)}
  # Return json containing count
  return JsonResponse(usersCountData)


###
# Retrieve spotify Data from databse for current user
###
def getSpotifyData(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user object
  userObj = getSpotifyUser(request.session.get('discord_id'))
  # Ensure user has authenticated with spotify before
  if(userObj.aotd_enrolled):
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
# Return if the user is currently blocked from having their albums picked for the AOtD
###
def getSelectionBlockedFlag(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSelectionBlockedFlag called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user data from session
  user = getSpotifyUser(request.session.get('discord_id'))
  # Retrieve and return that user's flag status
  flag_status = (SpotifyUserData.objects.get(user=user)).selection_blocked_flag
  logger.info(f"Returning selection blocked flag status of {flag_status} for user {user.discord_id}...")
  return JsonResponse({"selection_blocked": flag_status})