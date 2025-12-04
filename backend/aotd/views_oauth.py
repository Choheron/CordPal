from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from .utils import (
  getUserObj,
  isUserAotdParticipant,
  getAotdUserObj
)

from .models import (
  AotdUserData,
)
from users.models import (
  User
)

import logging
import requests
from dotenv import load_dotenv
import os
import json

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


## =========================================================================================================================================================================================
## OAuth METHODS
## =========================================================================================================================================================================================

###
# Check if a user has connected aotd to their account
###
def isAotdParticipant(request: HttpRequest):
  '''Check if a user has connected aotd to their account'''
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning(f"{request.crid} - isAotdParticipant called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user discord id
  userObj = getAotdUserObj(request.session.get("discord_id"))
  # return jsonResponse containing status
  return JsonResponse({'connected': (userObj != None)})


def enrollUser(request: HttpRequest):
  '''Enroll a user as an AOtD participant'''
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning(f"{request.crid} - enrollUser called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user discord id
  userObj = getUserObj(request.session.get("discord_id"))
  # Check if a user already exists
  try:
    aotdUserObj = AotdUserData.objects.get(user=userObj)
  except ObjectDoesNotExist:
    # Create a AotdUserData Object
    newUser = AotdUserData(
      user=userObj
    )
    newUser.save()
    userObj.aotd_enrolled = True
    userObj.save()
  # Return jsonResponse containing status
  return JsonResponse({ "enrolled": True })
