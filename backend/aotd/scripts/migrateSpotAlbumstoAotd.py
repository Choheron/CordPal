# This script is for a one time use to migrate album data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from spotifyapi.models import Album as SpotAlbum
from aotd.models import Album

import requests
import datetime
import time

def parseReleaseDate(date_str):
  if(len(date_str) > 7):
    return datetime.datetime.strptime(date_str, "%Y-%m-%d")
  elif(len(date_str) > 4): 
    return datetime.datetime.strptime(date_str, "%Y-%m")
  elif(len(date_str) > 0):
    return datetime.datetime.strptime(date_str, "%Y")
  else:
    return None


def run():
  failed_update = []
  # Retreive all Spotify Album objects
  spot_album_objects = SpotAlbum.objects.all()
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  for spot_album in spot_album_objects:
    try:
      # Build search URL
      url = f"https://musicbrainz.org/ws/2/release"
      params = {
        'query': f"release:\"{spot_album.title}\" AND artist:\"{spot_album.artist}\"",
        'fmt': 'json'
      }
      headers = {
        'User-Agent': 'CordPal/0.0.1 ( www.cordpal.app )'
      }
      print(f"Making request to musicbrainz search url for album {spot_album.title} by {spot_album.artist} ({index}/{len(spot_album_objects)})...")
      response = requests.get(url, params=params, headers=headers)
      data = response.json()
      try:
        album_data = data['releases'][0]
      except:
        print(f"Did not locate album based on artist and album title search, using just album title and only accepting various artists as artist...")
        url = f"https://musicbrainz.org/ws/2/release"
        params = {
          'query': f"release:\"{spot_album.title}\" AND artist:\"Various Artists\"",
          'fmt': 'json'
        }
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        album_data = data['releases'][0]
      # Check if an album with the same mbid already exists, if so, continue
      try:
        existingAlbum = Album.objects.get(mbid=album_data['id'])
        index += 1
        continue
      except:
        pass
      # Build Tracks Url
      url = f"https://musicbrainz.org/ws/2/release/{album_data['id']}"
      params = {
        'inc': 'recordings',
        'fmt': 'json'
      }
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
      newAotdAlbum = Album (
        mbid=album_data['id'],
        title=album_data['title'],
        artist=album_data['artist-credit'][0]['name'],
        artist_url=f"https://musicbrainz.org/artist/{album_data['artist-credit'][0]['artist']['id']}",
        cover_url=f"https://coverartarchive.org/release/{album_data['id']}/front",
        album_url=f"https://musicbrainz.org/release/{album_data['id']}",
        submitted_by=spot_album.submitted_by,
        user_comment=spot_album.user_comment,
        submission_date=spot_album.submission_date,
        release_date=parseReleaseDate(album_data['date']),
        release_date_str=album_data['date'],
        raw_data=album_data,
        track_list={ 'tracks': album_data['track_data']['tracks'] },
        legacy_album=spot_album
      )
      # Save new album data
      newAotdAlbum.save()
    except Exception as e:
      print(f"FAILED TO MIGRATE FOR: {spot_album.title}")
      print(f"ERROR: {e}")
      failed_update.append((spot_album, e))
    # Increment Index
    index += 1
    # Sleep for 1 second
    time.sleep(1)

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print("| Failed Album | Spotify Album Django PK | ERROR |")
  print("| -------------------- | ------------------ | -------------------- |")
  entry: SpotAlbum
  for entry in failed_update:
    print(f"| {entry[0].title} | {entry[0].pk} | {entry[1]} |")