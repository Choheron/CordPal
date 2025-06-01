from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict
from django.db.models import Count, Q
from django.utils import timezone
from django.core import management

from .utils import (
  checkSelectionFlag,
  getAotdUserObj,
  getAlbumRating,
  generateDayRatingTimeline
)
from .models import (
  Album,
  DailyAlbum,
  AotdUserData,
  Review,
  UserAlbumOutage,
  UserChanceCache
)

import logging
from dotenv import load_dotenv
import os
import datetime
import pytz
import random
import traceback
import json

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
  from .views_album import getAlbum
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
  out['album_data'] = json.loads(getAlbum(request, dailyAlbumObj.album.spotify_id).content)
  out['date'] = date
  logger.info(f"Returning Album of Day Object for Date {date}...")
  return JsonResponse(out)


###
# Set a new album of the day. Returns an HTTPResponse
###
def setAlbumOfDay(request: HttpRequest):
  # Sneak in a session table cleanup call here
  management.call_command("clearsessions", verbosity=0)
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("setAlbumOfDay called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check and set selection flags for all users
  for spot_user in AotdUserData.objects.all():
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
  # Get all users currently in an outage
  outage_users = list(UserAlbumOutage.objects.filter(start_date__lte=day, end_date__gte=day).values_list('user__discord_id', flat=True))
  logger.warning(f"Outage Users: {outage_users}")
  # Get list of all users who are currently AOtD selection blocked
  blocked_users = list(AotdUserData.objects.filter(selection_blocked_flag=True).values_list('user__discord_id', flat=True))
  logger.warning(f"Blocked Users: {blocked_users}")
  # Get set of all eligible albums
  albumPool = Album.objects.all().exclude(submitted_by__discord_id__in=blocked_users).exclude(submitted_by__discord_id__in=outage_users)
  while(not selected):
    # If no eligible albums, error out..
    if(len(albumPool) == 0):
      logger.error(f"WARNING! NO ELIGIBLE ALBUMS FOR SELECTION! NO ALBUM WILL BE SELECTED")
      return HttpResponse(f'No albums eligible for selection!', status=404)
    # Filter out blocked users albums
    tempAlbum = random.choice(albumPool)
    logger.info(f"Temp album selected: {tempAlbum.title}")
    try:
      albumCheck = DailyAlbum.objects.filter(date__gte=one_year_ago).get(album=tempAlbum)
      albumPool = albumPool.exclude(spotify_id=tempAlbum.spotify_id)
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
  yesterday = day - datetime.timedelta(days=1)
  try:
    # Attempt to get previous AOtD Object and generate a timeline, as well as store final rating for that album in the AOtD object
    yesterday_aotd = DailyAlbum.objects.get(date=yesterday)
    generateDayRatingTimeline(yesterday_aotd)
    yesterday_aotd.rating = getAlbumRating(yesterday_aotd.album.spotify_id, False, yesterday.strftime("%Y-%m-%d"))
    yesterday_aotd.save()
  except:
    logger.error(f"ERROR IN GENERATING TIMELINE DATA FOR DATE: {yesterday.strftime('%Y-%m-%d')} TRACEBACK: {traceback.print_exc()}")
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
    date=day,
    manual=True
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
  aotd_dates = list(DailyAlbum.objects.filter(album=album).filter(date__lte=datetime.datetime.now(tz=pytz.timezone('America/Chicago')).date()).values_list('date', flat=True))
  # Create return object and return it
  out = {}
  out['aotd_dates'] = aotd_dates
  out['metadata'] = {}
  out['metadata']['timestamp'] = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
  # Return data 
  return JsonResponse(out)


###
# Calculate all user's percentage of being picked given current conditions (will run on a cron)
###
def calculateAOTDChances(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("calculateAOTDChances called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get current date
  day = datetime.date.today()
  tomorrow = datetime.date.today() + datetime.timedelta(days=1)
  # Get Date a year ago to filter by
  one_year_ago = day - datetime.timedelta(days=365)
  # Get user list
  user_list = AotdUserData.objects.all().annotate(
    total_submissions=Count('user__album', distinct=True),
    recent_picks=Count(
      'user__album__dailyalbum',
      filter=Q(user__album__dailyalbum__date__gte=one_year_ago),
      distinct=True
    )
  )
  # Get a map of all outages
  user_outage_map = set(
    UserAlbumOutage.objects
      .filter(start_date__lte=tomorrow, end_date__gte=tomorrow)
      .values_list('user_id', flat=True)
  )
  # Iterate all users and update the selection blocked flag
  for user in user_list:
    checkSelectionFlag(user)
  # Get a list of all spotify users
  spotify_users = AotdUserData.objects.all()
  # Get a list of users who are eligible for selection
  eligible_users = spotify_users.filter(
    selection_blocked_flag=False
  ).exclude(user_id__in=user_outage_map).select_related('user').annotate(
    total_submissions=Count('user__album', distinct=True),
    recent_picks=Count(
      'user__album__dailyalbum',
      filter=Q(user__album__dailyalbum__date__gte=one_year_ago),
      distinct=True
    )
  )
  # Iterate all spotify users and calculate aotd chances
  for spotUser in spotify_users:
    logger.info(f"Calculating chance percentage for user {spotUser.user.nickname}")
    # Retrieve user from spotifydata
    user = spotUser.user
    # Get the user's chance object
    userChanceObj: UserChanceCache = UserChanceCache.objects.update_or_create(
      spotify_user=spotUser,
      defaults={
        'chance_percentage': 0.00,
        'block_type': None,
        'outage': None,
        'reason': None,
      }
    )[0]
    # Check if user's selections are currently blocked, return 0% chance
    if(spotUser.selection_blocked_flag):
      # Get user's last review
      lastReview = Review.objects.filter(user=spotUser.user).order_by('-aotd_date').first()
      days_since = day - (lastReview.aotd_date if (lastReview != None) else day)
      # Store data
      userChanceObj.chance_percentage = 0.00
      userChanceObj.block_type = "INACTIVITY"
      userChanceObj.reason = f"Inactivity, user has not reviewed in over three days. Last review was {days_since.days} days ago."
    # Check if user is currently under an outage
    elif(user.discord_id in user_outage_map):
      outage = UserAlbumOutage.objects.filter(user=user).get(start_date__lte=tomorrow, end_date__gte=tomorrow)
      logger.info(f"User {user.nickname} is currently under an outage, lasts until {outage.end_date.strftime('%Y-%m-%d')}!")
      # Create outage return json
      userChanceObj.chance_percentage = 0.00
      userChanceObj.block_type = "OUTAGE"
      userChanceObj.outage = outage
      userChanceObj.reason = f"{outage.reason}"
      # Continue onto next user
      continue
    else:
      # Get counts needed to determine percentage
      user_submissions_count = Album.objects.filter(submitted_by=user).count()
      user_eligible_count = user_submissions_count - (DailyAlbum.objects.filter(date__gte=one_year_ago).filter(album__submitted_by=user).count())
      total_eligible_count = sum(
        user.total_submissions - user.recent_picks for user in eligible_users
      )
      # Do math for percentage
      try:
        chance = round((float(user_eligible_count)/float(total_eligible_count)) * 100.00, 2)
      except:
        chance = round(0, 2)
      # Update with correct data
      userChanceObj.chance_percentage = chance
      userChanceObj.block_type = None
      userChanceObj.reason = None
    # Save user chance object
    userChanceObj.save()
  # Return a 200 for successful calculation
  return HttpResponse(status=200)


###
# Return the percentage chance that a user's album will be picked (taken from DB)
###
def getChanceOfAotdSelect(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getChanceOfAotdSelect called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get current chance object from cache
  aotdUser: AotdUserData = (getAotdUserObj(user_discord_id) if (user_discord_id != "") else getAotdUserObj(request.session.get("discord_id")))
  # Get user percentage
  out: UserChanceCache = aotdUser.aotd_chance
  # Return object
  return JsonResponse(out.toJSON())


###
# Return an object containing all of the aotd objects and their albums in a specific month
# NOTE: This function has been expanded to include statistics for each month, so less loops and DB calls are needed
# NOTE 2: This function has been updated to only include AOtD selections up to todays date.
###
def getAOtDByMonth(request: HttpRequest, year: str, month: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAOtDByMonth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all AOtD Objects for this year and month
  month_AOtD = DailyAlbum.objects.filter(date__year=year, date__month=month).filter(date__lte=timezone.now())
  # Create out object
  out = {}
  if(len(month_AOtD) != 0):
    # Track highest and lowest album scores of the month
    highest_aotd: DailyAlbum = month_AOtD.first()
    highest_aotd_rating = getAlbumRating(highest_aotd.album.spotify_id, rounded=False, date=highest_aotd.date)
    lowest_aotd: DailyAlbum = month_AOtD.first()
    lowest_aotd_rating = getAlbumRating(lowest_aotd.album.spotify_id, rounded=False, date=lowest_aotd.date)
    # Track counts of submitters selected
    selection_counts = {}
    for aotd in month_AOtD:
      albumObj = aotd.album
      # Get album Rating
      rating = getAlbumRating(aotd.album.spotify_id, rounded=False, date=aotd.date)
      # Check highest and lowest ratings if rating is not null
      if(rating):
        if((highest_aotd_rating == None) or (rating > highest_aotd_rating)):
          highest_aotd = aotd
          highest_aotd_rating = rating
        if((lowest_aotd_rating == None) or (rating < lowest_aotd_rating)):
          lowest_aotd = aotd
          lowest_aotd_rating = rating
      # Increment submitter selection count
      submitter = albumObj.submitted_by.discord_id
      if(submitter in selection_counts):
        selection_counts[submitter] += 1
      else:
        selection_counts[submitter] = 1
      # Build album object
      temp = {}
      temp['raw_data'] = model_to_dict(albumObj)
      temp['title'] = albumObj.title
      temp['spotify_id'] = albumObj.spotify_id
      temp['album_img_src'] = albumObj.cover_url
      temp['album_src'] = albumObj.spotify_url
      temp['artist'] = {}
      temp['artist']['name'] = albumObj.artist
      temp['artist']['href'] = (albumObj.artist_url if albumObj.artist_url != "" else albumObj.raw_data['album']['artists'][0]['external_urls']['spotify'])
      temp['submitter'] = albumObj.submitted_by.discord_id
      temp['submitter_comment'] = albumObj.user_comment
      temp['submission_date'] = albumObj.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
      # Attach rating of album
      temp['rating'] = rating
      # Append out object to output
      out[aotd.dateToCalString()] = temp
    # Convert submission numbers to array
    subNumList = []
    subNumObj = {}
    for user in selection_counts.keys():
      datesList = list(date for date in out.keys() if (out[date]['submitter'] == user))
      tempObj = {
        "discord_id": user, 
        "count": selection_counts[user], 
        "percent": ((selection_counts[user]/float(len(month_AOtD))) * 100), 
        "selection_dates": datesList
      }
      subNumList.append(tempObj)
      # Provide the above list as a object as well
      subNumObj[user] = tempObj
    # Provide Statistics
    out['stats'] = {}
    # Attach lowest and highest album data
    out['stats']['lowest_aotd_date'] = lowest_aotd.dateToCalString()
    out['stats']['highest_aotd_date'] = highest_aotd.dateToCalString()
    # Attach Submission Numbers
    out['stats']['selection_counts'] = subNumList
    out['stats']['selection_total'] = len(month_AOtD)
    # Attach submission numbers object to out JSON 
    out['stats']['user_stats'] = subNumObj
  # Return out object with timestamp
  out['timestamp'] = timezone.now().strftime("%m/%d/%Y, %H:%M:%S")
  return JsonResponse(out)


###
# Get timeline data for a single aotd instance. If the data is not yet generated, return empty list in json
# aotd_date expected in %Y-%m-%d format.
###
def getDayTimelineData(request: HttpRequest, aotd_date: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getDayTimelineData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get aotd object
  try:
    aotd_obj = DailyAlbum.objects.get(date=datetime.datetime.strptime(aotd_date, "%Y-%m-%d"))
  except:
    return JsonResponse({"timeline": []})
  # Return object data
  return JsonResponse(aotd_obj.rating_timeline)