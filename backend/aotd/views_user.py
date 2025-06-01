from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict

from users.utils import getSpotifyUser

from .models import (
  AotdUserData,
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
  # Iterate and retrieve AotdUserData entries
  spotUserList = AotdUserData.objects.all()
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
  # Iterate and retrieve AotdUserData entries
  spotUserList = AotdUserData.objects.all()
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
  userCount = AotdUserData.objects.count()
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
  if(userObj.spotify_connected):
    userSpotObj = AotdUserData.objects.filter(user = userObj).first()
    dir_response = model_to_dict(userSpotObj)
    dir_response['user'] = userSpotObj.user.nickname
    dir_response['user_discord_id'] = userSpotObj.user.discord_id
    return JsonResponse(dir_response)
  else:
    return JsonResponse({})


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
  flag_status = (AotdUserData.objects.get(user=user)).selection_blocked_flag
  logger.info(f"Returning selection blocked flag status of {flag_status} for user {user.discord_id}...")
  return JsonResponse({"selection_blocked": flag_status})