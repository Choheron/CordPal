# This script is for a one time use to migrate user data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist

from spotifyapi.models import SpotifyUserData
from aotd.models import AotdUserData


def run():
  failed_update = []
  # Retreive all Spotify Album objects
  spot_user_objects = SpotifyUserData.objects.all().order_by('pk')
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  for spot_user in spot_user_objects:
    print(f"Attempting to migrate {spot_user.user.nickname} ({index}/{len(spot_user_objects)})...")
    try:
      try:
        newUser = AotdUserData.objects.get(user=spot_user.user)
      except ObjectDoesNotExist:
        newUser = AotdUserData(
          user=spot_user.user,
          creation_timestamp=spot_user.creation_timestamp,
          selection_blocked_flag=spot_user.selection_blocked_flag
        )
        newUser.save()
    except Exception as e:
      print(f"\tFAILED TO MIGRATE FOR: {spot_user.user.nickname}")
      print(f"\tERROR: {e}")
      failed_update.append((spot_user, e))
    # Increment Index
    index += 1

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print(f"{len(failed_update)} Failed Migration")
  print("| Failed Album | Spotify Album Django PK | ERROR |")
  print("| -------------------- | ------------------ | -------------------- |")
  entry: SpotifyUserData
  for entry in failed_update:
    print(f"| {entry[0].user.nickname} | {entry[0].pk} | {entry[1]} |")