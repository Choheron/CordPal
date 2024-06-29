from django.http import HttpRequest, HttpResponse, JsonResponse

from .utils import (
  isDiscordTokenExpired, 
  refreshDiscordToken, 
  storeDiscordTokenInSession,
  checkPreviousAuthorization,
)

import datetime
import logging
import requests
from dotenv import load_dotenv
import os
import json

# Declare logging
logger = logging.getLogger(__name__)
logging.basicConfig(encoding='utf-8', level=logging.DEBUG)

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


###
# Exchange discord auth code for discord api token (part of the login flow)
###
def getDiscordToken(request: HttpRequest):
  logger.debug("getDiscordToken called...")
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
  logger.debug("Making request to discord api...")
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    print("Error in request:\n" + str(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  logger.debug("Discord api returned, converting to json...")
  discordResJSON = discordRes.json()
  # Store discord data in session data
  storeDiscordTokenInSession(request, discordResJSON)
  # Write success message
  messageOut = { 'message': "Success" }
  # Return Code
  logger.debug("Returning HTTP 200 Response...")
  return HttpResponse(content=messageOut, content_type='text/json', status=200)


###
# Retrieve basic info about the user
###
def getDiscordUserData(request: HttpRequest):
  logger.debug("getDiscordUserData called...")
  logger.debug("Cookies in request: " + str(request.COOKIES))
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getDiscordUserData called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Ensure user is logged in
  logger.debug("Ensuring discord token is not expired...")
  if(isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Authorization': f"{request.session['discord_token_type']} {request.session['discord_access_token']}"
  }
  # Send Request to API
  logger.debug("Making request to discord api...")
  try:
    discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
    if(discordRes.status_code != 200):
      print("Error in request:\n" + str(discordRes.json()))
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Return JsonResponse containing user data
  return JsonResponse(discordResJSON)


###
# Validate that the user is a member of the discord server (TODO: Improve this flow, make it dynamic)
###
def validateServerMember(request: HttpRequest):
  logger.debug("validateServerMember called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("validateServerMember called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Ensure user is logged in
  logger.debug("Ensuring discord token is not expired...")
  if(isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Prep headers to discord api
  reqHeaders = { 
    'Authorization': f"{request.session['discord_token_type']} {request.session['discord_access_token']}"
  }
  # Send Request to API
  logger.debug("Making request to discord api...")
  try:
    discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me/guilds", headers=reqHeaders)
    if(discordRes.status_code != 200):
      print("Error in request:\n" + str(discordRes.json()))
      discordRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to List
  discordResList = discordRes.json()
  # Loop through servers and check if member of correct server
  logger.debug("Checking if user is in server...")
  member = False
  for server in discordResList:
    if(server['id'] == os.getenv('CORD_SERVER_ID')):
      logger.debug("User is in server!")
      member = True
      break
  # Return JsonResponse containing true or false in body
  logger.debug("Returning member status...")
  out = {}
  out['member'] = member
  return JsonResponse(out)


###
# Validate that the user is a member of the discord server (TODO: Improve this flow, make it dynamic)
###
def checkIfPrevAuth(request: HttpRequest):
  logger.debug("checkIfPrevAuth called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfPrevAuth called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Check if user sessionid token is valid
  logger.debug("Ensuring sessionid is valid...")
  # Set output var
  validSession = checkPreviousAuthorization(request)
  logger.debug(f"Previous Authorization Status: {validSession}")
  # Ensure user is logged in
  logger.debug("Ensuring discord token is not expired...")
  if(isDiscordTokenExpired(request) and validSession):
    refreshDiscordToken(request)
  # 
  # Return JsonResponse containing true or false in body
  logger.debug("Returning member status...")
  out = {}
  out['valid'] = validSession
  return JsonResponse(out)