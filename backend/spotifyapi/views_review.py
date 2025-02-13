from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from users.utils import getSpotifyUser

from .models import (
  Album,
  Review,
  DailyAlbum,
  SpotifyUserData,
  User
)

from .utils import (
  albumToDict,
  checkSelectionFlag
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
  logger.info("submitReview called...")
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
  logger.info("getReviewsForAlbum called...")
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
    outObj = {}
    outObj['user_id'] = review.user.discord_id
    outObj['album_id'] = review.album.spotify_id
    outObj['score'] = review.score
    outObj['comment'] = review.review_text
    outObj['review_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['last_upated'] = review.last_updated.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['first_listen'] = review.first_listen
    # Append to list
    outList.append(outObj)
  # Return list of reviews
  return JsonResponse({"review_list": outList})


###
# Get USER Reviews for a specific album.
###
def getUserReviewForAlbum(request: HttpRequest, album_spotify_id: str):
  logger.info("getUserReviewForAlbum called...")
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
  outObj = {}
  outObj['user_id'] = review.user.discord_id
  outObj['album_id'] = review.album.spotify_id
  outObj['score'] = review.score
  outObj['comment'] = review.review_text
  outObj['review_date'] = review.review_date.strftime("%m/%d/%Y, %H:%M:%S")
  outObj['last_upated'] = review.last_updated.strftime("%m/%d/%Y, %H:%M:%S")
  outObj['first_listen'] = review.first_listen
  # Return user review
  return JsonResponse({"review": outObj})

###
# Get Review stats for all users.
# TODO: Track streaks of reviews to see which user has been maintaining the streak
###
def getAllUserReviewStats(request: HttpRequest):
  logger.info("getAllUserReviewStats called...")
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
  logger.info("getUserReviewStats called...")
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
  out['highest_album'] = albumToDict(Album.objects.get(spotify_id=out['highest_score_album']))
  out['lowest_album'] = albumToDict(Album.objects.get(spotify_id=out['lowest_score_album']))
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
  logger.info("getSimilarReviewsForRating called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getSimilarReviewsForRating called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user from session cookie
  print("Getting user")
  user = getSpotifyUser(request.session.get('discord_id'))
  # Iterate through possible ratings and build return object
  out = {}
  score = 0
  while score <= 10:
    # Get three reviews returned 
    user_reviews = Review.objects.filter(user=user).filter(score=score).order_by('-last_updated')[:3]
    albums_for_score = []
    for review in user_reviews:
      albums_for_score.append(albumToDict(review.album))
    # Attach to out object
    out[f"{score + 0.0}"] = albums_for_score
    # Increment score
    score += 0.5
  # Attach timestamp
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)