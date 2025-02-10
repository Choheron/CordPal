from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict
from django.utils.timezone import now
from datetime import timedelta

from users.utils import getSpotifyUser
from .models import (
  Album,
  DailyAlbum,
  SpotifyUserData,
  Review
)

import logging
from dotenv import load_dotenv
import os
import datetime
import pytz
import random

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

## =========================================================================================================================================================================================
## ALBUM OF THE DAY
## =========================================================================================================================================================================================

###
# Get All Reviews for a specific album. Returns a spotify album id and date
###
def getAlbumOfDay(request: HttpRequest, date: str = ""):
  logger.info("getAlbumOfDay called...")
  # Fill date if it isnt provided
  if(date == ""):
    date = datetime.datetime.now(tz=pytz.timezone('America/Chicago')).strftime('%Y-%m-%d')
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAlbumOfDay called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert String to date
  date_format = '%Y-%m-%d'
  albumDay = datetime.datetime.strptime(date, date_format).date()
  # Get Album from the database
  try:
    dailyAlbumObj = DailyAlbum.objects.get(date=albumDay)
  except DailyAlbum.DoesNotExist:
    out = {}
    out['err_message'] = 'Not Found'
    print(f'Daily Album not Found for: {date}')
    return JsonResponse(out)
  # Return album of passed in day
  out = {} 
  out['raw_response'] = model_to_dict(dailyAlbumObj)
  out['album_id'] = dailyAlbumObj.album.spotify_id
  out['album_name'] = dailyAlbumObj.album.title
  out['date'] = date
  logger.info(f"Returning Album of Day Object for Date {date}: {out}...")
  return JsonResponse(out)


###
# Set a new album of the day. Returns an HTTPResponse
###
def setAlbumOfDay(request: HttpRequest):
  logger.info("setAlbumOfDay called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("setAlbumOfDay called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Update users to check if they need to be blocked from submitting
  logger.info("Updating selection blocked flags based on most recent review timestamp...")
  three_days_ago = now() - timedelta(days=3)
  # Get list of reviews from the past 3 days
  recent_review_users = list(Review.objects.filter(review_date__gte=three_days_ago).values_list('user__discord_id', flat=True).distinct())
  # Update users based on if they have reviewed an album in the last 3 days
  for spotify_user in SpotifyUserData.objects.all():
    logger.info(f"Checking submission validity flag for user: {spotify_user.user.nickname} [Flag is currently: {spotify_user.selection_blocked_flag}]...")
    # Check if user is in the list of recent reviewers
    blocked = spotify_user.user.discord_id not in recent_review_users
    # If value is different, update it
    if(spotify_user.selection_blocked_flag != blocked):
      spotify_user.selection_blocked_flag = blocked
      logger.info(f"Changing `selection_blocked_flag` to {blocked} for {spotify_user.user.nickname}...")
      spotify_user.save()
  # Get current date
  day = datetime.date.today()
  # Check if a current album of the day already exists
  try:
    currDayAlbum = DailyAlbum.objects.get(date=day)
    logger.warning(f"WARN: Album of the day already selected: {currDayAlbum}")
    return HttpResponse(f"WARN: Album of the day already selected: {currDayAlbum}", status=425)
  except DailyAlbum.DoesNotExist:
    logger.info("Today does not yet have an album, selecting one...")
  # Get Date a year ago to filter by
  one_year_ago = day - datetime.timedelta(days=365)
  # Define a boolean for selecting the right album
  selected = False
  # Define Album Object
  albumOfTheDay = None
  # Get list of all users who are currently AOtD selection blocked
  blocked_users = list(SpotifyUserData.objects.filter(selection_blocked_flag=True).values_list('user__discord_id', flat=True))
  logger.warning(blocked_users)
  while(not selected):
    # Filter out blocked users albums
    tempAlbum = random.choice(Album.objects.all().exclude(submitted_by__discord_id__in=blocked_users))
    try:
      albumCheck = DailyAlbum.objects.filter(date__gte=one_year_ago).get(album=tempAlbum)
    except DailyAlbum.DoesNotExist:
      albumOfTheDay = tempAlbum
      selected = True
  # Create an album of the day object
  albumOfTheDayObj = DailyAlbum(
    album=albumOfTheDay,
    date=day
  )
  # Save object
  albumOfTheDayObj.save()
  # Print success
  logger.info(f'Successfully selected album of the day: \"{albumOfTheDayObj}\" submitted by: \"{albumOfTheDay.submitted_by.nickname}\"')
  return HttpResponse(f'Successfully selected album of the day: \"{albumOfTheDayObj}\" submitted by: \"{albumOfTheDay.submitted_by.nickname}\"')


###
# Set a new album of the day.  NOTE: This WILL OVERRIDE any already set album for any date! Returns an HTTPResponse
###
def setAlbumOfDayADMIN(request: HttpRequest, date: str, album_spotify_id: str):
  logger.info("setAlbumOfDayADMIN called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("setAlbumOfDayADMIN called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get current date
  day = datetime.datetime.strptime(date, "%Y-%m-%d")
  # Define Album Object
  albumOfTheDay = Album.objects.get(spotify_id=album_spotify_id)
  # Create an album of the day object
  albumOfTheDayObj = DailyAlbum(
    album=albumOfTheDay,
    date=day
  )
  # Save object
  albumOfTheDayObj.save()
  # Print success
  logger.info(f'Successfully set album of the day for {date}: {albumOfTheDayObj}')
  return HttpResponse(f'Successfully set album of the day for {date}: {albumOfTheDayObj}')


###
# When passed in an album, return a list of the dates in which it was AOtD
###
def getAotdDates(request: HttpRequest, album_spotify_id: str):
  logger.info("getAotdDates called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAotdDates called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve album object using spotify_id
  album = Album.objects.get(spotify_id=album_spotify_id)
  # Get list of dates
  aotd_dates = list(DailyAlbum.objects.filter(album=album).values_list('date', flat=True))
  # Create return object and return it
  out = {}
  out['aotd_dates'] = aotd_dates
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)