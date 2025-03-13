from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone

import logging
from dotenv import load_dotenv
import os
import json
from datetime import datetime, timedelta

from .models import UserAlbumOutage as Outages
from users.models import User

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

## =========================================================================================================================================================================================
## Album Selection Outage Methods
## =========================================================================================================================================================================================

###
# Submit a new outage for a user.
###
def createOutage(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("createOutage called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Retreive expected items from request body (Also grab objects where needed)
  user = User.objects.get(reqBody['user_discord_id'])
  start_date = datetime.strptime(reqBody['start_date'])
  end_date = datetime.strptime(reqBody['end_date'])
  reason = reqBody['reason']
  admin_enacted = (reqBody['admin_enacted'] if ('admin_enacted' in reqBody) else False)
  admin_enactor = (User.objects.get(reqBody['admin_discord_id']) if ('admin_discord_id' in reqBody) else None)
  # Ensure that start_date is over three days away from the current date
  earlist_start = timezone.now() + timedelta(days=3)
  if(start_date < earlist_start):
    logger.warning("Request for creation of an outage had a date within 3 days... Rejecting and returning error message.")
    return HttpResponse("Creation Failed. Start Date cannot be within 3 days of current time.", status_code=400, content_type="text/plain")
  # Store new outage in database
  outage = Outages(
    user = user,
    start_date = start_date,
    end_date = end_date,
    reason = reason,
    admin_enacted = admin_enacted,
    admin_enactor = admin_enactor
  )
  # Save outage
  outage.save()


###
# Delete an outage by ID, ID corresponds to the outage's PK in the database.
###
def deleteOutage(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("deleteOutage called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get data from request
  reqBody = json.loads(request.body)
  # Retreive expected items from request body (Also grab objects where needed)
  try:
    deleter = User.objects.get(discord_id=((reqBody['deleter_discord_id']) if ('deleter_discord_id' in reqBody) else (request.session['discord_id'])))
    reason = reqBody['reason']
    outage = Outages.objects.get(pk=reqBody['outageId'])
  except User.DoesNotExist as e:
    logger.warning(f"Unable to find user with provided data in request body!")
    return HttpResponse("User with passed in Discord ID not found.", status_code=404, content_type="text/plain")
  except Outages.DoesNotExist as e:
    logger.warning(f"Unable to find outage with passed in ID of: {reqBody['outageId']}")
    return HttpResponse("User Outage with passed in ID not found.", status_code=404, content_type="text/plain")
  except Exception as e:
    logger.warning(f"Failiure to delete outage, request body lacking required information...")
    logger.debug(f"Request Body: {reqBody}")
    return HttpResponse("Unable to delete user outage, this is most likely the result of an internal error. Please contact Admins...", status_code=400, content_type="text/plain")
  # Delete outage
  try:
    outage.delete(deleter, reason)
  except:
    logger.error(f"FAILIURE WHEN DELETING OUTAGE: {outage.pk}")
    return HttpResponse("Unable to delete user outage, this is most likely the result of an internal error. Please contact Admins...", status_code=400, content_type="text/plain")
  # Return status 200
  return HttpResponse("Deletion Complete", status_code=200, content_type="text/plain")


###
# Get Outages by passed in user ID or get all outages if no user ID is provided
###
def getOutages(request: HttpRequest, user_discord_id: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getOutages called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all outages
  outages = Outages.objects.all()
  # Get user data
  if(user_discord_id):
    outages = outages.filter(user__discord_id=user_discord_id)
  # Return a list of outages, converting each outage to a dict
  outList = []
  for outage in outages:
    outList.append(outage.dict())
  # Attach to JSON object
  out = {"outages": outList}
  # Return outage list
  return JsonResponse(out)
  

###
# Get all outages currently in effect
###
def getCurrentOutages(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getCurrentOutages called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get today
  today = timezone.now()
  # Get outages currently in effect
  outages = Outages.objects.filter(start_date__lte=today, end_date__gte=today)
  # Return a list of outages, converting each outage to a dict
  outList = []
  for outage in outages:
    outList.append(outage.dict())
  # Attach to JSON object
  out = {"outages": outList}
  # Return outage list
  return JsonResponse(out)


###
# Get all outages in effect for a passed in date (date assumed to be in YYYY-MM-DD format)
###
def getOutagesByDate(request: HttpRequest, date: str = None):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getOutagesByDate called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # If no date is provided, error out and return error code
  try:
    date = datetime.strptime(date, "%Y-%m-%d")
  except:
    logger.error(f"Failure parsing date: {date}.")
    return HttpResponse("Invalid request, a date must be provided in YYYY-MM-DD format.", status_code=400)
  # Get all outages that apply to the provided date
  outages = Outages.objects.filter(start_date__lte=date, end_date__gte=date)
  # Return a list of outages, converting each outage to a dict
  outList = []
  for outage in outages:
    outList.append(outage.dict())
  # Attach to JSON object
  out = {"outages": outList}
  # Return outage list
  return JsonResponse(out)