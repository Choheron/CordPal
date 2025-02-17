from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict
from django.utils import timezone

from .utils import (
  checkSelectionFlag,
  getSpotifyUser
)
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
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("setAlbumOfDay called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check and set selection flags for all users
  for spot_user in SpotifyUserData.objects.all():
    checkSelectionFlag(spot_user)
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
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAotdDates called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve album object using spotify_id
  album = Album.objects.get(spotify_id=album_spotify_id)
  # Get list of dates
  aotd_dates = list(DailyAlbum.objects.filter(album=album).filter(date__lt=timezone.now()).values_list('date', flat=True))
  # Create return object and return it
  out = {}
  out['aotd_dates'] = aotd_dates
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)


###
# Return the percentage chance that a user's album will be picked (given current conditions)
###
def getChanceOfAotdSelect(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getChanceOfAotdSelect called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user (use request cookie if user is not passed in)
  user = (getSpotifyUser(request.session.get('discord_id')) if (user_discord_id=="") else (getSpotifyUser(user_discord_id)))
  # Check if user's selections are currently blocked, return 0% chance
  if(SpotifyUserData.objects.get(user=user).selection_blocked_flag):
    return JsonResponse({'percentage': 0.00})
  # Get current date
  day = datetime.date.today()
  # Get Date a year ago to filter by
  one_year_ago = day - datetime.timedelta(days=365)
  # Get counts needed to determine percentage
  user_submissions_count = Album.objects.filter(submitted_by=user).count()
  user_eligible_count = user_submissions_count - (DailyAlbum.objects.filter(date__gte=one_year_ago).filter(album__submitted_by=user).count())
  total_eligible_count = 0
  for spot_user in SpotifyUserData.objects.all():
    if((spot_user.selection_blocked_flag)):
      continue
    temp_submission_count = Album.objects.filter(submitted_by=spot_user.user).count()
    temp_eligible_count = temp_submission_count - (DailyAlbum.objects.filter(date__gte=one_year_ago).filter(album__submitted_by=spot_user.user).count())
    total_eligible_count += temp_eligible_count
  # Do math for percentage
  chance = (float(user_eligible_count)/float(total_eligible_count)) * 100.00
  # Return data 
  return JsonResponse({'percentage': chance})


###
# Return an object containing all of the aotd objects and their albums in a specific month
###
def getAOtDByMonth(request: HttpRequest, year: str, month: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAOtDByMonth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all AOtD Objects for this year and month
  month_AOtD = DailyAlbum.objects.filter(date__year=year, date__month=month)
  # Create and populate out object
  out = {}
  for aotd in month_AOtD:
    albumObj = aotd.album
    # Build album object
    temp = {}
    temp['raw_data'] = model_to_dict(albumObj)
    temp['title'] = albumObj.title
    temp['album_id'] = albumObj.spotify_id
    temp['album_img_src'] = albumObj.cover_url
    temp['album_src'] = albumObj.spotify_url
    temp['artist'] = {}
    temp['artist']['name'] = albumObj.artist
    temp['artist']['href'] = (albumObj.artist_url if albumObj.artist_url != "" else albumObj.raw_data['album']['artists'][0]['external_urls']['spotify'])
    temp['submitter'] = albumObj.submitted_by.discord_id
    temp['submitter_comment'] = albumObj.user_comment
    temp['submission_date'] = albumObj.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
    # Append out object to output
    out[aotd.date.strftime('%Y-%m-%d')] = temp
  # Return out object with timestamp
  out['timestamp'] = timezone.now().strftime("%m/%d/%Y, %H:%M:%S")
  return JsonResponse(out)