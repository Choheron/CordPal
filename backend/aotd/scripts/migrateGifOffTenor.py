# Script for migrating off of Tenor API due to Google foolishly deprecating it. API will stop working on June 20th of 2026
# This script will iterate all reviews and review histories, use a regex to find tenor links that are not source URLs, query the correct source URL, and then replace the review text with that image.
# Subsequent to this, the tenor API integration will be deleted/sunset to avoid this issue.

import re
import os
import requests
import time
from dotenv import load_dotenv

from ..models import Review, ReviewHistory

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")
IS_PROD = True if APP_ENV=="PROD" else False

# Declare a gif dict cache to reduce Tenor calls
gif_cache = {}

def run():
  print(f"Iterating all Reviews and Review Histories...")
  # Get all reviews and revie histories
  all_reviews = Review.objects.all()
  all_histories = ReviewHistory.objects.all()
  # Declare regex to find tenor gif URL
  tenorRegex = "(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-(\d+)"
  # Alert Admin
  print(f"There are {len(all_reviews)} Reviews and {len(all_histories)} Review Histories...")
  # Track Replacements
  review_replacements = 0
  review_history_replacements = 0
  #
  # Iterate Reviews and do Replacements
  #
  print("Iterating Reviews...")
  for review in all_reviews:
    print(f"Checking Review with PK: {review.pk} - Advanced Review: {'TRUE' if review.advanced else 'FALSE'}")
    reveiw_search = re.findall(tenorRegex, review.review_text)
    if(len(reveiw_search) > 0):
      print(f"{len(reveiw_search)} Gif IDs in Main Text Found!")
      # Iterate GIF Ids and get the gif URL from tenor via the API
      for id in reveiw_search:
        gifQuery = _queryGif(id)
        if(gifQuery[0]):
          # Declare new tenor gif regex and replace gif text with new image tag text
          gifRegex = f"(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-{id}"
          review.review_text = re.sub(
            gifRegex, 
            f'<img src="{gifQuery[1]}"/>',
            review.review_text
          )
          review_replacements += 1
        else:
          print("ERROR QUERYING GIF, SKIPPING")
    # If review is advanced, iterate all fields and do replacements
    if(review.advanced):
      print(f"Review with PK: {review.pk} is an Advanced Review, checking all song entries in advanced review...")
      advanced_dict: dict = review.advancedReviewDict
      for song_name in advanced_dict.keys():
        song = advanced_dict[song_name]
        comment_text = song['cordpal_comment']
        comment_search = re.findall(tenorRegex, comment_text)
        if(len(comment_search) > 0):
          print(f"{len(comment_search)} Gif IDs in \"{song['title']}\" Review Text Found!")
          # Iterate GIF Ids and get the gif URL from tenor via the API
          for id in comment_search:
            gifQuery = _queryGif(id)
            if(gifQuery[0]):
              # Declare new tenor gif regex and replace gif text with new image tag text
              gifRegex = f"(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-{id}"
              comment_text = re.sub(
                gifRegex, 
                f'<img src="{gifQuery[1]}"/>',
                comment_text
              )
              review_replacements += 1
            else:
              print("ERROR QUERYING GIF, SKIPPING")
          advanced_dict[song_name]['cordpal_comment'] = comment_text
      review.advancedReviewDict = advanced_dict
    # Call update on only the advanced dict field and the review_text field, to avoid changing timestamps 
    update_review_fields = ["review_text", "advancedReviewDict"] if review.advanced else ["review_text"]
    review.save(silent_update=True, update_fields=update_review_fields)
  #
  # Iterate Review Histories and do Replacements
  #
  review = None
  print("Iterating Review Histories...")
  for history in all_histories:
    print(f"Checking Review History with PK: {history.pk} - Advanced Review: {'TRUE' if history.advanced else 'FALSE'}")
    reveiw_search = re.findall(tenorRegex, history.review_text)
    if(len(reveiw_search) > 0):
      print(f"{len(reveiw_search)} Gif IDs in Main Text Found!")
      # Iterate GIF Ids and get the gif URL from tenor via the API
      for id in reveiw_search:
        gifQuery = _queryGif(id)
        if(gifQuery[0]):
          # Declare new tenor gif regex and replace gif text with new image tag text
          gifRegex = f"(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-{id}"
          history.review_text = re.sub(
            gifRegex, 
            f'<img src="{gifQuery[1]}"/>',
            history.review_text
          )
          review_history_replacements += 1
        else:
          print("ERROR QUERYING GIF, SKIPPING")
    # If review is advanced, iterate all fields and do replacements
    if(history.advanced):
      print(f"Review with PK: {history.pk} is an Advanced Review, checking all song entries in advanced review...")
      advanced_dict = history.advancedReviewDict
      for song_name in advanced_dict.keys():
        song = advanced_dict[song_name]
        comment_text = song['cordpal_comment']
        comment_search = re.findall(tenorRegex, comment_text)
        if(len(comment_search) > 0):
          print(f"{len(comment_search)} Gif IDs in \"{song['title']}\" Review Text Found!")
          # Iterate GIF Ids and get the gif URL from tenor via the API
          for id in comment_search:
            gifQuery = _queryGif(id)
            if(gifQuery[0]):
              # Declare new tenor gif regex and replace gif text with new image tag text
              gifRegex = f"(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-{id}"
              comment_text = re.sub(
                gifRegex, 
                f'<img src="{gifQuery[1]}"/>',
                comment_text
              )
              review_replacements += 1
            else:
              print("ERROR QUERYING GIF, SKIPPING")
          advanced_dict[song_name]['cordpal_comment'] = comment_text
      history.advancedReviewDict = advanced_dict
    # Call update on only the advanced dict field and the review_text field, to avoid changing timestamps 
    update_review_fields = ["review_text", "advancedReviewDict"] if history.advanced else ["review_text"]
    history.save()
  print("\nReplacements Completed!")
  print(f"Made {review_replacements} Total Review gif replacements!")
  print(f"Made {review_history_replacements} Total Review History gif replacements!")


def _queryGif(gifID):
  print(f"Querying Tenor for Gif with ID {gifID}...")
  if(gifID in gif_cache.keys()):
    print("Cached gif located, skipping query...")
    return gif_cache[gifID]
  # Make request to tenor backend
  try:
    request_code = 429
    while(request_code == 429):
      callUrl = f"https://tenor.googleapis.com/v2/posts?ids={gifID}&key={os.getenv('TENOR_API_KEY')}&client_key={os.getenv('TENOR_CLIENT_KEY')}&media_filter=gif"
      tenorRes = requests.get(callUrl)
      request_code = tenorRes.status_code
      if(request_code == 429):
        print("-- RATE LIMIT HIT, SLEEPING FOR 1 SECOND...")
        time.sleep(1)
    if(request_code != 200):
      print("Error in tenor request:\n" + str(tenorRes.json()))
      tenorRes.raise_for_status()
  except Exception as e:
    print(f"\tERROR IN RESPONSE: {e}")
    return (False, "https://placehold.co/400x200?text=GIF+NO+LONGER+AVAILABLE+ON+TENOR")
  # Check if results found
  results = tenorRes.json()['results']
  if(len(results) == 0):
    # If no results found, return a placeholder URL
    print(f"\tTenor search resulted in no GIFs! Returning bad gif url...")
    # Provide placeholder URL
    tenorResGifObject = { "url": "https://placehold.co/400x200?text=GIF+NO+LONGER+AVAILABLE+ON+TENOR" }
  else:
    # Convert response to Json
    tenorResGifObject = results[0]['media_formats']['gif']
  # Return gif link and True response
  return (True, tenorResGifObject['url'])