from django.http import HttpRequest

import logging
from dotenv import load_dotenv
import os
import json
import base64
import datetime
import requests
import pytz
from django.utils.timezone import now
from datetime import timedelta

from users.models import User
from .models import (
  SpotifyUserData,
  Album,
  Review,
  DailyAlbum
)

from users.utils import (
  getSpotifyUser
)

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


def updateSpotifyAuthData(spotUserDataObj: SpotifyUserData, spotifyResJSON: json):
  logger.info("Attempting to store spotify token data in database...")
  # Store token data in database object
  spotUserDataObj.access_token = spotifyResJSON['access_token']
  spotUserDataObj.token_type = spotifyResJSON['token_type']
  spotUserDataObj.token_scope = spotifyResJSON['scope']
  # Calculate Expiry time then store as string
  expiryTime = datetime.datetime.now(tz=pytz.UTC) + datetime.timedelta(seconds=spotifyResJSON['expires_in'])
  spotUserDataObj.token_expiry_date = expiryTime
  if('refresh_token' in spotifyResJSON):
    spotUserDataObj.refresh_token = spotifyResJSON['refresh_token']
  spotUserDataObj.save()
  # Return True
  return True


def isSpotifyTokenExpired(request: HttpRequest):
  logger.info("Checking if spotify token is expired...")
  # Get current time
  curTime = datetime.datetime.now(tz=pytz.UTC)
  # Retrieve user data obj from DB
  spotUserDataObj = SpotifyUserData.objects.filter(user = getSpotifyUser(request.session.get('discord_id'))).first()
  # Get session Expiry time
  tokenExpireTime = spotUserDataObj.token_expiry_date
  # Check if request users's spotify token is out of date
  if(curTime > tokenExpireTime):
    logger.info("Spotify Token IS expired...")
    return True
  # Return false if not expired
  return False


def refreshSpotifyToken(request: HttpRequest):
  logger.info("Refreshing Spotify Token...")
  # Retrieve user data obj from DB
  spotUserDataObj = SpotifyUserData.objects.filter(user = getSpotifyUser(request.session.get('discord_id'))).first()
  # Retrieve refresh token
  refreshToken = spotUserDataObj.refresh_token
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
  # Store discord data in database
  updateSpotifyAuthData(spotUserDataObj, spotifyResJSON)
  # Return True if Successful
  return True


def createSpotifyUserFromResponse(request: HttpRequest, spotifyResJSON: json, spotifyAuthResJSON: json):
  logger.info("createSpotifyUserFromResponse starting...")
  # Retrieve users discord_id from session
  discord_id = request.session.get("discord_id")
  # Get user object from DB
  site_user = User.objects.get(discord_id = discord_id)
  # Check if an entry exists for current user
  logger.info(f"Checking if spotify data exists for discord ID {discord_id} (User {site_user.nickname})...")
  if(SpotifyUserData.objects.filter(user = site_user).exists()):
    logger.info(f"Spotify Data already exists for user {site_user.nickname} with discord ID: {site_user.discord_id}!...")
    logger.info(f"Updating login info and breaking function...")
    updateSpotifyAuthData(SpotifyUserData.objects.get(user = site_user), spotifyAuthResJSON)
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
    membership_type = spotifyResJSON['product'],
    # Auth Data
    access_token = spotifyAuthResJSON['access_token'],
    token_type = spotifyAuthResJSON['token_type'],
    token_scope = spotifyAuthResJSON['scope'],
    token_expiry_date = (datetime.datetime.now(tz=pytz.UTC) + datetime.timedelta(seconds=spotifyAuthResJSON['expires_in'])),
    refresh_token = spotifyAuthResJSON['refresh_token'],
  )
  # If user data for image exists, set it
  if(len(spotifyResJSON['images']) > 0):
    spotifyUser.user_pfp_url = spotifyResJSON['images'][0]['url'],
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
  try:
    # Retrieve users discord_id from session
    discord_id = request.session.get("discord_id")
    # Get user object from DB
    site_user = User.objects.get(discord_id = discord_id)
    # If spotify data is found, attempt a token refresh if expired
    if(isSpotifyTokenExpired(request)):
      refreshSpotifyToken(request)
    # Return boolean of spotify connection status
    return site_user.spotify_connected
  except Exception as e:
    logger.error(f"USER COOKIE OR SPOTIFY DATA REFRESH ERROR!!! ERROR: {e}")
    return False
 

# Get album's average rating (by spotifyid passed in [NOT ALBUM OBJECT])
def getAlbumRating(album_spotify_id, rounded=True, date=None):
  # Get most recent aotd date if date is not provided
  aotd_date = date if (date) else DailyAlbum.objects.filter(album__spotify_id=album_spotify_id).latest('date').date
  # Retrieve album from database
  albumObj = Album.objects.get(spotify_id=album_spotify_id)
  # Get average review score of album
  reviewList = Review.objects.filter(album=albumObj).filter(aotd_date=aotd_date)
  # Return None if the album has not been reviewed
  if(len(reviewList) == 0):
    logger.info(f"No reviews found for {albumObj.title} on Date: {aotd_date}")
    return None
  review_sum = 0.0
  for review in reviewList:
    review_sum += float(review.score)
  # Calculate Average
  if(rounded):
    rating = (round((review_sum/float(len(reviewList)))*2)/2 if len(reviewList) > 0 else 0.0)
    # Return rating
    return rating
  else:
    rating = review_sum/float(len(reviewList))
    # Return rating
    return rating


# Return an dictionary version of the passed in album object
def albumToDict(album: Album):
  albumObj = {}
  albumObj['spotify_id'] = album.spotify_id
  albumObj['title'] = album.title
  albumObj['artist'] = album.artist
  albumObj['artist_url'] = album.artist_url
  albumObj['album_img_src'] = album.cover_url
  albumObj['spotify_url'] = album.spotify_url
  albumObj['submitter'] = album.submitted_by.nickname
  albumObj['submitter_id'] = album.submitted_by.discord_id
  albumObj['submission_date'] = album.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
  albumObj['user_comment'] = album.user_comment
  albumObj['raw_album'] = album.raw_data
  return albumObj


# Check and set a user's aotd "selection_blocked_flag"
# NOTE: This works on the idea that at midnight of the next day the user will be blocked, this is so it can be seen earlier on the website when that happens
#       so a user is marked as blocked from selection if there will have been three days since their last review at the upcoming midnight.
def checkSelectionFlag(spotify_user: SpotifyUserData):
  # Update user to check if they need to be blocked from submitting
  logger.info(f"Updating selection blocked flag for user {spotify_user.user.nickname}...")
  # Get the next midnight, then subtract 3 days to determine validity of user
  three_days_ago = (now().date() + timedelta(days=1)) - timedelta(days=3)
  # Get list of reviews from the past 3 days
  recent_review_users = list(Review.objects.filter(review_date__gte=three_days_ago).values_list('user__discord_id', flat=True).distinct())
  logger.info(f"Checking selection blocked flag for user: {spotify_user.user.nickname} [Flag is currently: {spotify_user.selection_blocked_flag}]...")
  # Check if user is in the list of recent reviewers
  blocked = spotify_user.user.discord_id not in recent_review_users
  # If value is different, update it
  if(spotify_user.selection_blocked_flag != blocked):
    spotify_user.selection_blocked_flag = blocked
    logger.info(f"Changing `selection_blocked_flag` to {blocked} for {spotify_user.user.nickname}...")
    spotify_user.save()