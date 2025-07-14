from django.http import HttpRequest
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Sum

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
  AotdUserData,
  Album,
  DailyAlbum,
  UserAlbumOutage,
  Review,
  ReviewHistory
)

from users.utils import (
  getUserObj
)

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


def getAotdUserObj(discord_id):
  """Return Aotd Specific User Object corresponding to discord id"""
  try:
    return AotdUserData.objects.get(user__discord_id=discord_id)
  except ObjectDoesNotExist:
    return None


# Return status of user's aotd connection (true if user has enrolled in aotd)
def isUserAotdParticipant(request: HttpRequest):
  '''Return status of user's aotd connection (true if user has enrolled in aotd)'''
  try:
    # Retrieve users discord_id from session
    discord_id = request.session.get("discord_id")
    # Get user object from DB
    site_user = User.objects.get(discord_id=discord_id)
    # Return boolean of aotd connection status
    return site_user.aotd_enrolled
  except Exception as e:
    logger.error(f"USER COOKIE OR AOTD DATA REFRESH ERROR!!! ERROR: {e}")
    return False
 

# Get album's average rating (by mbid passed in [NOT ALBUM OBJECT])
def getAlbumRating(mbid, rounded=True, date: str = None):
  # Get most recent aotd date if date is not provided
  aotd_date = date if (date) else DailyAlbum.objects.filter(album__mbid=mbid).latest('date').date
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
  # Calculate Average [DO NOT STORE IN DB UNTIL DAY IS OVER (Handled in Aotd selection method)]
  if(rounded):
    rating = (round((review_sum/float(len(reviewList)))*2)/2 if len(reviewList) > 0 else 0.0)
    # Return rating
    return rating
  else:
    rating = review_sum/float(len(reviewList))
    # Return rating
    return rating


# Check and set a user's aotd "selection_blocked_flag"
# NOTE: This works on the idea that at midnight of the next day the user will be blocked, this is so it can be seen earlier on the website when that happens
#       so a user is marked as blocked from selection if there will have been three days since their last review at the upcoming midnight.
def checkSelectionFlag(aotd_user: AotdUserData):
  '''Check and set a user's aotd "selection_blocked_flag"
    NOTE: This works on the idea that at midnight of the next day the user will be blocked, this is so it can be seen earlier on the website when that happens
          so a user is marked as blocked from selection if there will have been three days since their last review at the upcoming midnight.
  '''
  # Get user
  user = aotd_user.user
  # Get tomorrow date
  tomorrow = datetime.date.today() + datetime.timedelta(days=1)
  # Check if user is going to be under an outage
  try:
    outage = UserAlbumOutage.objects.filter(start_date__lte=tomorrow, end_date__gte=tomorrow).get(user = user)
    logger.info(f"User {user.nickname} is under an outage until {outage.end_date.strftime('%m/%d/%Y')}")
    return
  except UserAlbumOutage.DoesNotExist as e:
    logger.debug(f"User {user.nickname} is not under an outage")
  # Get the next midnight, then subtract 2 days to determine validity of user
  selection_timeout = (datetime.date.today() + timedelta(days=1)) - timedelta(days=2)
  # Get list of reviews from the past 2 days
  recent_review_users = list(Review.objects.filter(review_date__gte=selection_timeout).values_list('user__discord_id', flat=True).distinct())
  logger.debug(f"Checking selection blocked flag for user: {aotd_user.user.nickname} [Flag is currently: {aotd_user.selection_blocked_flag}]...")
  # Check if user is in the list of recent reviewers
  blocked = aotd_user.user.discord_id not in recent_review_users
  # If value is different, update it
  if(aotd_user.selection_blocked_flag != blocked):
    aotd_user.selection_blocked_flag = blocked
    logger.info(f"Changing `selection_blocked_flag` to {blocked} for {aotd_user.user.nickname}...")
    aotd_user.save()


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


# Update a user review's stats in database
# First step in an attempt at optimizing user review stat retrieval
def calculateUserReviewData(aotdUserObj: AotdUserData):
  user = aotdUserObj.user
  # Get query set of all reviews left by user
  all_reviews = Review.objects.filter(user=user)
  # Get a count of total reviews 
  total_reviews = all_reviews.count()
  # Get the score of all reviews
  review_sum = all_reviews.aggregate(Sum('score'))['score__sum']
  # Calculate average review score
  average_review_score = review_sum/total_reviews
  # Calculate first time review percentage
  ft_reviews = all_reviews.filter(first_listen=True).count()
  first_time_listen_percentage = ft_reviews/total_reviews
  # Get lowest scored album
  lowest_review = all_reviews.order_by('score').first()
  lowest_review_score = lowest_review.score
  lowest_review_mbid = lowest_review.album.mbid
  lowest_review_date =lowest_review.aotd_date
  # Get highest scored album
  highest_review = all_reviews.order_by('score').last()
  highest_review_score = highest_review.score
  highest_review_mbid = highest_review.album.mbid
  highest_review_date =highest_review.aotd_date
  # Update user data
  aotdUserObj.total_reviews = total_reviews
  aotdUserObj.review_score_sum = review_sum
  aotdUserObj.average_review_score = average_review_score
  aotdUserObj.first_listen_percentage = first_time_listen_percentage
  aotdUserObj.lowest_score_given = lowest_review_score
  aotdUserObj.lowest_score_mbid = lowest_review_mbid
  aotdUserObj.lowest_score_date = lowest_review_date
  aotdUserObj.highest_score_given = highest_review_score
  aotdUserObj.highest_score_mbid = highest_review_mbid
  aotdUserObj.highest_score_date = highest_review_date
  # Save user data
  aotdUserObj.save()


def update_user_streak(user: User, date_override: datetime.date | None = None):
  '''Update a user's aotd review streak, user passed in should be a base level user'''
  date = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
  # Get required vars
  profile: AotdUserData = user.aotd_data
  today = date_override if (date_override != None) else date.today()
  # Grab most recent aotd date
  most_recent_aotd = DailyAlbum.objects.filter(date__lt=today).order_by("-date").first()

  if profile.last_review_date == today:
    return  # Already submitted today

  # Check to ensure that we grab the previous aotd date instead of just yesterday (in the event of missing AOTDs)
  if profile.last_review_date == most_recent_aotd.date:
    profile.current_streak += 1
  else:
    profile.current_streak = 1  # reset streak

  if profile.current_streak > profile.longest_streak:
    profile.longest_streak = profile.current_streak

  profile.last_review_date = today
  profile.save()