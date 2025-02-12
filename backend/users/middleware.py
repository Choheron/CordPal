from django.http import HttpRequest

from users.models import (
  User
)

import logging
import datetime
import pytz

class LastSeenMiddleware:

  def __init__(self, get_response):
    self.get_response = get_response
    # Declare logging
    self.logger = logging.getLogger('django')

  def __call__(self, request: HttpRequest):
     # Get session data from request
    try:
      # Get user object 
      user = User.objects.all().get(discord_id=request.session['discord_id'])
      # Get current timestamp
      time = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
      # Update user last_request_timestamp
      user.last_request_timestamp = time
      self.logger.debug(f"Setting last_request_timestamp to {str(time)} for user {user.nickname}")
      user.save()
    except:
      self.logger.warning(f"Middleware called with no session cookie")
    
    # Code above this line is executed before the view is called
    # Retrieving the response 
    response = self.get_response(request)
    # Code after this line is executed after the view is called

    # Returning the response
    return response