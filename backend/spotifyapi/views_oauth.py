from django.http import HttpRequest, HttpResponse, JsonResponse

from .utils import (
  getAuthB64,
  createSpotifyUserFromResponse,
  isUserSpotifyConnected,
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
## OAuth METHODS
## =========================================================================================================================================================================================


###
# Check if a user has connected spotify to their account
###
def isSpotifyConnected(request: HttpRequest):
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