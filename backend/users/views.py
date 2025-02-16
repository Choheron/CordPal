from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone

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
  # Make sure request is a get request
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
# Get a list of all users in json form, list includes each users ID, avatar URL, and Nickname
###
def getUserList(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUserList called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Iterate and retrieve User IDs
  userList = User.objects.all()
  # Declare and populate out dict
  out = {}
  for user in userList:
    tempDict = {}
    tempDict['discord_id'] = user.discord_id
    tempDict['avatar_url'] = user.get_avatar_url()
    tempDict['nickname'] = user.nickname
    tempDict['last_request_timestamp'] = user.last_request_timestamp
    # Store tempDict in out json
    out[user.guid] = tempDict
  # Return dict response
  return JsonResponse(out)


###
# Get user data for the current session's user or the passed in ID
###
def getUserData(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUserData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Determine if this call is to use session or passed in value
  if(user_discord_id != ""):
    request_id = user_discord_id
  else:
    request_id = str(request.session['discord_id'])
  # Retrieve user data from database, if its not there create one.
  try:
    logger.info(f"Attempting to retreive user data for user id: {user_discord_id}...")
    userData = User.objects.get(discord_id = request_id)
  except:
    res = HttpResponse("User Not Found")
    res.status_code = 404
    return res
  # Convert to json
  out = userData.__dict__
  del out["_state"]
  # Append Avatar URL to userData response
  out['avatar_url'] = userData.get_avatar_url()
  # Return user data json
  return JsonResponse(out, status=200)


###
# Get user avatar url for the current session's user or the passed in ID
###
def getUserAvatarURL(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getUserAvatarURL called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Determine if this call is to use session or passed in value
  if(user_discord_id != ""):
    request_id = user_discord_id
  else:
    request_id = str(request.session['discord_id'])
  # Retrieve user data from database
  try:
    userData = User.objects.get(discord_id = request_id)
  except:
    res = HttpResponse("User Not Found")
    res.status_code(404)
    return res
  # Call user method to get URL and convert to json
  userDataURLJson = json.dumps({"url": userData.get_avatar_url()})
  # Return user data json
  return HttpResponse(userDataURLJson, content_type='text/json', status=200)


###
# Get a boolean if a user is an admin or not
###
def isUserAdmin(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("isUserAdmin called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Determine if this call is to use session or passed in value
  if(user_discord_id != ""):
    request_id = user_discord_id
  else:
    request_id = str(request.session['discord_id'])
  # Retrieve user data from database, if its not there create one.
  try:
    logger.info(f"Attempting to retreive user data for user id: {user_discord_id}...")
    userData = User.objects.get(discord_id = request_id)
  except:
    res = HttpResponse("User Not Found")
    res.status_code = 404
    return res
  # Convert to json
  out = {}
  out["id"] = request_id
  out["admin_status"] = userData.is_staff
  # Return user admin status json
  return JsonResponse(out, status=200)


###
# Update user data changing the fields provided in the request
###
def updateUserData(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("updateUserData called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Body data
  reqBody = json.loads(request.body)
  # Retrieve user data via session storage then update user data
  User.objects.filter(discord_id=request.session['discord_id']).update(**reqBody)
  # Return success code
  return HttpResponse(200)


###
# Get a specific user's last request timestamp
###
def isOnline(request: HttpRequest, user_discord_id: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("isOnline called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user object from discord id
  user = User.objects.all().get(discord_id=user_discord_id)
  # Get timestamp and return
  out = {"online": user.is_online()}
  # Return additional information stating how longs its been since the user has been seen
  out['last_seen'] = user.last_seen()
  
  # Return success code
  return JsonResponse(out)


###
# Get online status of ALL USERS on the site
###
def getAllOnlineData(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllOnlineData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all users
  users = User.objects.all()
  # Iterate through and build return object
  out = {}
  for user in users:
    temp = {}
    temp["online"] = user.is_online()
    temp['last_seen'] = user.last_seen()
    temp['last_request_timestamp'] = user.last_request_timestamp
    out[user.discord_id] = temp
  # Return users and timestamp
  out['timestamp'] = timezone.now()
  return JsonResponse(out)


###
# Heartbeat post request to determine online status
###
def heartbeat(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Heartbeat called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    user = User.objects.get(discord_id=request.session['discord_id'])
    logger.info(f"Heartbeat received from {user.nickname}...")
  except:
    logger.warning(f"HEARTBEAT RECIEVED FROM UNKNOWN USER!")
  # Yeah
  return HttpResponse(200)