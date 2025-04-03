from django.http import HttpResponse, HttpRequest
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from users.models import (
  User
)
from discordapi.models import (
  DiscordTokens
)

import requests
import datetime 
import os
import json
import logging

# Declare logging
logger = logging.getLogger('django')


def storeDiscordTokenInDatabase(request: HttpRequest, token_data: json):
  # Attempt to retreive user from session (discord_id should be the only stored session value)
  try:
    user = User.objects.get(discord_id = token_data['id'])
    logger.info(f"Storing discord token data in database for user {user.nickname}...")
    # Get user's discord data, if it doesnt exist, create an entry
    try:
      # Get token data for user
      tokenData = DiscordTokens.objects.get(user = user)
      # Update token data
      tokenData.access_token = (token_data['access_token'])
      tokenData.token_type = (token_data['token_type'])
      tokenData.expiry_date = (datetime.datetime.now() + datetime.timedelta(seconds=token_data['expires_in']))
      tokenData.refresh_token = (token_data['refresh_token'])
      tokenData.scope = (token_data['scope'])
    except ObjectDoesNotExist as e:
      logger.info(f"User does not yet have discord token data, creating...")
      # Create new token data
      tokenData = DiscordTokens(
        user = user,
        access_token = (token_data['access_token']),
        token_type = (token_data['token_type']),
        expiry_date = (datetime.datetime.now() + datetime.timedelta(seconds=token_data['expires_in'])),
        refresh_token = (token_data['refresh_token']),
        scope = (token_data['scope'])
      )
    # Save new or updated token data
    tokenData.save()
    return True
  except ObjectDoesNotExist as e:
    logger.error(f"Unable to find user for request session, {request}...")
    raise e
  

def isDiscordTokenExpired(request: HttpRequest):
  logger.info("Checking if discord token is expired...")
  # Get user from database
  user = User.objects.get(discord_id = request.session.get('discord_id'))
  tokenData = DiscordTokens.objects.get(user = user)
  # Get current time
  curTime = timezone.now()
  # Get session Expiry time
  tokenExpireTime = tokenData.expiry_date
  # Check if request session's discord token is out of date
  if(curTime > tokenExpireTime):
    logger.info("Token IS expired...")
    return True
  # Return false if not expired
  return False


def refreshDiscordToken(request: HttpRequest):
  logger.info("Refreshing Discord Token...")
  # Get token data
  tokenData = DiscordTokens.objects.get(user__discord_id = request.session.get("discord_id"))
  # Retrieve session data
  refreshToken = tokenData.refresh_token
  # Prep request data and headers to discord api
  reqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }
  reqData = {
     'grant_type': 'refresh_token',
     'refresh_token': refreshToken
   }
  # Make request to discord api
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    logger.error("Error in request:\n" + discordRes.reason)
    logger.info("More Info: \n" + json.dumps(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Store discord data in database
  storeDiscordTokenInDatabase(request, discordResJSON)
  # After updating session, check if user's profile picture needs to be updated
  refreshDiscordProfilePic(request)
  # Return True if Successful
  return True


def refreshDiscordProfilePic(request: HttpRequest):
  try:
    # Check if user profile photo is still accurate, if not update data
    user = User.objects.get(discord_id=request.session['discord_id'])
    # Get user token data from DB
    tokenData = DiscordTokens.objects.get(user = user)
  except Exception as e:
    return False
  # Call avatar url
  avatar_res = requests.get(user.get_avatar_url())
  # If 404, refresh avatar data
  if(avatar_res.status_code == 404):
    logger.info("Refreshing user's discord profile picture...")
    # Ensure user is logged in
    if(isDiscordTokenExpired(request)):
      refreshDiscordToken(request)
    # Prep request data and headers to discord api
    reqHeaders = { 
      'Authorization': f"{tokenData.token_type} {tokenData.access_token}"
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
    discordResJSON = discordRes.json()
    # Store avatar hash in user object
    user.discord_avatar = discordResJSON['avatar']
    # Update user
    user.save()


def checkPreviousAuthorization(request: HttpRequest):
  # Check if session is stored in data
  logger.info("Checking if sessionid exists...")
  try:
    # Get user instance and data
    user = User.objects.get(discord_id = request.session.get('discord_id'))
    tokenData = DiscordTokens.objects.get(user = user)
    refreshDiscordProfilePic(request)
    return True
  except Exception as e:
    if(isinstance(e, (User.DoesNotExist, DiscordTokens.DoesNotExist))):
      logger.debug(f"User not found, returning false.")
    else:
      logger.warning(f"Error when checking previous auth! WORTH INVESTIGATING!! Error: {e}")
    return False

