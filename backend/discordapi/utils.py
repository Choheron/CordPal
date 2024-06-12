from django.http import HttpRequest

import requests
import datetime 
import os
import json

def storeDiscordTokenInSession(request: HttpRequest, discordResponseJSON: json):
  # Store discord data in session data
  request.session["discord_access_token"] = discordResponseJSON['access_token']
  request.session["discord_token_type"] =discordResponseJSON['token_type']
  # Calculate Expiry time then store as string
  expiryTime = datetime.datetime.now() + datetime.timedelta(seconds=discordResponseJSON['expires_in'])
  request.session["discord_expiry_date"] = expiryTime.strftime("%d-%m-%Y %H:%M:%S")
  request.session["discord_refresh_token"] = discordResponseJSON['refresh_token']
  request.session["discord_scope"] = discordResponseJSON['scope']
  # Return True
  return True


def isDiscordTokenExpired(request: HttpRequest):
  # Get current time
  curTime = datetime.datetime.now()
  # Get session Expiry time
  tokenExpireTime = datetime.datetime.strptime(request.session['discord_expiry_date'], "%d-%m-%Y %H:%M:%S")
  # Check if request session's discord token is out of date
  if(curTime > tokenExpireTime):
    return True
  # Return false if not expired
  return False


def refreshDiscordToken(request: HttpRequest):
  # Retrieve session data
  refreshToken = request.session['discord_refresh_token']
  # Prep request data and headers to discord api
  reqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }
  reqData = {
     'grant_type': 'refresh_token',
     'refresh_token': refreshToken
   }
  # Make request to discord api
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    print("Error in request:\n" + discordRes.reason)
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Store discord data in session data
  storeDiscordTokenInSession(request, discordResJSON)
  # Return True if Successful
  return True