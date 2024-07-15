from django.http import HttpRequest

import requests
import datetime 
import os
import json
import logging

# Declare logging
logger = logging.getLogger(__name__)

def storeDiscordTokenInSession(request: HttpRequest, discordResponseJSON: json):
  logger.debug("Attempting to store discord token data in session object...")
  # Store discord data in session data
  request.session["discord_access_token"] = discordResponseJSON['access_token']
  request.session["discord_token_type"] = discordResponseJSON['token_type']
  # Calculate Expiry time then store as string
  expiryTime = datetime.datetime.now() + datetime.timedelta(seconds=discordResponseJSON['expires_in'])
  request.session["discord_expiry_date"] = expiryTime.strftime("%d-%m-%Y %H:%M:%S")
  request.session["discord_refresh_token"] = discordResponseJSON['refresh_token']
  request.session["discord_scope"] = discordResponseJSON['scope']
  logger.info("Discord token data stored in session object!")
  # Return True
  return True


def isDiscordTokenExpired(request: HttpRequest):
  logger.debug("Checking if discord token is expired...")
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
    logger.error("Error in request:\n" + discordRes.reason)
    logger.debug("More Info: \n" + json.dumps(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Store discord data in session data
  storeDiscordTokenInSession(request, discordResJSON)
  # Return True if Successful
  return True


def checkPreviousAuthorization(request: HttpRequest):
  # Check if session is stored in data
  logger.debug("Checking if sessionid exists...")
  return 'discord_access_token' in request.session

##
# Send data contained in contentJson to webhook, makes the assumtion that the data is all content data.
# Reference for webhooks: 
#   https://gist.github.com/Birdie0/78ee79402a4301b1faf412ab5f1cdcf9 
# Example:
# {
#     "username": "Webhook",
#     "avatar_url": "https://i.imgur.com/4M34hi2.png",
#     "content": "Text message. Up to 2000 characters.",
#     "embeds": [
#         {
#         "title": "Title",
#         "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`"
#         }
#     ]
# }
##
def postToDiscordWebhook(contentJson: dict, mainMessage: str):
  # Build List of Embed Fields
  fields = []
  for elem in contentJson.keys():
    tempDict = {}
    tempDict['name'] = elem
    tempDict['value'] = str(contentJson[elem])
    fields.append(tempDict)
  # Format data correctly
  payload = {
    "content": mainMessage,
    "embeds": [{
      "fields": fields
    }]
  }
  print(json.dumps(payload))
  headers = {'Content-Type': 'application/json'}
  # Post request to discord webhook
  discordRes = requests.post(f"{os.getenv('DISCORD_WEBHOOK_URL')}", data=json.dumps(payload), headers=headers)
  # Check response
  if(discordRes.status_code != 200):
    logger.error(f"ERROR: Failed to post data to discord alert webhook\n\tResponse message:\n\t{discordRes.text}")