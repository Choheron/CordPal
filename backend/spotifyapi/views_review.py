from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Sum

from users.utils import getSpotifyUser

from .models import (
  Album,
  Review,
  DailyAlbum,
  SpotifyUserData,
  User,
  ReviewHistory
)

from .utils import (
  albumToDict,
  checkSelectionFlag
)
from reactions.utils import (
  createReaction
)

import logging
from dotenv import load_dotenv
import os
import json
import datetime
import pytz

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


## =========================================================================================================================================================================================
## REVIEW METHODS
## =========================================================================================================================================================================================

###
# Submit a new review of an album by a user.
###
def submitReview(request: HttpRequest):
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
    reviewObj.first_listen = reqBody['first_listen']
    reviewObj.version = 2
    # Save/Update Object
    reviewObj.save()
  except Review.DoesNotExist:
    # Declare new Review object
    newReview = Review(
      album=albumObj,
      user=userObj,
      score=float(reqBody['score']),
      review_text=reqBody['comment'],
      first_listen=reqBody['first_listen'],
      aotd_date=datetime.datetime.now(tz=pytz.timezone('America/Chicago')).strftime('%Y-%m-%d'),
      version=2
    )
    # Save new Review data
    newReview.save()
  # Update user selection_blocked flag status
  checkSelectionFlag(SpotifyUserData.objects.get(user=userObj))
  return HttpResponse(200)


