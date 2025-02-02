from django.http import HttpRequest, JsonResponse, HttpResponse

import logging
import requests
from dotenv import load_dotenv
import os

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

# Create your views here.
def getGifUrl(request: HttpRequest, gifId: str):
  logger.info("getGifUrl called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getGifUrl called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Make request to tenor backend
  try:
    callUrl = f"https://tenor.googleapis.com/v2/posts?ids={gifId}&key={os.getenv('TENOR_API_KEY')}&client_key={os.getenv('TENOR_CLIENT_KEY')}&media_filter=gif"
    tenorRes = requests.get(callUrl)
    if(tenorRes.status_code != 200):
      print("Error in request:\n" + str(tenorRes.json()))
      tenorRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Convert response to Json
  tenorResGifObject = tenorRes.json()['results'][0]['media_formats']['gif']
  # Return JsonResponse containing user data
  return JsonResponse(tenorResGifObject)