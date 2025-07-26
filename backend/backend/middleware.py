from django.http import HttpRequest, JsonResponse
from django.utils import timezone

from users.models import (
  User
)

import logging
import json
import uuid

class metadataMiddleware:

  def __init__(self, get_response):
    self.get_response = get_response
    # Declare logging
    self.logger = logging.getLogger('django')

  def __call__(self, request: HttpRequest):

    # Generate a request ID and attach it to the headers on the incoming request
    crid = str(uuid.uuid4()) # CRID = Cordpal Request ID
    request.crid = crid
    
    # Code above this line is executed before the view is called
    # Retrieving the response 
    response = self.get_response(request)
    # Code after this line is executed after the view is called

    # If the response is a JsonResponse, attach or override the response metadata timestamp
    if isinstance(response, JsonResponse):
      data = json.loads(response.content)
      data['meta'] = { 
        'timestamp': timezone.now().strftime("%d/%m/%Y, %H:%M:%S"),
        'crid': request.crid
      }
      response.content = json.dumps(data)
    # Attach a header to show that this was not a cache hit
    response['X-Generated-At'] = timezone.now().strftime("%d/%m/%Y, %H:%M:%S") + " " + timezone.get_current_timezone_name()
    response["Access-Control-Expose-Headers"] = "X-Generated-At"
    # Attach header for CRID
    response['X-CRID'] = request.crid
    
    # Returning the response
    return response