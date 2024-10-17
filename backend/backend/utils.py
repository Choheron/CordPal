from django.http import HttpRequest

import requests
import os
import json
import logging

# Declare logging
logger = logging.getLogger('django')


##
# Send data contained in contentJson to webhook, makes the assumtion that the data is all content data.
# Reference for webhooks: 
#   https://gist.github.com/Birdie0/78ee79402a4301b1faf412ab5f1cdcf9 
# Example:
# {
#     "username": "Webhook",
#     "avatar_url": "https://i.imgur.com/4M34hi2.png",
#     "content": "Text message. Up to 2000 characters.",
#     "embeds": [
#         {
#         "title": "Title",
#         "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`"
#         }
#     ]
# }
##
def postToDiscordWebhook(contentJson: dict, mainMessage: str):
  # Build List of Embed Fields
  fields = []
  for elem in contentJson.keys():
    tempDict = {}
    tempDict['name'] = elem
    tempDict['value'] = str(contentJson[elem])
    fields.append(tempDict)
  # Format data correctly
  payload = {
    "content": mainMessage,
    "embeds": [{
      "fields": fields
    }]
  }
  print(json.dumps(payload))
  headers = {'Content-Type': 'application/json'}
  # Post request to discord webhook
  discordRes = requests.post(f"{os.getenv('DISCORD_WEBHOOK_URL')}", data=json.dumps(payload), headers=headers)
  # Check response
  if(discordRes.status_code != 200):
    logger.error(f"ERROR: Failed to post data to discord alert webhook\n\tResponse message:\n\t{discordRes.text}")