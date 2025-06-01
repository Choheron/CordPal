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
  spot_album_objects = SpotAlbum.objects.all().order_by('pk')
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  headers = {
    'User-Agent': 'CordPal/0.0.1 ( www.cordpal.app )'
  }
  for spot_album in spot_album_objects:
    print(f"Attempting to migrate {spot_album.title} by {spot_album.artist} ({index}/{len(spot_album_objects)})...")
    try:
      newAlbum = Album.objects.get(legacy_album=spot_album)
      spot_album.mbid = newAlbum.mbid.strip()
      spot_album.save()
      print(f"\tMigrated album for {spot_album.title} already found, skipping...")
      index += 1
      continue
    except Exception as e:
      print(f"\tMigrated album for {spot_album.title} not found...")
    # Sleep for 1 second no matter what, to avoid rate limiting (this is wasting time but I want to play it safe)
    time.sleep(1)
    try:
      if(spot_album.mbid):
        spot_album.mbid = spot_album.mbid.strip()
        spot_album.save()
        print(f"\tUnmigrated album mbid provided, searching using mbid...")
        # MBID provided but no matching album found post-migration, this lets us pull remasters and manually located mbids
        url = f"https://musicbrainz.org/ws/2/release/{spot_album.mbid}"
        params = {
          'inc': "artists+release-groups+recordings",
          'fmt': 'json'
        }
        response = requests.get(url, params=params, headers=headers)
        album_data = response.json()
        album_data['track_data'] = { 'tracks': album_data['media'][0]['tracks'] }
      else:
        # Build search URL
        url = f"https://musicbrainz.org/ws/2/release"
        params = {
          'query': f"release:\"{spot_album.title}\" AND artist:\"{spot_album.artist}\"",
          'fmt': 'json'
        }
        print(f"\tMaking request to musicbrainz search url for album {spot_album.title} by {spot_album.artist} ({index}/{len(spot_album_objects)})...")
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        try:
          album_data = None
          for result in data['releases']:
            if(result['release-group']['primary-type'] == 'Album'):
              album_data = result
              break
          if(album_data == None):
            raise Exception("Album not found in inital search...")
        except:
          # Sleep for 1 second no matter what, to avoid rate limiting (this is wasting time but I want to play it safe)
          time.sleep(1)
          print(f"\tDid not locate album based on artist and album title search, using just album title and only accepting various artists as artist...")
          url = f"https://musicbrainz.org/ws/2/release"
          params = {
            'query': f"release:\"{spot_album.title}\" AND artist:\"Various Artists\"",
            'fmt': 'json'
          }
          response = requests.get(url, params=params, headers=headers)
          data = response.json()
          album_data = data['releases'][0]
        # Sleep for 1 second no matter what, to avoid rate limiting (this is wasting time but I want to play it safe)
        time.sleep(1)
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
        disambiguation=album_data['disambiguation'] if ('disambiguation' in album_data.keys()) else "",
        submission_date=spot_album.submission_date,
        release_date=parseReleaseDate(album_data['date']),
        release_date_str=album_data['date'],
        raw_data=album_data,
        track_list={ 'tracks': album_data['track_data']['tracks'] },
        legacy_album=spot_album
      )
      # Save new album data
      newAotdAlbum.save()
      # Update reference on spot album
      spot_album.mbid = newAotdAlbum.mbid
      spot_album.save()
    except Exception as e:
      print(f"\tFAILED TO MIGRATE FOR: {spot_album.title}")
      print(f"\tERROR: {e}")
      failed_update.append((spot_album, e))
    # Increment Index
    index += 1

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print(f"{len(failed_update)} Failed Migration")
  print("| Failed Album | Spotify Album Django PK | ERROR |")
  print("| -------------------- | ------------------ | -------------------- |")
  entry: SpotAlbum
  for entry in failed_update:
    print(f"| {entry[0].title} | {entry[0].pk} | {entry[1]} |")