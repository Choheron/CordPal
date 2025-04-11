# Only to be run once as a MASSIVE batch execution, will populate every AOtD object's rating timeline
# In the future this should be completed when the next AOtD is selected.

from ..models import (
  DailyAlbum
)

from ..utils import (
  generateDayRatingTimeline
)

def run():
  failed_update = []
  # Retreive all AOTD objects
  aotd_list = DailyAlbum.objects.all()
  # Iterate all review objects
  index = 0
  for aotd in aotd_list:
    try:
      print(f"Attempting to populate timeline for AOTD {aotd.pk}: {aotd.album.title} ({index+1}/{len(aotd_list)})")
      generateDayRatingTimeline(aotd)
    except Exception as e:
      failed_update.append({"aotd": aotd.pk, "error": e})
    index += 1
  # Print out any failures
  print(f"\n\nFAILED:\n{failed_update}")
