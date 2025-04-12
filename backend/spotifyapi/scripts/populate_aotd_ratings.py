# This script is only to be run once to populate the "rating" field added to Daily AOtD Objects
# Script is part of effort to optimize some processing times 
import pytz
from ..models import (
  DailyAlbum
)
from ..utils import *

def run():
  failed_update = []
  
  # Get all AOtD Objects
  all_aotd = DailyAlbum.objects.all()
  # Iterate and calculate aotd rating
  index = 0
  for aotd in all_aotd:
    print(f"Updating rating for: {aotd.album.title} ({index + 1}/{len(all_aotd)})")
    aotd.rating = getAlbumRating(aotd.album.spotify_id, False, aotd.dateToCalString())
    aotd.save()
    index += 1
  
  if(len(failed_update) == 0):
    print("Script completed with no failures!")
  else:
    print(f"WARNING: Script completed with {len(failed_update)} failures!")
    # Print out failed albums from update
    print("| Review ID/Date/Album | AOtD ID/Date/Album |")
    print("| -------------------- | ------------------ |")
    for entry in failed_update:
      print(f"| {entry['Review ID/Date/Album']} | {entry['AOtD ID/Date/Album']} |")