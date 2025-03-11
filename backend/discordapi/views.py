from django.http import HttpRequest, HttpResponse, JsonResponse

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

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

###
# Exchange discord auth code for discord api token (part of the login flow)
###
def getDiscordToken(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("getDiscordToken called with a non-POST method, returning 405.")
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
  logger.info("Making request to discord api...")
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    print("Error in request:\n" + str(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  logger.info("Discord api returned, converting to json...")
  discordResJSON = discordRes.json()
  # Retrieving discord data to create a user account
  reqHeaders = { 
    'Authorization': f"{discordResJSON['token_type']} {discordResJSON['access_token']}"
  }
  # Send Request to API
  logger.info("Making request to discord api...")
  try:
    discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
    if(discordRes.status_code != 200):
      print("Error in request:\n" + str(discordRes.json()))
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
  logger.info("Returning HTTP 200 Response...")
  return HttpResponse(content=messageOut, content_type='text/json', status=200)


###
# Validate that the user is a member of the discord server (TODO: Improve this flow, make it dynamic)
###
def validateServerMember(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("validateServerMember called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Cookie datetime format
  cookie_time_fmt = "%d/%m/%y %H:%M:%S"
  # Ensure user is logged in
  if(isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Check if member status already exists in session store
  if(("server_member" in request.session) and (datetime.strptime(request.session.get("server_member_expiry"), cookie_time_fmt) < datetime.now())):
    status = request.session.get("server_member")
    logger.info(f"Session has cached membership value of: {status}")
    member = status
    hasRole = status
  else:
    # Prep headers to discord api
    reqHeaders = { 
      'Authorization': f"{request.session['discord_token_type']} {request.session['discord_access_token']}"
    }
    # Send Request to API
    logger.info("Making request to discord api for server member object to check member and role...")
    try:
      discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me/guilds/{os.getenv('CORD_SERVER_ID')}/member", headers=reqHeaders)
      # NOTE: Not handling error code response here due to the nature of how im handling validation
    except:
      return HttpResponse(status=500)
    # Convert response to List
    discordResList: dict = discordRes.json()
    # Determine if user has been given an error response, meaning they are not a member of the guild
    logger.info("Checking if user is in server...")
    member = not('message' in discordResList.keys())
    # print message
    if(not member):
      logger.info(discordResList)
    # If user IS a member of the server, check that they have the required role
    hasRole = False
    if(member):
      hasRole = os.getenv('CORD_ROLE_ID') in discordResList['roles']
    # Store member status in session to skip this process for 5 mins
    logger.info(f"Setting session storage to avoid discordapi calls for 5 mins...")
    request.session['server_member'] = (member and hasRole)
    request.session['server_member_expiry'] = (datetime.now() + timedelta(minutes=5)).strftime(cookie_time_fmt) 
  # Return JsonResponse containing true or false in body
  logger.info("Returning member status...")
  out = {}
  out['member'] = member
  out['role'] = hasRole
  # Return response
  response =JsonResponse(out)
  return response


###
# Validate that the user has previously approved login
###
def checkIfPrevAuth(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfPrevAuth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check if session is still valid
  validSession = (request.session.get_expiry_age() != 0)
  logger.info(f"Valid Session After Expiry Check: {validSession}")
  # Check if user sessionid token is valid
  logger.info("Ensuring sessionid is valid...")
  # Set output var if session exists
  if(validSession):
    validSession = checkPreviousAuthorization(request)
  # Ensure user is logged in
  if(validSession and isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Return JsonResponse containing true or false in body
  logger.info(f"Returning prevAuth status of: {validSession}...")
  out = {}
  out['valid'] = validSession
  return JsonResponse(out)


###
# Revoke discord token and clear session data for user
###
def revokeDiscordToken(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("revokeDiscordToken called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Ensure user is logged in
  if(isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  reqData = {
    'client_id': os.getenv('DISCORD_CLIENT_ID'),
    'client_secret': os.getenv('DISCORD_CLIENT_SECRET'),
    'token': request.session['discord_access_token']
  }
  # Make API request to discord to revoke user token
  logger.info("Making token revoke request to discord api...")
  try:
    discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token/revoke", headers=reqHeaders, data=reqData)
    if(discordRes.status_code != 200):
      print("Error in request:\n" + str(discordRes.json()))
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Clear session data
  logger.info("Flushing session...")
  request.session.flush()
  request.session.modified = True
  # Return JsonResponse containing true or false in body
  logger.info("Returning revoked status...")
  out = {}
  out['status'] = True
  return JsonResponse(out) 