from django.http import HttpRequest, HttpResponse, JsonResponse

from .utils import (
  isDiscordTokenExpired, 
  refreshDiscordToken, 
  storeDiscordTokenInSession,
)

import datetime
import requests
from dotenv import load_dotenv
import os
import json

load_dotenv('.env')


def getDiscordToken(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "POST"):
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
  discordRes = requests.post(f"{os.getenv('DISCORD_API_ENDPOINT')}/oauth2/token", headers=reqHeaders, data=reqData, auth=(os.getenv('DISCORD_CLIENT_ID'), os.getenv('DISCORD_CLIENT_SECRET')))
  if(discordRes.status_code != 200):
    print("Error in request:\n" + str(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Store discord data in session data
  storeDiscordTokenInSession(request, discordResJSON)
  # Write success message
  messageOut = { 'message': "Success" }
  # Return Code
  return HttpResponse(content=messageOut, content_type='text/json', status=200)


def getDiscordUserData(request: HttpRequest):
  # Make sure request is a get request
  if(request.method != "GET"):
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Ensure user is logged in
  if(isDiscordTokenExpired(request)):
    refreshDiscordToken(request)
  # Prep request data and headers to discord api
  reqHeaders = { 
    'Authorization': f"{request.session['discord_token_type']} {request.session['discord_access_token']}"
  }
  print(reqHeaders)
  # Send Request to API
  discordRes = requests.get(f"{os.getenv('DISCORD_API_ENDPOINT')}/users/@me", headers=reqHeaders)
  if(discordRes.status_code != 200):
    print("Error in request:\n" + str(discordRes.json()))
    discordRes.raise_for_status()
  # Convert response to Json
  discordResJSON = discordRes.json()
  # Return JsonResponse containing user data
  return JsonResponse(discordResJSON)


def testSessionStart(request: HttpRequest):
  request.session.set_test_cookie()
  response = HttpResponse(status=200)
  response["Access-Control-Allow-Headers"]="true"
  return response


def testSessionEnd(request:HttpRequest):
  if(request.session.test_cookie_worked()):
    request.session.delete_test_cookie()
    return HttpResponse(status=200)
  else: 
    print("SESSION COOKIE DIDDNT WORK")
    return HttpResponse(status=500)