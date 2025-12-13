from django.http import HttpRequest, HttpResponse, JsonResponse
from django.db.models import QuerySet
from django.db.models import Avg, Count, StdDev


import logging
import os
from dotenv import load_dotenv
import json
import datetime

# Model imports from other apps
from photos.models import Image
from users.models import User
from quotes.models import Quote
from reactions.models import Reaction
from aotd.models import (
  Album,
  Review,
  ReviewHistory,
  DailyAlbum,
  AotdUserData
)

from .utils import (
  calculateLongestUserReviewStreak
)

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


def generateSitePlayback(request: HttpRequest):
  '''
  Gebnerate "CordPal Playback" data for the site-wide statistics given a year in the JSON body. Must be a POST request.
  
  :param request: Django request object
  :type request: HttpRequest
  '''
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning(f"generateSitePlayback called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Query request body and validate
  reqBody = json.loads(request.body)
  if "year" not in reqBody:
    logger.error(f"Failure in calculation 'year' key missing from request body. Returning 400.", extra={'crid': request.crid})
    res = HttpResponse("Fail: 'year' key missing from request body")
    res.status_code = 400
    return res
  year = reqBody['year']
  recalculate = True if reqBody['recalculate'] else False
  # TODO: Check the database for this year's data already being calculated, this should be checked against the recalculate flag and a response returned if fail

  # Begin the process of calculating site wide statistics
  playbackData = {}
  start_date = datetime.date(year, 1, 1)
  end_date = datetime.date(year, 12, 31)
  # Review Stats
  reviewStats = {}
  reviews = Review.objects.filter(aotd_date__range=(start_date, end_date))
  reviewStats['total_reviews'] = len(reviews)
  #  NOTE: UNFINISHED


def generateUserPlayback(request: HttpRequest):
  '''
  Gebnerate "CordPal Playback" data for the user specific statistics given a year in the JSON body. Must be a POST request.
  
  :param request: Django request object
  :type request: HttpRequest
  '''
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning(f"generateUserPlayback called with a non-POST method ({request.method}), returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Query request body and validate
  reqBody = json.loads(request.body)
  if "year" not in reqBody:
    logger.error(f"Failure in calculation 'year' key missing from request body. Returning 400.", extra={'crid': request.crid})
    res = HttpResponse("Fail: 'year' key missing from request body")
    res.status_code = 400
    return res
  if "user_id" not in reqBody:
    logger.error(f"Failure in calculation 'user_id' key missing from request body. Returning 400.", extra={'crid': request.crid})
    res = HttpResponse("Fail: 'user_id' key missing from request body")
    res.status_code = 400
    return res
  year = reqBody['year']
  userId = reqBody['user_id']
  recalculate = True if reqBody['recalculate'] else False
  # TODO: Check the database for this year's data for the user already being calculated, this should be checked against the recalculate flag and a response returned if fail

  # Retreive user data
  user: User = User.objects.get(pk=userId)
  aotd_user: AotdUserData = user.aotd_data
  # Begin the process of calculating user statistics
  playbackData = {}
  start_datetime = datetime.datetime(year, 1, 1)
  end_datetime = datetime.datetime(year, 12, 31, 23, 59, 59)
  ###
  # Review Stats
  ###
  reviewStats = {}
  # Retrieve all reviews this year
  allReviews = Review.objects.all().filter(aotd_date__range=(start_datetime.date(), end_datetime.date()))
  # Retreive reviews from this user this year
  reviews: QuerySet[Review] = user.aotd_reviews.filter(aotd_date__range=(start_datetime.date(), end_datetime.date())) 
  # Retrieve reactions from this user this year
  reactions: QuerySet[Reaction] = Reaction.objects.filter(user=user).filter(creation_timestamp__range=(start_datetime, end_datetime)) 
  # Build out stats
  reviewStats['total_reviews'] = len(reviews) # Total count of reviews
  reviewStats['avg_review_score'] = reviews.aggregate(Avg("score", default=0))['score__avg'] # User's average review score
  reviewStats['stddev_review_score'] = reviews.aggregate(StdDev("score", default=0))['score__stddev'] # User's standard deviation review score
  longest_streak = calculateLongestUserReviewStreak(reviews)
  reviewStats['longest_review_streak'] = { # Longest Review Streak
    "start_date": longest_streak[0].strftime("%d/%m/%Y"),
    "length": longest_streak[1],
    "end_date": longest_streak[2].strftime("%d/%m/%Y")
  }
  reviewStats['most_reacted_review'] = reviews.annotate(react_count=Count("reactions")).order_by("-react_count")[0].toJSON() # Review with the most reactions
  if(len(reactions) > 0):
    reviewStats['most_used_reaction'] = reactions.values("emoji", "custom_emoji").annotate(total=Count("id")).order_by("-total").first() # User's most used reaction
  # Place review stats into overall stat tracking
  playbackData['reviews'] = reviewStats
  ###
  # AOTD Stats
  ###
  albumStats = {}
  # Albums submitted by user this year
  submittedAlbums: QuerySet[Album] = user.submitted_albums.filter(submission_date__range=(start_datetime, end_datetime))
  # AOTDs selected from user this year 
  selectedAlbums: QuerySet[DailyAlbum] = DailyAlbum.objects.filter(date__range=(start_datetime.date(), end_datetime.date())).filter(album__submitted_by=user)
  # Build out stats
  albumStats['total_submitted'] = len(submittedAlbums) # Total album submissions
  albumStats['total_selected'] = len(selectedAlbums) # Total album selections
  albumStats['personal_celeb_list'] = list(
    reviews.values('album__submitted_by__pk', 'album__submitted_by__nickname') \
      .annotate(avg_score=Avg('score')) \
      .order_by('-avg_score') # Get this user's personal celeb list
  )[:4]
  if(len(selectedAlbums) != 0):
    albumStats['highest_rated_aotd'] = selectedAlbums.exclude(rating=11).exclude(rating=None).order_by("-rating")[0].toJSON() # Highest Rated AOTD Selection
    albumStats['lowest_rated_aotd'] = selectedAlbums.exclude(rating=11).exclude(rating=None).order_by("rating")[0].toJSON() # Lowest Rated AOTD Selection
    albumStats['highest_std'] = selectedAlbums.exclude(rating=11).exclude(standard_deviation=None).order_by("-standard_deviation")[0].toJSON() # Most Controvertial AOTD Selection
    # Get the user who rated your albums highest on average
    albumStats['biggest_fan_list'] = list(
      allReviews.filter(album__submitted_by=user) \
        .exclude(user=user) \
        .values('user__pk', 'user__nickname') \
        .annotate(avg_score=Avg('score')) \
        .order_by('-avg_score') # Get this user's biggest fan list (not including themselves)
    )[:4]
  # Place aotd stats into overall stat tracking
  playbackData['aotd'] = albumStats
  ###
  # Photo Stats
  ###
  photoStats = {}
  # Build out Photo Stats
  photoStats['total_submitted'] = len(user.uploaded_images.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  photoStats['total_artist_of'] = len(user.created_images.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  photoStats['tagged_in'] = len(user.images_tagged_in.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  # Place aotd stats into overall stat tracking
  playbackData['photos'] = photoStats
  ###
  # Quote Stats
  ###
  quoteStats = {}
  # Build out Photo Stats
  quoteStats['total_submitted'] = len(user.quotes_submitted.filter(timestamp__range=(start_datetime, end_datetime)))
  quoteStats['total_quoted'] = len(user.quotes.filter(timestamp__range=(start_datetime, end_datetime)))
  # Place aotd stats into overall stat tracking
  playbackData['quotes'] = quoteStats
  # Return user's "CordPal Playback" data
  return JsonResponse(playbackData)

