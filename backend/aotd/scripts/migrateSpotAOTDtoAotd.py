# This script is for a one time use to migrate AOTD data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist

from spotifyapi.models import DailyAlbum as SpotDailyAlbum
from aotd.models import DailyAlbum, Album


def run():
  failed_update = []
  # Retreive all Spotify Album objects
  spot_aotd_objects = SpotDailyAlbum.objects.all().order_by('date')
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  for spot_aotd in spot_aotd_objects:
    print(f"Attempting to migrate AOTD for date: {spot_aotd.date} ({index}/{len(spot_aotd_objects)})...")
    try:
      # Get new version of album
      newAlbum = Album.objects.get(mbid=spot_aotd.album.mbid)
      try:
        newAotd = DailyAlbum.objects.get(date=spot_aotd.date)
      except ObjectDoesNotExist:
        newAotd = DailyAlbum(
          album=newAlbum,
          date=spot_aotd.date,
          manual=spot_aotd.manual,
          rating_timeline=spot_aotd.rating_timeline,
          rating = spot_aotd.rating
        )
        newAotd.save()
    except Exception as e:
      print(f"\tFAILED TO MIGRATE FOR: {spot_aotd.date}")
      print(f"\tERROR: {e}")
      failed_update.append((spot_aotd, e))
    # Increment Index
    index += 1

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print(f"{len(failed_update)} Failed Migration")
  print("| Failed Date | Django PK | ERROR |")
  print("| -------------------- | ------------------ | -------------------- |")
  entry: SpotDailyAlbum
  for entry in failed_update:
    print(f"| {entry[0].date} | {entry[0].pk} | {entry[1]} |")