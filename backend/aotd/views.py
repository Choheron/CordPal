from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict
from django.utils import timezone
import numpy

from spotifyapi.models import Album as SpotAlbum
from .models import Album


import logging
import requests
from dotenv import load_dotenv
import os
import json
import datetime
import pytz

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

## =========================================================================================================================================================================================
## ALBUM METHODS
## =========================================================================================================================================================================================

###
# Check if an album already exists in the database
###
def testAlbumData(request: HttpRequest, album_spotify_id: str):
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("checkIfAlbumAlreadyExists called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Convert response to Json
  logger.info(f"Attempting to migrate album with ID {album_spotify_id}...")
  # Declare out dict
  out = {}
  # Get album from database
  try:
    spotAlbumObject = SpotAlbum.objects.get(spotify_id = album_spotify_id)
    if(spotAlbumObject):
      logger.info(f"Album found in Spotify Database, name: {spotAlbumObject.title}!")
    # Build search URL
    url = f"https://musicbrainz.org/ws/2/release"
    params = {
      'query': f"release:\"{spotAlbumObject.title}\" AND artist:\"{spotAlbumObject.artist}\"",
      'fmt': 'json'
    }
    headers = {
      'User-Agent': 'CordPal/0.0.1 ( www.cordpal.app )'
    }
    logger.info(f"Making request to musicbrainz search url...")
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    album_data: dict = data['releases'][0]
    logger.info(f"Retrieved data with first result MBID of {album_data['id']}... Searching Tracks...")
    # Build Tracks Url
    url = f"https://musicbrainz.org/ws/2/release/{album_data['id']}"
    params = {
      'inc': 'recordings',
      'fmt': 'json'
    }
    headers = {
      'User-Agent': 'CordPal/0.0.1 ( www.cordpal.app )'
    }
    logger.info(f"Making request to musicbrainz tracks url...")
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    album_data['track_data'] = { 'tracks': data['media'][0]['tracks'], 'track_count': album_data['track-count'] }
    # Attempt to pull release date from tracks if not present in original data
    if('date' not in album_data.keys()):
      counts = {}
      currDate = ""
      for track in album_data['track_data']['tracks']:
        if(track['recording']['first-release-date'] in counts.keys()):
          counts[track['recording']['first-release-date']] += 1
        else:
          counts[track['recording']['first-release-date']] = 1
        # Track highest value
        if(currDate == "" or counts[track['recording']['first-release-date']] < counts[currDate]):
          currDate = track['recording']['first-release-date']
    album_data['date'] = currDate
    # Convert album data into what it would look like for a model object 
    out = {}
    out['mbid'] = album_data['id']
    out['title'] = album_data['title']
    out['artist'] = album_data['artist-credit'][0]['name']
    out['artist_url'] = f"https://musicbrainz.org/artist/{album_data['artist-credit'][0]['artist']['id']}"
    out['cover_url'] = f"https://coverartarchive.org/release/{album_data['id']}/front"
    out['submitted_by'] = spotAlbumObject.submitted_by.nickname
    out['user_comment'] = spotAlbumObject.user_comment
    out['submission_date'] = spotAlbumObject.submission_date
    out['release_date'] = (datetime.datetime.strptime(album_data['date'], "%Y-%m-%d")).strftime("%B %e %Y") if ('date' in album_data.keys()) else None
    out['release_date_str'] = album_data['date'] if ('date' in album_data.keys()) else "Unknown"
    out['raw_data'] = album_data
  except Exception as e:
    logger.error(f"FAILED: {e}")
  # Return Response
  return JsonResponse(out)