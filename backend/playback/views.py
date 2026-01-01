from django.http import HttpRequest, HttpResponse, JsonResponse

import logging
import os
from dotenv import load_dotenv
import datetime
import pytz
import json

# Model imports from other apps
from aotd.models import (
  AotdUserData
)
from .models import (
  GlobalPlayback,
  UserPlayback
)

from aotd.utils import (
  getAotdUserObj
)
from .utils import (
  generateGlobalPlayback,
  generateUserPlayback
)


# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


def generateCordpalPlayback(request: HttpRequest):
  '''
  Generate "CordPal Playback" data for site-wide and every user. This should be called once a year on new years at midnight by a cronjob. Must be a POST Request.
  
  :param request: Django request object
  :type request: HttpRequest
  '''
  # Get current date (should be Jan 1st of new year)
  date = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
  # Is a body provided?
  try:
    body = json.loads(request.body)
    year = body['year']
  except:
    body = None
    # Subtract one from year to get last year's data
    year = ((date.year - 1) if APP_ENV == "PROD" else (date.year))
  # Start with site-wide cordpal playback data
  logger.info("Beginning CordPal Playback generation...")
  # If we are in the dev ENV delete existing data and rerun
  if(APP_ENV == "DEV"):
    try:
      globalPlaybackObj = GlobalPlayback.objects.filter(year=year)
      logger.info(f"Request required recalculation of Sitewide Playback {year} data, deleting current playback data and generating...")
      globalPlaybackObj.delete()
    except:
      logger.debug(f"Sitewide dev data for {year} not found, continuing...")
  try:
    logger.info(f"Generating Cordpal Playback data for {year}", extra={'crid': request.crid, 'playback_year': year})
    generateGlobalPlayback(year)
  except Exception as e:
    print(e)
    logger.critical(f"Failure Generating Sitewide playback data for {year}", extra={'crid': request.crid, 'playback_year': year, 'error': e})
    return HttpResponse(status=500)
  # Get all users who have reviewed in the past year
  userList = AotdUserData.objects.exclude(user__is_active=False)
  for user in userList:
    # If we are in the dev ENV delete existing data and rerun
    if(APP_ENV == "DEV"):
      try:
        userPlaybackObj = UserPlayback.objects.filter(year=year).get(aotd_user__user=user)
        logger.info(f"Requiring deletion of Playback {year} data for {userPlaybackObj.aotd_user.pk}, deleting current playback data and generating...")
        userPlaybackObj.delete()
      except:
        logger.debug(f"User {user.pk} dev playback data for {year} not found, continuing...")
    try:
      logger.info(f"Generating Cordpal Playback {year} data for user {user.pk}", extra={'crid': request.crid, 'playback_year': year, "user": user.pk})
      generateUserPlayback(year, user.pk)
    except Exception as e:
      print(e)
      logger.critical(f"Failure Generating Cordpal Playback {year} data for {user.pk}", extra={'crid': request.crid, 'playback_year': year, "user": user.pk, 'error': e})
      return HttpResponse(status=500)
  return HttpResponse(status=200)



def getGlobalPlaybackData(request: HttpRequest, year: int, recalculate: str = "FALSE"):
  '''
  Retrieve "CordPal Playback" data for the site-wide statistics given a year. An admin can request a recalculation of the cordpal data by passing true in the recalculate parameter. Must be a GET request.
  
  :param request: Django HttpRequest Object 
  :type request: HttpRequest
  :param year: Playback year to query
  :type year: int
  :param recalculate: Should a recalulation/generation of the passed in year be attempted?
  :type recalculate: str
  '''
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getGlobalPlaybackData called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Make recalculation checks and act accordingly
  if(recalculate == "TRUE"):
    # Check if user is admin and if so, delete and recalculate data for site-wide playback data
    # NOTE: Implement admin checking when you implement the admin dashboard
    globalPlaybackObj = GlobalPlayback.objects.get(year=year)
    globalPlaybackObj.delete()
    generateGlobalPlayback(year)
  # Retrieve and return data or error if not found
  try:
    globalPlaybackObj = GlobalPlayback.objects.get(year=year)
    logger.info(f"Sitewide playback {year} data found, returning...")
    return JsonResponse(globalPlaybackObj.toJSON())
  except:
    logger.error(f"Sitewide playback {year} data not found! returning 404 json...")
    return JsonResponse({'error': f"No global Cordpal Playback data found for {year}"}, status=404)


def getUserPlaybackData(request: HttpRequest, year: int, user_discord_id: str | None = None, recalculate: str = "FALSE"):
  '''
  Retrieve "CordPal Playback" data for a user given a year and user. An admin can request a recalculation of the cordpal data by passing true in the recalculate parameter. Must be a GET request.
  
  :param request: Django HttpRequest Object 
  :type request: HttpRequest
  :param year: Playback year to query
  :type year: int
  :param user_discord_id: Discord ID of user to query
  :type user_discord_id: str
  :param recalculate: Should a recalulation/generation of the passed in year be attempted?
  :type recalculate: str
  '''
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getUserPlaybackData called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Parse user id and retrieve data as needed
  aotd_user = AotdUserData.objects.get(user__discord_id=user_discord_id) if user_discord_id else getAotdUserObj(request.session.get('discord_id'))
  # Make recalculation checks and act accordingly
  if(recalculate == "TRUE"):
    # Check if user is admin and if so, delete and recalculate data for user playback data
    # NOTE: Implement admin checking when you implement the admin dashboard
    userPlaybackObj = UserPlayback.objects.filter(year=year).get(aotd_user=aotd_user)
    userPlaybackObj.delete()
    generateUserPlayback(year, aotd_user.user.pk)
  # Retrieve and return data or error if not found
  try:
    userPlaybackObj = UserPlayback.objects.filter(year=year).get(aotd_user=aotd_user)
    logger.info(f"Playback {year} data for user {aotd_user.user.pk} found, returning...")
    return JsonResponse(userPlaybackObj.toJSON())
  except:
    logger.error(f"Playback {year} data for user {aotd_user.user.pk} data not found! returning 404 json...")
    return JsonResponse({'error': f"No user Cordpal Playback {year} data found for user {aotd_user.user.pk}"}, status=404)
  

def isPlaybackAvailable(request: HttpRequest, year: int, user_discord_id: str | None = None):
  '''
  Return a JSON object containing a simple "available" field with a true or false value.
  
  :param request: Django HttpRequest Object
  :type request: HttpRequest
  :param year: Playback year to query
  :type year: int
  :param user_discord_id: Discord ID of user to query
  :type user_discord_id: str | None
  '''
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"getGlobalPlaybackData called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # If a user id is provided, check for that, else check for general sitewide data
  available = False
  if(user_discord_id):
    try:
      temp = UserPlayback.objects.filter(year=year).get(aotd_user__user__discord_id=user_discord_id)
      available = True
    except:
      pass
  else:
    try:
      temp = GlobalPlayback.objects.get(year=year)
      available = True
    except:
      pass
  return JsonResponse({"available": available})
  