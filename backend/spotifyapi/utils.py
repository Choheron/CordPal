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
  DailyAlbum,
  UserAlbumOutage,
  ReviewHistory
)

from users.utils import (
  getSpotifyUser
)

# Declare logging
logger = logging.getLogger()

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
  # Make sure user is flagged as connected 
  spotUserDataObj.user.aotd_enrolled = True
  spotUserDataObj.user.save()
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
  site_user.aotd_enrolled = True
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
    return site_user.aotd_enrolled
  except Exception as e:
    logger.error(f"USER COOKIE OR SPOTIFY DATA REFRESH ERROR!!! ERROR: {e}")
    return False
 

# Get album's average rating (by spotifyid passed in [NOT ALBUM OBJECT])
def getAlbumRating(album_spotify_id, rounded=True, date: str = None):
  # Get most recent aotd date if date is not provided
  aotd_date = date if (date) else DailyAlbum.objects.filter(album__spotify_id=album_spotify_id).latest('date').date
  # Attempt to get aotd from database
  aotd = DailyAlbum.objects.get(date=aotd_date)
  # If there is already a value in the databse for this date (not an 11) then return that, else calculate rating 
  if(aotd.rating != 11):
    return (round(aotd.rating) if rounded else aotd.rating)
  # Retrieve album from database
  albumObj = aotd.album
  # Get average review score of album
  reviewList = Review.objects.filter(album=albumObj).filter(aotd_date=aotd_date)
  # Return None if the album has not been reviewed
  if(len(reviewList) == 0):
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
  albumObj['release_date'] = album.release_date.strftime("%m/%d/%Y, %H:%M:%S")
  albumObj['release_date_precision'] = album.release_date_precision
  albumObj['user_comment'] = album.user_comment
  albumObj['raw_album'] = album.raw_data
  return albumObj


# Check and set a user's aotd "selection_blocked_flag"
# NOTE: This works on the idea that at midnight of the next day the user will be blocked, this is so it can be seen earlier on the website when that happens
#       so a user is marked as blocked from selection if there will have been three days since their last review at the upcoming midnight.
def checkSelectionFlag(spotify_user: SpotifyUserData):
  # Get user
  user = spotify_user.user
  # Get tomorrow date
  tomorrow = datetime.date.today() + datetime.timedelta(days=1)
  # Check if user is going to be under an outage
  try:
    outage = UserAlbumOutage.objects.filter(start_date__lte=tomorrow, end_date__gte=tomorrow).get(user = user)
    logger.info(f"User {user.nickname} is under an outage until {outage.end_date.strftime('%m/%d/%Y')}")
    return
  except UserAlbumOutage.DoesNotExist as e:
    logger.debug(f"User {user.nickname} is not under an outage")
  # Get the next midnight, then subtract 3 days to determine validity of user
  selection_timeout = (datetime.date.today() + timedelta(days=1)) - timedelta(days=3)
  # Get list of reviews from the past 3 days
  recent_review_users = list(Review.objects.filter(review_date__gte=selection_timeout).values_list('user__discord_id', flat=True).distinct())
  logger.debug(f"Checking selection blocked flag for user: {spotify_user.user.nickname} [Flag is currently: {spotify_user.selection_blocked_flag}]...")
  # Check if user is in the list of recent reviewers
  blocked = spotify_user.user.discord_id not in recent_review_users
  # If value is different, update it
  if(spotify_user.selection_blocked_flag != blocked):
    spotify_user.selection_blocked_flag = blocked
    logger.info(f"Changing `selection_blocked_flag` to {blocked} for {spotify_user.user.nickname}...")
    spotify_user.save()


