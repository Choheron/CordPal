from django.http import HttpRequest, JsonResponse, HttpResponse

import logging
import requests
from dotenv import load_dotenv
import os

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")
IS_PROD = True if APP_ENV=="PROD" else False

# Create your views here.
def getGifUrl(request: HttpRequest, gifId: str):
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
      logger.warning("Error in tenor request:\n" + str(tenorRes.json()), extra={'crid': request.crid})
      tenorRes.raise_for_status()
  except:
    return HttpResponse(status=500)
  # Check if results found
  results = tenorRes.json()['results']
  if(len(results) == 0):
    # If no results found, return a placeholder URL
    logger.warning(f"Tenor search resulted in no GIFs! Returning bad gif url...")
    # Provide placeholder URL
    tenorResGifObject = { "url": "https://placehold.co/400x200?text=GIF+NO+LONGER+AVAILABLE+ON+TENOR" }
  else:
    # Convert response to Json
    tenorResGifObject = results['results'][0]['media_formats']['gif']
  # Return JsonResponse containing user data
  return JsonResponse(tenorResGifObject)