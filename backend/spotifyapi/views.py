from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict

from .utils import (
  getAuthB64,
  storeSpotDataInSession,
  createSpotifyUserFromResponse,
  isSpotifyTokenExpired,
  refreshSpotifyToken,
  isUserSpotifyConnected,
)

from users.utils import getSpotifyUser

from users.models import User
from .models import SpotifyUserData

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
  spotifyRes = requests.post("https://accounts.spotify.com/api/token", headers=reqHeaders, data=reqData)
  if(spotifyRes.status_code != 200):
    print("Error in request:\n" + str(spotifyRes.json()))
    spotifyRes.raise_for_status()
  # Convert response to Json
  logger.info("Spotify api returned, converting to json...")
  spotifyResJSON = spotifyRes.json()
  # Store Spotify Token Data in Session
  storeSpotDataInSession(request, spotifyResJSON)
  # Retrieve spotify user data to set up an account
  reqHeaders = {
    'Authorization': f"Authorization: Bearer {request.session['spotify_access_token']}"
  }
  try:
    logger.info("Making request to spotify api for User Data to create spotify user entry...")
    spotifyRes = requests.get("https://api.spotify.com/v1/me", headers=reqHeaders)
    if(spotifyRes.status_code != 200):
      print("Error in request:\n" + str(spotifyRes.json()))
      spotifyRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to Json
  spotifyResJSON = spotifyRes.json()
  # Create spotify user data object if required
  createSpotifyUserFromResponse(request, spotifyResJSON)
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
  # Attempt to refresh token, if that fails, return a blank json object 
  # Check for expired token
  if(isSpotifyTokenExpired(request)):
    refreshSpotifyToken(request)
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSpotifyToken called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Prepare Header Data
  reqHeaders = { 
    'Authorization': f"Authorization: Bearer {request.session.get('spotify_access_token')}"
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
  # TODO: Add logic here to store this data (massive data) to allow users to view other user's data
  # Return Spotify Response
  return JsonResponse(spotifyResJSON)