from django.http import HttpRequest, HttpResponse, JsonResponse

from .models import Quote
from users.models import User
import users.utils as userUtils

import logging
import json
import datetime
import pytz

logger = logging.getLogger(__name__)

def submitQuote(request: HttpRequest):
  """Submit a quote to the backend for recording"""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning(f"submitQuote called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Load in Request Body
  reqBody: dict = json.loads(request.body)
  # Parse all required quote data from request
  try:
    submitterId = reqBody['submitter_data']['id']
    submitterNickname = reqBody['submitter_data']['nickname']
    speakerId = reqBody['speaker_data']['id']
    if(reqBody['quote_text']):
      text = reqBody['quote_text']
    else:
      raise Exception("Quote text is missing.")
    timestamp = reqBody['timestamp'] if ("timestamp" in reqBody.keys()) else datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
  except Exception as e:
    logger.error("Request body malformed", extra={'crid': request.crid, "error_msg": repr(e)})
    return HttpResponse("Malformed Request Body.", status_code=400)
  # Attempt to retrieve user data for submitter and speaker
  submitterObj: User = userUtils.getUserObj(submitterId)
  speakerObj: User = userUtils.getUserObj(speakerId)
  # Log if either are not found
  if(submitterObj == None):
    logger.warning(f"User with submitter id of {submitterId} NOT FOUND.", extra={'crid': request.crid})
  if(speakerObj == None):
    logger.warning(f"User with speaker id of {speakerId} NOT FOUND.", extra={'crid': request.crid})
  # Create the quote object
  try:
    newQuote = Quote(
      submitter=submitterObj,
      submitter_nickname=submitterNickname,
      submitter_discord_id=(submitterId if (submitterObj==None) else None),
      speaker=speakerObj,
      speaker_discord_id=(speakerId if (speakerObj==None) else None),
      text=text,
      timestamp=timestamp
    )
    newQuote.save()
  except:
    failExtra = {
      'crid': request.crid,
      'submitter_obj': submitterObj.toJSON() if submitterObj else "NONE",
      'submitter_id': submitterId,
      'submitter_nickname': submitterNickname,
      'speaker_obj': speakerObj.toJSON() if speakerObj else "NONE",
      'speaker_id': speakerId,
      'text': text
    }
    logger.error("FAILED to create quote object, see extras for quote object information.", extra=failExtra)
    return HttpResponse(f"Failed to create quote object, see system logs for details. CRID: {request.crid}", status_code=500)
  # If no fails return 200
  return HttpResponse(status_code=200)


def getUserSpokenQuotes(request: HttpRequest, user_discord_id: str):
  """Request all spoken quotes from a user, returns a JSON containing a list."""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning(f"getUserQuotes called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve user object from ID if possible
  userObj = userUtils.getUserObj(user_discord_id)
  # Query all quotes 
  if(userObj != None):
    quotes = Quote.objects.filter(speaker=userObj)
  else:
    quotes = Quote.objects.filter(speaker_id=int(user_discord_id))
  # Iterate all quotes and create out list
  out = []
  for quote in quotes:
    out.append(quote.toJSON())
  # Return object
  return JsonResponse({'quotes': out})


def getAllQuotesList(request: HttpRequest):
  '''Return all quotes currently stored in the database, in list format'''
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning(f"getAllQuotesList called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all quotes, convert to list, and return
  quotes = Quote.objects.all()
  out = []
  for quote in quotes:
    out.append(quote.toJSON())
  # Return
  return JsonResponse({'quotes': out})


def getAllQuotesLegacy(request: HttpRequest):
  '''Get all quotes in the legacy format'''
   # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning(f"getAllQuotesLegacy called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all Quotes
  quotes = Quote.objects.all()
  # Format quotes list into a dict based on submitter key
  logger.info("Iterating all quotes in DB and attempting to return legacy dict")
  quoteDict = {}
  for quote in quotes:
      speaker_id = quote.speaker.discord_id if quote.speaker else quote.speaker_discord_id
      if(speaker_id in quoteDict.keys()):
          quoteDict[speaker_id]['quoteList'].append(quote.toJSON())
      else:
          quoteDict[speaker_id] = {
              "nickname": quote.speaker.nickname if quote.speaker else quote.speaker_discord_id,
              "quoteList": [quote.toJSON()]
          }
  # Return json
  return JsonResponse(quoteDict)


def getQuoteStats(request: HttpRequest):
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning(f"getQuoteStats called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all Quotes
  return HttpResponse("NOT YET IMPLEMENTED", status_code=500)