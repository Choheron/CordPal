from django.http import HttpRequest, HttpResponse, JsonResponse

import logging
from dotenv import load_dotenv
import os
import json

# Declare logging
logger = logging.getLogger()

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")


DISCORD_BOT_DATA_FILEPATH = os.getenv('DISCORD_BOT_DATA_FILEPATH')

###
# Exchange discord auth code for discord api token (part of the login flow)
###
def getAllQuotes(request: HttpRequest):
  # Make sure request is a post request
  if(request.method != "GET"):
    logger.warning("getAllQuotes called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Read in json file of quotes
  quotes_file = open(f"{DISCORD_BOT_DATA_FILEPATH}/quotes.json", 'r')
  quotes = json.loads(quotes_file.read())
  quotes_file.close()
  # Return quote data for all users
  return HttpResponse(content=json.dumps(quotes), content_type='text/json', status=200)