# Iterate all reviews and review updates associate with a given AOtD, returning in a format (sorted by timestamp) showing changes to AOTD average rating over the course of the day
# This data should be updated to be stored in the database, so as to avoid having to recalculate it every time its viewed
def generateDayRatingTimeline(aotd_obj: DailyAlbum):

  def createReviewObj(reviewObj: Review):
    """Generate a review object for the timeline"""
    return {
      "timestamp": reviewObj.last_updated.astimezone(pytz.UTC).isoformat(),
      "value": getAlbumPartialReviewScore(review = reviewObj), # The average value of the album by this timestamp
      "user_id": reviewObj.user.pk,
      "user_discord_id": reviewObj.user.discord_id,
      "user_nickname": reviewObj.user.nickname,
      "type": "Review",
      "score": reviewObj.score, # The score given for this object
      "review_id": reviewObj.pk
    }

  def createUpdateObj(updateObj: ReviewHistory, is_first_submission: bool = False):
    """Generate an update object for the timeline"""
    return {
      "timestamp": updateObj.last_updated.astimezone(pytz.UTC).isoformat(),
      "value": getAlbumPartialReviewScore(update = updateObj), # The average value of the album by this timestamp
      "user_id": updateObj.review.user.pk,
      "user_discord_id": updateObj.review.user.discord_id,
      "user_nickname": updateObj.review.user.nickname,
      "type": "First Update" if is_first_submission else "Update",
      "score": updateObj.score, # The score given for this object
      "review_id": updateObj.review.pk
    }
  
  def addToUserStack(trackingObj, updateObj: ReviewHistory):
    '''
    Add to user stack and return true if this update changes a users score. (Updates that have no previous version also return true as they altered score.s)
    Return Data: (Updated Tracking Object, Boolean showing if update was a changing update, Boolean showing if this was the first submission)
    '''
    tracking: dict = trackingObj
    if updateObj.review.user.nickname in trackingObj.keys():
      status = (tracking[updateObj.review.user.nickname][-1].score != updateObj.score)
      tracking[updateObj.review.user.nickname].append(updateObj)
      return tracking, status, False
    else:
      tracking[updateObj.review.user.nickname] = [updateObj]
      return tracking, True, True

  # Retrieve Album and date of aotd
  album = aotd_obj.album
  date = aotd_obj.date
  # Get all album reviews
  aotd_reviews_list = list(Review.objects.filter(album=album, aotd_date=date).order_by('last_updated'))
  # Get all album review updates
  review_updates_list = list(ReviewHistory.objects.filter(review__in=aotd_reviews_list, aotd_date=date).order_by('recorded_at'))
  # Declare output object, which is a list of values in timestamp order
  out = []
  # Implement a two pointer loop to ensure all of the data is captured from both querysets
  review_p = 0
  update_p = 0
  # Track a list of users and their updates, to more efficiently get changes
  users_obj = {}
  # Iterate all events
  while((review_p != len(aotd_reviews_list)) or (update_p != len(review_updates_list))):
    curr_review = aotd_reviews_list[review_p] if (review_p != len(aotd_reviews_list)) else None
    curr_update = review_updates_list[update_p] if (update_p != len(review_updates_list)) else None
    # Determine the timestamps of each and store the earlier one in the list, then increment
    if((curr_update == None) or (curr_review.last_updated < curr_update.recorded_at)):
      out.append(createReviewObj(curr_review))
      review_p += 1
    elif((curr_review == None) or (curr_update.recorded_at < curr_review.last_updated)):
      users_obj, status, first_update = addToUserStack(users_obj, curr_update)
      # Only add an update to the list if it changed the score
      if(status): 
        out.append(createUpdateObj(curr_update, first_update))
      update_p += 1
    else: # In the rare event of a simultaneous submission, attach both and increment
      # Add review object
      out.append(createReviewObj(curr_review))
      review_p += 1
      # Add Update object
      users_obj, status, first_update = addToUserStack(users_obj, curr_update)
      # Only add an update to the list if it changed the score
      if(status): 
        out.append(createUpdateObj(curr_update, first_update))
      update_p += 1
  # Save the object's timeline data
  aotd_obj.rating_timeline={"timeline": out}
  aotd_obj.save()


# Get the average review score of an album up to a timestamp on any given day
# Allows retrieval of a score partially thru the day (for timeline purposes)
def getAlbumPartialReviewScore(album: Album = None, timestamp: datetime.datetime = None, review: Review = None, update: ReviewHistory = None):
  if(review):
    timestamp = review.last_updated
    album = review.album
    aotd_date = review.aotd_date
  elif(update):
    timestamp = update.last_updated
    album = update.review.album
    aotd_date = update.aotd_date
  else:
    timestamp = timestamp
    album = album
    aotd_date = DailyAlbum.objects.get(album=album, date=timestamp.date())
  # After establishing timestamp values, get all reviews that apply to this album
  reviews = Review.objects.filter(album=album, aotd_date=aotd_date).filter(review_date__lte=timestamp)
  # Iterate reviews and get the most recent applicable score, add it to the sum, increment count, and move on.
  count = 0.0
  sum = 0.0
  for review in reviews:
    if(review.last_updated == review.review_date):
      sum += review.score
    elif(review.last_updated > timestamp):
      # Get most recent applicable update
      update = review.history.all().filter(last_updated__lte=timestamp).order_by('-last_updated').first()
      sum += update.score
    else: # By reaching this point, a review must have had updates but the final review is still below the timestamp
      sum += review.score
    count += 1
  # Calculate average
  average = (sum/count)
  return average