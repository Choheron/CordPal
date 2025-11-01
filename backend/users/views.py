from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone
from django.forms.models import model_to_dict
from django.contrib.auth.password_validation import password_validators_help_texts, validate_password
from django.core.exceptions import ValidationError

from .models import (
  User,
  UserAction
)
from discordapi.models import DiscordTokens

import logging
import os
import json
from datetime import datetime
import traceback

# Declare logging
logger = logging.getLogger()

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
    logger.warning("getUserCount called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    logger.warning("getUserList called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Iterate and retrieve User IDs
  userList = User.objects.all()
  # Declare and populate out dict
  out = {}
  out['users'] = {}
  for user in userList:
    tempDict = {}
    tempDict['discord_id'] = user.discord_id
    tempDict['avatar_url'] = user.get_avatar_url()
    tempDict['nickname'] = user.nickname
    tempDict['last_request_timestamp'] = user.last_request_timestamp
    # Store tempDict in out json
    out['users'][user.guid] = tempDict
  # Return dict response
  return JsonResponse(out)


###
# Get user data for the current session's user or the passed in ID
###
def getUserData(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUserData called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    logger.debug(f"Attempting to retreive user data for user id: {user_discord_id}...", extra={'crid': request.crid})
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
    logger.warning("getUserAvatarURL called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    logger.warning("isUserAdmin called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    logger.debug(f"Attempting to retreive user data for user id: {user_discord_id}...", extra={'crid': request.crid})
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
    logger.warning("updateUserData called with a non-POST method, returning 405.", extra={'crid': request.crid})
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
    logger.warning("isOnline called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user object from discord id
  user = User.objects.all().get(discord_id=user_discord_id)
  # Get timestamp and return
  out = {"online": user.is_online()}
  # Return additional information stating how longs its been since the user has been seen
  out['last_seen'] = user.last_seen()
  # Return status of online user
  out['status'] = user.online_status()
  
  # Return success code
  return JsonResponse(out)


###
# Get online status of ALL USERS on the site
###
def getAllOnlineData(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllOnlineData called with a non-GET method, returning 405.", extra={'crid': request.crid})
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
    temp['status'] = user.online_status()
    temp['last_request_timestamp'] = user.last_request_timestamp
    temp['last_heartbeat_timestamp'] = user.last_heartbeat_timestamp
    out[user.discord_id] = temp
  # Return users and timestamp
  out['timestamp'] = timezone.now()
  return JsonResponse(out)


###
# Get a list of users grouped by timezone
###
def getUsersByTimezone(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getUsersByTimezone called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all users
  users = User.objects.all().order_by("timezone_string")
  # Iterate through and build return object
  timezones = {}
  for user in users:
    userDict = model_to_dict(user)
    userDict['avatar_url'] = user.get_avatar_url()
    if(user.timezone_string in timezones.keys()):
      timezones[user.timezone_string].append(userDict)
    else:
      timezones[user.timezone_string] = [userDict]
  # Convert timezones to a list
  timezonesOut = []
  for key in timezones.keys():
    timezonesOut.append({"timezone": key, "users": timezones[key]})
  # Return users and timestamp
  out = {}
  out['users'] = timezonesOut
  out['timestamp'] = timezone.now()
  return JsonResponse(out)


###
# Heartbeat post request to determine online status
###
def heartbeat(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Heartbeat called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    user = User.objects.get(discord_id=request.session['discord_id'])
    logger.debug(f"Heartbeat received from {user.nickname}...", extra={'crid': request.crid})
  except:
    logger.warning(f"HEARTBEAT RECIEVED FROM UNKNOWN USER!", extra={'crid': request.crid})
    response = HttpResponse("/")
    response.status_code = 302
    return response
  # Return heartbest response with header to skip frontend middleware
  response = HttpResponse(200)
  response['X-Heartbeat'] = "true"
  return response


###
# Check if passed in field for the user is unique
###
def isFieldUnique(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("isFieldUnique called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Placeholder unique boolean
  isUnique = True
  try:
    # Get request body 
    reqBody = json.loads(request.body)
    # Do password check
    if(reqBody['field'].upper() == "PASSWORD"):
      return JsonResponse(status = 403)
    # Get a list of values passed in field  
    valuesList = User.objects.values_list(reqBody['field'], flat=True)
    if(reqBody['value'] in valuesList):
      isUnique = False
      logger.debug(f"Field \"{reqBody['field']}\" with value \"{reqBody['value']}\" is NOT unique across users!", extra={'crid': request.crid})
    else:
      logger.debug(f"Field \"{reqBody['field']}\" is unique across users.", extra={'crid': request.crid})
  except Exception as e:
    logger.error(f"Failure when checking unqiue field: {e}", extra={'crid': request.crid})
    return JsonResponse(status = 500)
  # Return response
  response = JsonResponse({"unique": isUnique})
  return response


###
# Get Login Methods allowed for a user
###
def getLoginMethods(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getLoginMethods called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Determine if this call is to use session or passed in value
  if(user_discord_id != ""):
    request_id = user_discord_id
  else:
    request_id = str(request.session['discord_id'])
  # Get User
  user = User.objects.get(discord_id=request_id)
  # Methods list
  methods = []
  # If they have a discord key entry, add discord
  try:
    token = DiscordTokens.objects.get(user=user)
    methods.append("Discord")
  except:
    logger.debug(f"User does not have a discord id in database.", extra={'crid': request.crid})
  # If the user has a password
  if(user.password != None):
    methods.append("Username/Password")
  # Return response
  response = JsonResponse({"methods": methods})
  return response


###
# Get password validators text
###
def getPasswordValidators(request: HttpRequest, user_discord_id: str = ""):
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getPasswordValidators called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Return list of password validator help texts
  return JsonResponse({'validators': password_validators_help_texts()})


###
# Update or set a user's password, will return 200 even in the event of failed setting.
# Will return a JSON object containing the status of the update and associated message.
###
def updateUserPassword(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("updateUserPassword called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    # Get request body
    reqBody = json.loads(request.body)
    # Get nonpassword body data
    update = reqBody['update']
    userID = reqBody['user_data']['guid']
    user = User.objects.get(guid=userID)
    # Get password data
    oldPass = reqBody['old_password']
    newPass = reqBody['new_password']
    # Check old password (if required)
    if(update and (not user.check_password(oldPass))):
      out = {}
      out['success'] = False
      out['errorType'] = "OLD"
      out['message'] = "Old password incorrect."
      return JsonResponse(out)
    # Check new password
    try:
      validate_password(newPass, user)
    except ValidationError as e:
      out = {}
      out['success'] = False
      out["errorType"] = "NEW"
      out['message'] = e.messages
      return JsonResponse(out)
    # Set new password
    user.set_password(newPass)
    user.save()
    # Build response object
    out = {}
    out['success'] = True
    out['errorType'] = ""
    out['message'] = "Password successfully updated!"
    return JsonResponse(out)
  except Exception:
    logger.error(f"System Error setting password! {traceback.format_exc()}", extra={'crid': request.crid})
    out = {}
    out['success'] = False
    out['errorType'] = "SYS"
    out["message"] = f"Internal server error. Your password HAS NOT BEEN UPDATED. Please contact support with the following information. Code: PASS5ET3R. Timestamp: {datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}."
    return JsonResponse(out, status=500)
  

###
# Post request that will attempt a login using traditional username and password
###
def traditionalLogin(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("updateUserPassword called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  try:
    # Get request body
    reqBody = json.loads(request.body)
    # Get passed in username and password
    username = reqBody['username']
    password = reqBody['password']
    # Get user by username
    try:
      user = User.objects.get(nickname=username)
    except User.DoesNotExist as e:
      logger.warning(f"Attempted login with nickname {username}. User not found!", extra={'crid': request.crid})
      out = {}
      out['success'] = False
      out['errorType'] = "USER"
      out["message"] = "Username not found"
      return JsonResponse(out)
    # Check the password for the user
    if(not user.check_password(password)):
      logger.warning(f"Attempted login with nickname {username}. Incorrect Password!", extra={'crid': request.crid})
      out = {}
      out['success'] = False
      out['errorType'] = "PASS"
      out["message"] = "Username/Password not found or Incorrect."
      return JsonResponse(out)
    # If password is correct, attach the discord_id to the session and return success
    request.session['discord_id'] = user.discord_id
    request.session.modified = True
    out = {}
    out['success'] = True
    out['errorType'] = ""
    out["message"] = "Successful Login, Redirecting to Dashboard... Please Wait."
    return JsonResponse(out)
  except Exception:
    logger.error(f"System Error during traditional login! {traceback.format_exc()}", extra={'crid': request.crid})
    out = {}
    out['success'] = False
    out['errorType'] = "SYS"
    out["message"] = f"Internal server error. Please contact support with the following information: Code: LOGIN. Timestamp: {datetime.now().strftime('%m/%d/%Y, %H:%M:%S')}."
    return JsonResponse(out, status=500)
  

###
# Get last 10 user actions
###
def getRecentUserActions(request: HttpRequest):
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getRecentUserActions called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve last 10 user actions
  user_actions = UserAction.objects.all().order_by('-id')[:10]
  # Iterate User Action objects and convert to JSON
  outList = []
  for action in user_actions:
    outList.append(action.toJSON())
  # Return response
  return JsonResponse({'actions': outList})