###
# Get All Reviews for a specific album.
###
def getReviewsForAlbum(request: HttpRequest, album_spotify_id: str, date: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getReviewsForAlbum called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # If date is not provided grab the most recent date of AOtD
  try:
    aotd_date = date if (date) else DailyAlbum.objects.filter(album__spotify_id=album_spotify_id).latest('date').date
  except:
    out = {}
    out['review_list'] = []
    print(f'Album {album_spotify_id} not found in AOtD List...')
    return JsonResponse(out)
  # Get Album from the database
  try:
    albumObj = Album.objects.get(spotify_id=album_spotify_id)
  except Album.DoesNotExist:
    out = {}
    out['review_list'] = []
    print(f'Album {album_spotify_id} not found...')
    return JsonResponse(out)
  # Get all reivews for album
  try:
    reviewsObj = Review.objects.filter(album=albumObj).filter(aotd_date=aotd_date)
  except Review.DoesNotExist:
    out = {}
    out['review_list'] = []
    print(f'No reviews found for album {album_spotify_id}...')
    return JsonResponse(out)
  # Declare outlist and populate
  outList = []
  for review in reviewsObj:
    outObj = review.toJSON()
    # Append to list
    outList.append(outObj)
  # Return list of reviews
  return JsonResponse({"review_list": outList})


###
# Get USER Reviews for a specific album.
###
def getUserReviewForAlbum(request: HttpRequest, album_spotify_id: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUserReviewForAlbum called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get Album from the database
  try: 
    albumObj = Album.objects.get(spotify_id=album_spotify_id)
  except ObjectDoesNotExist:
    return JsonResponse({"review": None})
  # Get reivew for album
  try: 
    review = Review.objects.get(album=albumObj, user=getSpotifyUser(request.session.get('discord_id')))
  except ObjectDoesNotExist:
    return JsonResponse({"review": None})
  # Declare out object and populate
  outObj = review.toJSON()
  # Return user review
  return JsonResponse({"review": outObj})

###
# Get Review stats for all users.
# TODO: Track streaks of reviews to see which user has been maintaining the streak
###
def getAllUserReviewStats(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllUserReviewStats called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all user reviews
  all_reviews = Review.objects.all()
  # Declare reviewData object and populate
  reviewData = {}
  totalReviews = 0
  for review in all_reviews:
    # Increment total review count
    totalReviews += 1
    # If user has not appeared before, create new object for user
    if(review.user.discord_id not in reviewData.keys()):
      reviewData[review.user.discord_id] = {
        "discord_id": review.user.discord_id,
        "total_reviews": 0, 
        "review_score_sum": 0,
        "average_review_score": -1, # This will be calculated at the end
        "lowest_score_given": -1,
        "lowest_score_album": None,
        "lowest_score_date": None,
        "highest_score_given": -1,
        "highest_score_album": None,
        "highest_score_date": None,
        }
    # Update review data for user based on current review
    reviewData[review.user.discord_id]['total_reviews'] += 1
    reviewData[review.user.discord_id]['review_score_sum'] += review.score
    if((reviewData[review.user.discord_id]['lowest_score_given'] == -1) or (reviewData[review.user.discord_id]['lowest_score_given'] > review.score)):
      reviewData[review.user.discord_id]['lowest_score_given'] = review.score
      reviewData[review.user.discord_id]['lowest_score_album'] = review.album.spotify_id
      reviewData[review.user.discord_id]['lowest_score_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    if((reviewData[review.user.discord_id]['highest_score_given'] == -1) or (reviewData[review.user.discord_id]['highest_score_given'] <= review.score)):
      reviewData[review.user.discord_id]['highest_score_given'] = review.score
      reviewData[review.user.discord_id]['highest_score_album'] = review.album.spotify_id
      reviewData[review.user.discord_id]['highest_score_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
  # Calcualte averages 
  for userReviewData in reviewData.keys():
    reviewData[userReviewData]['average_review_score'] = reviewData[userReviewData]['review_score_sum']/reviewData[userReviewData]['total_reviews']
  # Convert user reviews object to list
  outList = []
  for user in reviewData:
    outList.append(reviewData[user])
  # Return data 
  return JsonResponse({'total_reviews': totalReviews, 'review_data': outList})


def getUserReviewStats(request: HttpRequest, user_discord_id: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUserReviewStats called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user discord id
  userId = None
  if(user_discord_id):
    userId = user_discord_id
  else:
    userId = request.session.get('discord_id')
  # Get user object from DB
  user = User.objects.get(discord_id=userId)
  # Create dict for data return
  out = {
    "discord_id": user.discord_id,
    "total_reviews": 0.0, 
    "review_score_sum": 0,
    "average_review_score": -1, # This will be calculated at the end
    "lowest_score_given": -1,
    "lowest_score_album": None,
    "lowest_score_date": None,
    "highest_score_given": -1,
    "highest_score_album": None,
    "highest_score_date": None,
    "score_counts": [] # A list of objects for listing score counts
  }
  # Get all reviews left by user
  user_reviews = Review.objects.filter(user=user)
  # Iterate reviews and update review data for user based on current review
  for review in user_reviews:
    # Increment sums, counters, and check for highest and lowest rating
    out['total_reviews'] += 1
    out['review_score_sum'] += review.score
    if((out['lowest_score_given'] == -1) or (out['lowest_score_given'] > review.score)):
      out['lowest_score_given'] = review.score
      out['lowest_score_album'] = review.album.spotify_id
      out['lowest_score_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    if((out['highest_score_given'] == -1) or (out['highest_score_given'] <= review.score)):
      out['highest_score_given'] = review.score
      out['highest_score_album'] = review.album.spotify_id
      out['highest_score_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
  # Convert get list of objects per score
  index = 0.0
  tempList = []
  while(index <= 10):
    count = user_reviews.filter(score=index).count()
    tempList.append({ "score": index, "count": count })
    index += 0.5
  # Attach score counts to user object
  out['score_counts'] = tempList
  # Calculate average review score
  out['average_review_score'] = out['review_score_sum']/out['total_reviews']
  # Get final data on lowest and highest albums
  out['highest_album'] = Album.objects.get(spotify_id=out['highest_score_album']).toJSON()
  out['lowest_album'] = Album.objects.get(spotify_id=out['lowest_score_album']).toJSON()
  # Return out object
  return JsonResponse(out)


###
# Get Reviews and Albums for each score given.
# Example: Return an object similar to the following
# {
#   "0": {
#     [
#       'ALBUM DATA'
#     ],
#     [
#       'ALBUM DATA'
#     ],
#     [
#       'ALBUM DATA'
#     ]
#   },
#   "1": {
#     ...
#   }
#   ...
# }
###
def getSimilarReviewsForRatings(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSimilarReviewsForRating called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user from session cookie
  user = getSpotifyUser(request.session.get('discord_id'))
  # Iterate through possible ratings and build return object
  out = {}
  score = 0
  while score <= 10:
    # Get three reviews returned 
    user_reviews = Review.objects.filter(user=user).filter(score=score).order_by('-last_updated')[:3]
    albums_for_score = []
    for review in user_reviews:
      albums_for_score.append(review.album.toJSON())
    # Attach to out object
    out[f"{score + 0.0}"] = albums_for_score
    # Increment score
    score += 0.5
  # Attach timestamp
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)


###
# Get ALL Reviews made by a user
###
def getAllUserReviews(request: HttpRequest, user_discord_id: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllUserReviews called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user from session cookie
  user = getSpotifyUser(request.session.get('discord_id') if (user_discord_id == None) else user_discord_id)
  # Get all reviews
  reviewsObj = Review.objects.filter(user=user)
  # Declare outlist and populate
  out = {}
  out['reviews'] = []
  for review in reviewsObj:
    outObj = review.toJSON(full = True)
    # Append to list
    out['reviews'].append(outObj)
  # Attach timestamp
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)


###
# Get Review statistics for a passed in month
###
def getReviewStatsByMonth(request: HttpRequest, year: str, month: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getReviewStatsByMonth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve all reviews for the passed in month
  monthReviews = Review.objects.filter(review_date__year=year, review_date__month=month)
  # Get overall review data
  stat_reviewTotal = monthReviews.count()
  stat_reviewScoreSum = monthReviews.aggregate(Sum('score'))['score__sum']
  stat_reviewAverage = (stat_reviewScoreSum/float(stat_reviewTotal)) if (stat_reviewTotal != 0) else 0
  stat_totalFirstListens = monthReviews.filter(first_listen=True).count()
  stat_firstListenPercentage = (stat_totalFirstListens/float(stat_reviewTotal) * 100) if (stat_reviewTotal != 0) else 0
  # Get stats related to user
  users = monthReviews.values_list('user__discord_id', flat=True).distinct()
  # Track user's total review count and sum of reviews, get user averages
  stat_userStats = {}
  stat_biggestHater = (None, None)
  stat_biggestLover = (None, None)
  for user_id in users:
    userReviews = monthReviews.filter(user__discord_id=user_id)
    reviewCount = userReviews.count()
    reviewSum = userReviews.aggregate(Sum('score'))['score__sum']
    averageScore = (reviewSum/float(reviewCount)) if (reviewCount != 0) else 0
    firstListenCount = userReviews.filter(first_listen=True).count()
    # Only check biggest lover and hater if the user has a review count of at least a third of the overall album count
    if(reviewCount > (monthReviews.values_list('album').distinct().count() / 3)):
      if((stat_biggestLover[0] == None) or (stat_biggestLover[1] < averageScore)):
        stat_biggestLover = (user_id, averageScore)
      if((stat_biggestHater[0] == None) or (stat_biggestHater[1] > averageScore)):
        stat_biggestHater = (user_id, averageScore)
    # Add user data to userStats
    stat_userStats[user_id] = {
      "discord_id": user_id,
      "review_count": reviewCount,
      "review_sum": reviewSum,
      "review_average": averageScore,
      "first_listen_count": firstListenCount,
      "first_listen_percentage": ((firstListenCount/float(reviewCount) * 100) if (reviewCount != 0) else 0),
      "score_breakdown": []
    }
  # Get breakdown of all scores by count and data
  stat_reviewScoreBreakdown = []
  score = 0.0
  while score <= 10.0:
    # Query all reviews of this score
    reviews = monthReviews.filter(score=score)
    stat_reviewScoreBreakdown.append({
      "score": f"{score + 0.0}",
      "count": reviews.count(),
      "percent": (reviews.filter(score=score).count()/float(stat_reviewTotal) * 100) if (stat_reviewTotal != 0) else 0
    })
    # Add count of reviews for individual user breakdown
    for user_id in users:
      stat_userStats[user_id]['score_breakdown'].append({
        "score": f"{score + 0.0}",
        "count": reviews.filter(user__discord_id=user_id).count(),
        "percent": ((reviews.filter(score=score).filter(user__discord_id=user_id).count()/float(stat_userStats[user_id]['review_count']) * 100) if (stat_userStats[user_id]['review_count'] != 0) else 0)
      })
    # Increment score
    score += 0.5
  # Create and populate out object
  out = {}
  # Attach stats
  out['total_reviews'] = stat_reviewTotal
  out['all_review_sum'] = stat_reviewScoreSum
  out['all_review_average'] = stat_reviewAverage
  out['biggest_lover_id'] = stat_biggestLover[0]
  out['biggest_hater_id'] = stat_biggestHater[0]
  out['all_first_listen_count'] = stat_totalFirstListens
  out['all_first_listen_percentage'] = stat_firstListenPercentage
  out['user_stats'] = stat_userStats
  out['score_stats'] = stat_reviewScoreBreakdown
  # Attach timestamp
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)


###
# Add a Reaction to a review
###
def submitReviewReaction(request: HttpRequest):
  from reactions.models import Reaction
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("submitReviewReaction called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    # Get data from request
    reqBody = json.loads(request.body)
    # Retrieve user from session cookie
    user = getSpotifyUser(request.session.get('discord_id'))
    # Get review from the database
    review = Review.objects.get(pk=reqBody['id'])
    # Attempt to get reaction if it already exists
    try:
      reaction: Reaction = review.reactions.get(user = user)
      reaction.emoji = reqBody['emoji']
      reaction.save()
    except:
      # Create a new review
      createReaction(review, user, reqBody['emoji'])
    # Return success object 
    return HttpResponse(status=200)
  except Exception as e:
    logger.error(f"Error when submitting review reaction. Error: {e}")
    return HttpResponse(status=500)
  

###
# Add a Reaction to a review
###
def deleteReviewReaction(request: HttpRequest):
  from reactions.models import Reaction
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("deleteReviewReaction called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    # Get data from request
    reqBody = json.loads(request.body)
    # Retrieve user from session cookie
    user = getSpotifyUser(request.session.get('discord_id'))
    # Get review from the database
    review = Review.objects.get(pk=reqBody['id'])
    # Attempt to get reaction if it already exists
    try:
      reaction: Reaction = review.reactions.get(user = user)
      # Delete reaction
      reaction.delete()
    except Reaction.DoesNotExist as e:
      logger.error(f"Could not delete, no reaction found!")
      raise e
    # Return success object 
    return HttpResponse(status=200)
  except Exception as e:
    logger.error(f"Error when deleting review reaction. Error: {e}")
    return HttpResponse(status=500)
  
  
###
# Get a review by its id
###
def getReviewByID(request: HttpRequest, id: int):
   # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getReviewByID called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get review by passed in ID
  review = Review.objects.get(pk=id)
  # Return
  return JsonResponse(review.toJSON())


###
# Get a review by its id
###
def getReviewHistoricalByID(request: HttpRequest, id: int):
   # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getReviewByID called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get review by passed in ID
  review = Review.objects.get(pk=id)
  # Decalare Out Object
  out = review.toJSON()
  # Get all historical edits of review and attach to out object
  historical = ReviewHistory.objects.filter(review=review).order_by("recorded_at").reverse()
  out['historical'] = []
  for rev in historical:
    out['historical'].append(rev.toJSON())
  # Return
  return JsonResponse(out)