from django.http import HttpRequest, HttpResponseRedirect

from users.models import (
  User
)

import logging
import datetime
import pytz
import json
import os
import traceback

class LastSeenMiddleware:

  def __init__(self, get_response):
    self.get_response = get_response
    # Declare logging
    self.logger = logging.getLogger('django')
    self.heartbeat_endpoint_paths = ["/users/heartbeat", "/users/getAllOnlineData", "/discordapi/checkToken"]
    self.no_user_validation_paths = ["/metrics", "/discordapi/checkToken", "/discordapi/token", "/spotifyapi/setAlbumOfDay", "/users/traditionalLogin"]
    # Determine runtime enviornment
    self.APP_ENV = os.getenv('APP_ENV') or 'DEV'

  def __call__(self, request: HttpRequest):
    # Get Request Path
    full_path = request.get_full_path()
    # Get session data from request
    try:
      # Get user object 
      user = User.objects.get(discord_id=request.session['discord_id'])
      # Log method call (With username)
      self.logger.info(f"Incoming Request from user \"{user.nickname}\": {full_path}")
      # Get current timestamp
      time = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
      # Update only heartbeat timestamp if its a heartbeat call, otherwise update last_request_timestamp
      if(full_path in self.heartbeat_endpoint_paths):
        if(full_path == "/users/heartbeat"):
          # Update timezone if timezone is in request
          user.timezone_string = json.loads(request.body)['heartbeat']['timezone']
          self.logger.info(f"Setting timezone to {str(user.timezone_string)} for user {user.nickname}")
        user.last_heartbeat_timestamp = time
        self.logger.debug(f"Setting last_heartbeat_timestamp to {str(time)} for user {user.nickname}")
        user.save()
      else:
        user.last_heartbeat_timestamp = time # Also update heartbeat, why not
        user.last_request_timestamp = time
        self.logger.debug(f"Setting last_request_timestamp to {str(time)} for user {user.nickname}")
        user.save()
    except Exception as e:
      if(isinstance(e, User.DoesNotExist)):
        # Log method call (With username)
        self.logger.info(f"Incoming Request from user \"UNKNOWN\": {full_path}")
      elif(full_path.startswith("/aotd")):
        self.logger.info("AOTD TESTING")
      else:
        if(full_path == "/metrics"):
          self.logger.debug(f"Reporting metrics to prometheus")
        elif(full_path in self.no_user_validation_paths):
          self.logger.info(f"Incoming request to path {full_path} without a discord_id in request... Possibly a cron?")
        else:
          self.logger.error(f"ERROR IN USER MIDDLEWARE: PATH: {full_path} TRACEBACK: {traceback.print_exc()}")
    
    # Code above this line is executed before the view is called
    # Retrieving the response 
    response = self.get_response(request)
    # Code after this line is executed after the view is called

    # Returning the response
    return response