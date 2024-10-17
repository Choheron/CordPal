from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder

from .models import User

import logging
import os
import json

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

# Import Models
from users.models import User

###
# Get a count of all users in the DB
###
def getUserCount(request: HttpRequest):
  logger.info("getUserCount called...")
  # Make sure request is a post request
  if(request.method != "GET"):
    logger.warning("getUserCount called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Return user count
  userCount = User.objects.count()
  # Create response 
  usersCountData = json.dumps({"count": str(userCount)})
  # Return json containing count
  return HttpResponse(usersCountData, content_type='text/json', status=200)

###
# Get user data for the current session's user
###
def getUserData(request: HttpRequest):
  logger.info("getUserData called...")
  # Make sure request is a post request
  if(request.method != "GET"):
    logger.warning("getUserData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user data from database, if its not there create one.
  try:
    userData = User.objects.get(discord_id = str(request.session['discord_id']))
  except:
    res = HttpResponse("User Not Found")
    res.status_code = 404
    return res
  # Convert to json
  out = userData.__dict__
  del out["_state"]
  userDataJson = json.dumps(out, cls=DjangoJSONEncoder)
  # Return user data json
  return HttpResponse(userDataJson, content_type='text/json', status=200)

###
# Get user avatar url for the current session's user
###
def getUserAvatarURL(request: HttpRequest):
  logger.info("getUserAvatarURL called...")
  # Make sure request is a post request
  if(request.method != "GET"):
    logger.warning("getUserAvatarURL called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user data from database
  try:
    userData = User.objects.get(discord_id = request.session['discord_id'])
  except:
    res = HttpResponse("User Not Found")
    res.status_code(404)
    return res
  # Call user method to get URL and convert to json
  userDataURLJson = json.dumps({"url": userData.get_avatar_url()})
  # Return user data json
  return HttpResponse(userDataURLJson, content_type='text/json', status=200)