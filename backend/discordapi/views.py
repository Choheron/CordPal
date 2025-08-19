from django.http import HttpRequest, HttpResponse, JsonResponse
from django.contrib.auth import logout as auth_logout

from users.utils import (
  doesUserExist,
  createUserFromDiscordJSON,
)
from users.models import User

from .utils import (
  isDiscordTokenExpired, 
  refreshDiscordToken, 
  storeDiscordTokenInDatabase,
  checkPreviousAuthorization,
)
from .models import DiscordTokens

import logging
import requests
from datetime import datetime
from datetime import timedelta
from dotenv import load_dotenv
import os
import json
import traceback

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

###
# Exchange discord auth code for discord api token (part of the login flow)
###
def getDiscordToken(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("getDiscordToken called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Body data
  reqBody = json.loads(request.body)
  # Retrieve code from request
  discordCode = reqBody['code']
  discordRedirectURI = reqBody['redirect_uri']
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  reqData = {
    'grant_type': 'authorization_code',
    'code': discordCode,
    'redirect_uri': discordRedirectURI,
    'client_id': os.getenv('DISCORD_CLIENT_ID'),
    'client_secret': os.getenv('DISCORD_CLIENT_SECRET')
  }
  # Make request to discord api
  logger.debug("Making request to discord api...", extra={'crid': request.crid})
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    logger.error("Error in request:\n" + str(discordRes.json()), extra={'crid': request.crid})
    discordRes.raise_for_status()
  # Convert response to Json
  logger.debug("Discord api returned, converting to json...", extra={'crid': request.crid})
  discordResJSON = discordRes.json()
  # Retrieving discord data to create a user account
  reqHeaders = { 
    'Authorization': f"{discordResJSON['token_type']} {discordResJSON['access_token']}"
  }
  # Send Request to API
  logger.debug("Making request to discord api...", extra={'crid': request.crid})
  try:
    discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
    if(discordRes.status_code != 200):
      logger.error("Error in request:\n" + str(discordRes.json()), extra={'crid': request.crid})
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to Json
  discordResJSON.update(discordRes.json())
  # Store discord ID in session for user data retrieval
  request.session['discord_id'] = discordResJSON['id']
  # Check if user's data exists as a user in the database
  if(not(doesUserExist(discordResJSON['id']))):
    createUserFromDiscordJSON(discordResJSON)
  # Store discord data in database (This takes place after the user is created so we can associate token data with user)
  storeDiscordTokenInDatabase(request, discordResJSON)
  # Write success message
  messageOut = { 'message': "Success" }
  # Return Code
  logger.debug("Returning HTTP 200 Response...", extra={'crid': request.crid})
  return HttpResponse(content=messageOut, content_type='text/json', status=200)


###
# Retrieve basic info about the user and create a user instance
###
def getDiscordUserData(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getDiscordUserData called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user token data
  tokenData = DiscordTokens.objects.get(user__discord_id = request.session.get("discord_id"))
  # Ensure user is logged in
  if(isDiscordTokenExpired(request)):
    try:
      refreshDiscordToken(request)
    except Exception as e:
      logger.error(f"Filed to refresh discord token! Returning redirect call. Error: {e}", extra={'crid': request.crid})
      return HttpResponse("/", status=302)
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Authorization': f"{tokenData.token_type} {tokenData.access_token}"
  }
  # Send Request to API
  logger.info("Making request to discord api...", extra={'crid': request.crid})
  try:
    discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
    if(discordRes.status_code != 200):
      logger.error("Error in request:\n" + str(discordRes.json()), extra={'crid': request.crid})
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Store discord ID in session for user data retrieval
  request.session['discord_id'] = discordResJSON['id']
  # Check if user's data exists as a user in the database
  if(not(doesUserExist(discordResJSON['id']))):
    createUserFromDiscordJSON(discordResJSON)
  # Return JsonResponse containing user data
  return JsonResponse(discordResJSON)


###
# Validate that the user is a member of the discord server (TODO: Improve this flow, make it dynamic)
###
def validateServerMember(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("validateServerMember called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Cookie datetime format
  cookie_time_fmt = "%d/%m/%y %H:%M:%S"
  # Retrieve user token data
  try:
    tokenData = DiscordTokens.objects.get(user__discord_id = request.session.get("discord_id"))
  except DiscordTokens.DoesNotExist as e:
    logger.error("Discord token does not exist for this user, will need to revalidate.", extra={'crid': request.crid})
    out = {}
    out['member'] = False
    out['role'] = False
    return JsonResponse(out)
  # Ensure user is logged in
  try:
    if(isDiscordTokenExpired(request)):
      refreshDiscordToken(request)
  except Exception as e:
    logger.error(f"Filed to refresh discord token! Returning redirect call. Error: {e}", extra={'crid': request.crid})
    # Clear session cookie on fail
    response = HttpResponse("/", status=302)
    response.delete_cookie("session_id")
    return response
  # Check if member status already exists in session store
  if(("server_member" in request.session) and (datetime.strptime(request.session.get("server_member_expiry"), cookie_time_fmt) < datetime.now())):
    status = request.session.get("server_member")
    logger.debug(f"Session has cached membership value of: {status}", extra={'crid': request.crid})
    member = status
    hasRole = status
  else:
    # Prep headers to discord api
    reqHeaders = { 
      'Authorization': f"{tokenData.token_type} {tokenData.access_token}"
    }
    # Send Request to API
    logger.debug("Making request to discord api for server member object to check member and role...", extra={'crid': request.crid})
    try:
      discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me/guilds/{os.getenv('CORD_SERVER_ID')}/member", headers=reqHeaders)
      # NOTE: Not handling error code response here due to the nature of how im handling validation
    except:
      return HttpResponse(status=500)
    # Convert response to List
    discordResList: dict = discordRes.json()
    # Determine if user has been given an error response, meaning they are not a member of the guild
    logger.debug("Checking if user is in server...", extra={'crid': request.crid})
    member = not('message' in discordResList.keys())
    # print message
    if(not member):
      logger.debug(discordResList, extra={'crid': request.crid})
    # If user IS a member of the server, check that they have the required role
    hasRole = False
    if(member):
      hasRole = os.getenv('CORD_ROLE_ID') in discordResList['roles']
    # Store member status in session to skip this process for 5 mins
    logger.debug(f"Setting session storage to avoid discordapi calls for 5 mins...", extra={'crid': request.crid})
    request.session['server_member'] = (member and hasRole)
    request.session['server_member_expiry'] = (datetime.now() + timedelta(minutes=5)).strftime(cookie_time_fmt) 
  # Return JsonResponse containing true or false in body
  logger.debug("Returning member status...", extra={'crid': request.crid})
  out = {}
  out['member'] = member
  out['role'] = hasRole
  # Return response
  response = JsonResponse(out)
  return response


###
# Validate that the user has previously approved login
###
def checkIfPrevAuth(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfPrevAuth called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check if session is still valid
  validSession = (request.session.get('discord_id') != None) and (DiscordTokens.objects.get(user__discord_id = request.session.get('discord_id')).access_token != None)
  logger.debug(f"Valid Session After Expiry Check: {validSession}", extra={'crid': request.crid})
  # If session is invalid, return false
  if(not validSession):
    out = {}
    out['valid'] = validSession
    out['reason'] = "DIS"
    return JsonResponse(out)
  # Check if user sessionid token is valid
  logger.debug("Ensuring sessionid is valid...", extra={'crid': request.crid})
  # Set output var if session exists
  if(validSession):
    validSession = checkPreviousAuthorization(request)
  # Ensure user is logged in
  if(validSession and isDiscordTokenExpired(request)):
    try:
      refreshDiscordToken(request)
    except Exception as e:
      logger.error(f"Filed to refresh discord token! Returning False. Error: {e}", extra={'crid': request.crid})
      validSession = False
  # Return JsonResponse containing true or false in body
  logger.debug(f"Returning prevAuth status of: {validSession}...", extra={'crid': request.crid})
  out = {}
  out['valid'] = validSession
  return JsonResponse(out)


###
# Revoke discord token and clear session data for user
###
def logout(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("logout called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check if id exists in session
  discord_id = request.session.get('discord_id')
  if(discord_id == None):
    logger.error(f"LOGOUT CALLED WITH NO DISCORD ID! RETURNING 500...", extra={'crid': request.crid})
    return HttpResponse(status=500)
  # Ensure user is logged in
  if(isDiscordTokenExpired(request)):
    try:
      refreshDiscordToken(request)
    except Exception as e:
      logger.error(f"Filed to refresh discord token! Returning redirect call. Error: {e}", extra={'crid': request.crid})
      return HttpResponse("/", status=302)
  # Get token data from session
  tokenData = DiscordTokens.objects.get(user__discord_id = request.session.get('discord_id'))
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  reqData = {
    'client_id': os.getenv('DISCORD_CLIENT_ID'),
    'client_secret': os.getenv('DISCORD_CLIENT_SECRET'),
    'token': tokenData.access_token
  }
  # Make API request to discord to revoke user token
  logger.info("Making token revoke request to discord api...", extra={'crid': request.crid})
  try:
    discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token/revoke", headers=reqHeaders, data=reqData)
    if(discordRes.status_code != 200):
      logger.error("Error in request:\n" + str(discordRes.json()), extra={'crid': request.crid})
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Delete key data from database
  tokenData.clearTokens()
  # Clear session data
  logger.debug("Flushing session...", extra={'crid': request.crid})
  request.session.flush()
  request.session.modified = True
  # Return JsonResponse containing true or false in body
  logger.debug("Returning revoked status...", extra={'crid': request.crid})
  out = {}
  out['status'] = True
  # Log user out
  auth_logout(request)
  # Generate Response
  response = JsonResponse(out) 
  response.delete_cookie("session_id")
  return response


###
# Get a list of emojis from the server
# NOTE: This should be done by the bot, it would seem
###
def getEmojiList(request: HttpRequest):
  headers = {
    "Authorization": f"Bot {os.getenv('DISCORD_BOT_TOKEN')}"
  }
  # Send Request to API
  discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/guilds/{os.getenv('CORD_SERVER_ID')}/emojis", headers=headers)
  discordResObj: dict = discordRes.json()
  print(discordResObj)