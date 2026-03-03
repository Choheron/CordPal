# This script for repeated use to force a recaclulation of all AOTD standard deviaions and all user review STDs

from ..models import DailyAlbum, AotdUserData
from ..utils import retrieveAlbumSTD, calculateUserReviewData

def run():
  print(f"Calculating standard deviation for all AOTD Objects")
  # Get all aotd objects
  all_aotd = DailyAlbum.objects.all()
  # Iterate and calculate
  for aotd in all_aotd:
    try:
      print(f"Calculating standard deviation for {aotd.album.title} - {aotd.album.mbid}")
      retrieveAlbumSTD(aotd.album.mbid, aotd.date, True)
    except:
      print(f"ERROR Calculating standard deviation for {aotd.album.title} - {aotd.album.mbid}")
  print(f"Calculating all user stats for all AotD Users")
  # Get all aotd objects
  all_users = AotdUserData.objects.all()
  # Iterate and calculate
  for user in all_users:
    try:
      print(f"Calculating AotD stats for {user.user.nickname}")
      calculateUserReviewData(user)
    except:
      print(f"ERROR Calculating AotD stats for {user.user.nickname}")
  