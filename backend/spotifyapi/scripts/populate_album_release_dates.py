# This script is for a one time use to populate the release date of albums for the 2025-03-21 update to track album release dates more directly
from django.forms.models import model_to_dict
from datetime import datetime
import json

from ..models import (
  Album,
)

def run():
  failed_update = []
  # Retreive all Album objects
  album_objects = Album.objects.all()
  # Iterate album objects and create a user action for uploading of the album with the submission timestamp
  for album in album_objects:
    try:
      # Get release date and release date precision from raw data
      raw_data = album.raw_data['album']
      raw_release_date = raw_data['release_date']
      raw_release_date_precision = raw_data['release_date_precision']
      # Store in album object
      album.release_date_precision = raw_release_date_precision
      # Parse date from release date based on precision
      if(raw_release_date_precision == "year"):
        album.release_date = datetime.strptime(raw_release_date, "%Y")
      elif(raw_release_date_precision == "month"):
        album.release_date = datetime.strptime(raw_release_date, "%Y-%m")
      elif(raw_release_date_precision == "day"):
        album.release_date = datetime.strptime(raw_release_date, "%Y-%m-%d")
      else:
        album.release_date = None
      # Save updated Album
      album.save()
    except Exception as e:
      print(f"FAILED TO POPULATE FOR: {album.title}\nRAW DATA:\n\t{album.raw_data['album']}")
      print(f"ERROR: {e}")
      failed_update.append(album)

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print("| Failed Album | Django PK |")
  print("| -------------------- | ------------------ |")
  entry: Album
  for entry in failed_update:
    print(f"| {entry.title} | {entry.pk} |")