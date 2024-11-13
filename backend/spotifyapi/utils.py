from django.http import HttpRequest

import logging
from dotenv import load_dotenv
import os
import json
import base64
import datetime
import requests

from users.models import User
from .models import SpotifyUserData

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


# Return Base64 Encoded authorization for headers
def getAuthB64():
  auth_string = f"{os.getenv('SPOTFY_CLIENT_ID')}:{os.getenv('SPOTFY_CLIENT_SECRET')}"
  auth_string_bytes = auth_string.encode("ascii")

  base64_bytes = base64.b64encode(auth_string_bytes)
  base64_string = base64_bytes.decode("ascii")
  # Return base64 encoded string
  return base64_string


def storeSpotDataInSession(request: HttpRequest, spotifyResJSON: json):
  logger.info("Attempting to store spotify token data in session object...")
  # Store token data in session data object
  request.session['spotify_access_token'] = spotifyResJSON['access_token']
  request.session['spotify_token_type'] = spotifyResJSON['token_type']
  request.session['spotify_scope'] = spotifyResJSON['scope']
  # Calculate Expiry time then store as string
  expiryTime = datetime.datetime.now() + datetime.timedelta(seconds=spotifyResJSON['expires_in'])
  request.session["spotify_expiry_date"] = expiryTime.strftime("%d-%m-%Y %H:%M:%S")
  request.session['spotify_refresh_token'] = spotifyResJSON['refresh_token']
  # Return True
  return True


def isSpotifyTokenExpired(request: HttpRequest):
  logger.info("Checking if spotify token is expired...")
  # Get current time
  curTime = datetime.datetime.now()
  # Get session Expiry time
  tokenExpireTime = datetime.datetime.strptime(request.session['spotify_expiry_date'], "%d-%m-%Y %H:%M:%S")
  # Check if request session's spotify token is out of date
  if(curTime > tokenExpireTime):
    logger.info("Token IS expired...")
    return True
  # Return false if not expired
  return False


def refreshSpotifyToken(request: HttpRequest):
  logger.info("Refreshing Spotify Token...")
  # Retrieve session data
  refreshToken = request.session['spotify_refresh_token']
  # Prep request data and headers to spotify api
  reqHeaders = { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': f"Basic {getAuthB64()}"
  }
  reqData = {
     'grant_type': 'refresh_token',
     'refresh_token': refreshToken
   }
  # Make request to spotify api
  spotifyRes = requests.post("https://accounts.spotify.com/api/token", headers=reqHeaders, data=reqData)
  if(spotifyRes.status_code != 200):
    logger.error("Error in request:\n" + spotifyRes.reason)
    logger.info("More Info: \n" + json.dumps(spotifyRes.json()))
    spotifyRes.raise_for_status()
  # Convert response to Json
  spotifyResJSON = spotifyRes.json()
  # Store discord data in session data
  storeSpotDataInSession(request, spotifyResJSON)
  # Return True if Successful
  return True


def createSpotifyUserFromResponse(request: HttpRequest, spotifyResJSON: json):
  # Retrieve users discord_id from session
  discord_id = request.session.get("discord_id")
  # Get user object from DB
  site_user = User.objects.get(discord_id = discord_id)
  # Check if an entry exists for current user
  logger.info(f"Checking if spotify data exists for discord ID {discord_id} (User {site_user.nickname})...")
  if(SpotifyUserData.objects.filter(user = site_user).exists()):
    logger.info(f"Spotify Data already exists for user {site_user.nickname} with discord ID: {site_user.discord_id}!...")
    return
  # Create new spotify user from json data
  logger.info(f"Creating new spotify data for discord ID {discord_id} (User {site_user.nickname})...")
  spotifyUser = SpotifyUserData(
    user = site_user,
    country = spotifyResJSON['country'],
    display_name = spotifyResJSON['display_name'],
    email = spotifyResJSON['email'],
    follower_count = spotifyResJSON['followers']['total'],
    spotify_url = spotifyResJSON['href'],
    spotify_id = spotifyResJSON['id'],
    membership_type = spotifyResJSON['product']
  )
  # If user data for image exists, set it
  if(len(spotifyResJSON['images']) > 0):
    spotifyUser.user_pfp_url = spotifyResJSON['images'][0]['url'],
    spotifyUser.user_pfp_height = spotifyResJSON['images'][0]['height'],
    spotifyUser.user_pfp_width = spotifyResJSON['images'][0]['width'],
  # Save Spotify User Data Obj
  spotifyUser.save()
  # Toggle User's 'spotify_connected' Field
  site_user.spotify_connected = True
  site_user.save()
  logger.info(f"New Spotify data created for discord ID {discord_id} (User {site_user.nickname})!")
  # Return True
  return True


# Return status of user's spotify connection (true if user has verififed with spotify)
def isUserSpotifyConnected(request: HttpRequest):
  # Retrieve users discord_id from session
  discord_id = request.session.get("discord_id")
  # Get user object from DB
  site_user = User.objects.get(discord_id = discord_id)
  # Return boolean of spotify connection status
  return site_user.spotify_connected