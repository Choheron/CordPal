import logging
from dotenv import load_dotenv 
import json
import os
import datetime

# Declare logging
logger = logging.getLogger()

# Import type
from users.models import User
from quotes.models import Quote
import users.utils as userUtils

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

# Determine quotes Filepath
if(APP_ENV=="PROD"):
  quotes_filepath = ""
else:
  quotes_filepath = "./botData/cordBot/quotes.json"

logExtra = {
  'APP_ENV': APP_ENV,
  'script': "migrateQuotesFromFile",
  'quotes_filepath': quotes_filepath
}

def run():
  logger.info("INITIATING MANUAL MIGRATION SCRIPT EXECUTION", extra=logExtra)
  logger.info("Attempting to read quotes file...", extra=logExtra)
  with open(quotes_filepath, "r") as file:
    quotes: dict = json.load(file)
  for userId in quotes.keys():
    userObj = quotes[userId]
    userNickname = userObj['nickname']
    for quote in userObj['quoteList']:
      submitterData = quote['addedBy'].split("/")
      # Iterate quotes and add them to the database
      submitterId = submitterData[1]
      submitterNickname = submitterData[0]
      text = quote['text']
      timestamp = datetime.datetime.strptime(quote['timestamp'],"%m/%d/%Y, %H:%M:%S")
      # Attempt to retrieve user data for submitter and speaker
      submitterObj: User = userUtils.getUserObj(submitterId)
      speakerObj: User = userUtils.getUserObj(userId)
      # Log if either are not found
      if(submitterObj == None):
        logger.warning(f"User with submitter id of {submitterId} NOT FOUND.", extra=logExtra)
      if(speakerObj == None):
        logger.warning(f"User with speaker id of {userId} NOT FOUND.", extra=logExtra)
      # Create the quote object
      try:
        newQuote = Quote(
          submitter=submitterObj,
          submitter_nickname=submitterNickname,
          submitter_discord_id=(submitterId if (submitterObj==None) else None),
          speaker=speakerObj,
          speaker_discord_id=(userId if (speakerObj==None) else None),
          text=text,
          timestamp=timestamp
        )
        newQuote.save()
      except Exception as e:
        failExtra = {
          'submitter_obj': submitterObj.toJSON() if submitterObj else "NONE",
          'submitter_id': submitterId,
          'submitter_nickname': submitterNickname,
          'speaker_obj': speakerObj.toJSON() if speakerObj else "NONE",
          'speaker_id': userId,
          'text': text
        }
        if(APP_ENV == "DEV"):
          print(e)
        else:
          logger.error(f"FAILED to create quote object, see extras for quote object information.", extra=(logExtra | failExtra | {"error_msg": e}))
  exit(0)