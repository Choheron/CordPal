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
logger = logging.getLogger()

# Avatar validity is checked against Discord's CDN on every auth request; skip
# the HTTP round-trip if we already confirmed it recently.
AVATAR_CHECK_INTERVAL = datetime.timedelta(hours=24)


def storeDiscordTokenInDatabase(request: HttpRequest, token_data: json):
  # Attempt to retreive user from session (discord_id should be the only stored session value)
  try:
    user = User.objects.get(discord_id = token_data['id'])
    logger.info(f"Storing discord token data in database for user {user.nickname}...", extra={'crid': request.crid})
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
      logger.info(f"User does not yet have discord token data, creating...", extra={'crid': request.crid})
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
    logger.error(f"Unable to find user for request session, {request}...", extra={'crid': request.crid})
    raise e


def isDiscordTokenExpired(request: HttpRequest, token: DiscordTokens = None):
  logger.info("Checking if discord token is expired...", extra={'crid': request.crid})
  # Accept a pre-fetched token so callers that already queried DiscordTokens
  # (e.g. checkIfPrevAuth) don't trigger two more DB round-trips here.
  if token is None:
    user = User.objects.get(discord_id = request.session.get('discord_id'))
    token = DiscordTokens.objects.get(user = user)
  tokenExpireTime = token.expiry_date
  if((tokenExpireTime is not None) and (timezone.now() > tokenExpireTime)):
    logger.info("Token IS expired...", extra={'crid': request.crid})
    return True
  return False


def refreshDiscordToken(request: HttpRequest, discord_user_id: str = ""):
  logger.info("Refreshing Discord Token...", extra={'crid': request.crid})
  userDiscordId = discord_user_id if (discord_user_id != "") else request.session.get("discord_id")
  # Get token data
  tokenData = DiscordTokens.objects.get(user__discord_id = userDiscordId)
  # Retrieve session data
  refreshToken = tokenData.refresh_token
  # Prep request data and headers to discord api
  reqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }
  reqData = {
     'grant_type': 'refresh_token',
     'refresh_token': refreshToken,
     'client_id': os.getenv('DISCORD_CLIENT_ID'),
     'client_secret': os.getenv('DISCORD_CLIENT_SECRET')
   }
  # Make request to discord api
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    logger.error("Error in request: " + discordRes.reason, extra={'crid': request.crid})
    logger.info("More Info: " + json.dumps(discordRes.json()), extra={'crid': request.crid})
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  discordResJSON['id'] = userDiscordId
  # Store discord data in database
  storeDiscordTokenInDatabase(request, discordResJSON)
  # After updating session, check if user's profile picture needs to be updated
  refreshDiscordProfilePic(request)
  # Return True if Successful
  return True


def refreshDiscordProfilePic(request: HttpRequest, user=None, tokenData=None):
  try:
    # Accept pre-fetched objects so callers that already queried these (e.g.
    # checkPreviousAuthorization) don't cause redundant DB round-trips.
    if user is None:
      user = User.objects.get(discord_id=request.session['discord_id'])
    if tokenData is None:
      tokenData = DiscordTokens.objects.get(user=user)
  except Exception as e:
    return False

  # This runs on every auth check — without this guard it makes a CDN HTTP
  # request on every page load. Only verify the avatar URL once per day.
  if user.last_avatar_check and (timezone.now() - user.last_avatar_check) < AVATAR_CHECK_INTERVAL:
    return

  avatar_res = requests.get(user.get_avatar_url())
  if(avatar_res.status_code == 404):
    logger.info("Refreshing user's discord profile picture...", extra={'crid': request.crid})
    if(isDiscordTokenExpired(request, token=tokenData)):
      refreshDiscordToken(request)
      # tokenData is stale after a refresh — re-fetch before using the access token
      tokenData = DiscordTokens.objects.get(user=user)
    reqHeaders = {
      'Authorization': f"{tokenData.token_type} {tokenData.access_token}"
    }
    logger.info("Making request to discord api...", extra={'crid': request.crid})
    try:
      discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
      if(discordRes.status_code != 200):
        logger.warning("Error in request:\n" + str(discordRes.json()), extra={'crid': request.crid})
        discordRes.raise_for_status()
    except:
      return HttpResponse(status=500)
    discordResJSON = discordRes.json()
    user.discord_avatar = discordResJSON['avatar']
    user.last_avatar_check = timezone.now()
    user.save()
  else:
    # Avatar still valid — only stamp the check time, avoid bumping last_updated_timestamp
    User.objects.filter(pk=user.pk).update(last_avatar_check=timezone.now())


def checkPreviousAuthorization(request: HttpRequest):
  # Check if session is stored in data
  logger.info("Checking if sessionid exists...", extra={'crid': request.crid})
  try:
    # Get user instance and data
    user = User.objects.get(discord_id = request.session.get('discord_id'))
    tokenData = DiscordTokens.objects.get(user = user)
    # Pass already-fetched objects to avoid re-querying inside refreshDiscordProfilePic
    refreshDiscordProfilePic(request, user=user, tokenData=tokenData)
    return True
  except Exception as e:
    if(isinstance(e, (User.DoesNotExist, DiscordTokens.DoesNotExist))):
      logger.debug(f"User not found, returning false.", extra={'crid': request.crid})
    else:
      logger.warning(f"Error when checking previous auth! WORTH INVESTIGATING!! Error: {e}", extra={'crid': request.crid})
    return False

