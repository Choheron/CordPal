from django.http import HttpRequest, HttpResponse, JsonResponse
from django.forms.models import model_to_dict
from django.utils import timezone

import logging
from dotenv import load_dotenv
import os
import json

from users.models import User
from .models import FunctionalityRequest

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

def createFunctionalityRequest(request: HttpRequest):
  """Create a functionality request"""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("createFunctionalityRequest called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get request body and get user from database
  try:
    user = User.objects.get(request.session.get('discord_id'))
    reqBody = json.loads(request.body)
  except Exception as e:
    logger.error("Failed to retrieve user from databse or parse request body from request.")
    logger.debug(f"Error Stack: {e}")
    return HttpResponse("/", code=302)
  # Create new Functionality Request
  try:
    funcRequest = FunctionalityRequest(
      title=reqBody['title'],
      description=reqBody['description'],
      user=user
    )
    funcRequest.save()
  except Exception as e:
    logger.error(f"Failed to create a functionality request for user {user.nickname}.")
    logger.debug(f"Error Stack: {e}")
    return HttpResponse("Failed to create Functionality Request, error code 500.", code=500)
  # Return a successful status code with the publicID of the created request (allowing for redirect on frontend)
  out = {}
  out['public_id'] = funcRequest.public_id
  out['message'] = f"Successfully created Functionality Request \"{funcRequest.title}\", Request ID: {funcRequest.public_id}"
  return JsonResponse(out, code=200)


def getFRbyID(request: HttpRequest, public_id: str):
  """Return a functionality request object based on the passed in public_id for the request"""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getFunctionalityRequest called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve funcreq object from databse
  try:
    funcRequest = FunctionalityRequest.objects.get(public_id=public_id)
  except FunctionalityRequest.DoesNotExist as e:
    logger.error(f"Unable to find Functionality Request with public ID: {public_id}")
    return HttpResponse(f"Unable to find functionality request with public id: {public_id}", code=404)
  # Return func request object
  out = {}
  out['request'] = model_to_dict(funcRequest)
  return JsonResponse(out)


def getAllFR(request: HttpRequest):
  """Return a functionality request object based on the passed in public_id for the request"""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("getFunctionalityRequest called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve all functionality requests from database
  funcRequests = FunctionalityRequest.objects.all()
  # Convert all requests in list format
  allReqs = []
  for req in funcRequests:
    allReqs.append(model_to_dict(req))
  # TODO: Sort functionality requests by votes and then status when requests have been completed
  out = {}
  out['requests'] = allReqs
  return JsonResponse(out)