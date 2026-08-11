# One-time script to refresh raw_data for all albums with a fresh pull from musicbrainz,
# using the same lookup submitAlbum uses so every album ends up with the full payload
# (artists+release-groups+recordings+genres), including any fields added since submission.
# Targets whichever DB the DJANGO_SETTINGS_MODULE env var points runscript at (dev vs prod).

import time

from ..models import Album
from ..utils import get_album_from_mb

def run():
  # Get all albums
  allAlbums = Album.objects.all().order_by('pk')
  # Track failed updates
  failed_albums = []
  # Iterate albums and refresh raw_data
  album: Album
  index = 1
  for album in allAlbums:
    print(f"Refreshing raw_data for album: {album.title} ({index}/{len(allAlbums)})...")
    # Retry a few times before giving up, musicbrainz intermittently rate-limits back-to-back requests
    attempt = 1
    last_error = None
    while attempt <= 3:
      try:
        freshAlbum = get_album_from_mb(album.mbid)
        album.raw_data = freshAlbum.raw_data
        album.save()
        last_error = None
        break
      except Exception as e:
        last_error = e
        print(f"\tAttempt {attempt}/3 failed for {album.title}, retrying...")
        attempt += 1
        time.sleep(3)
    if last_error:
      print(f"FAILED - Refreshing raw_data for album: {album.title}...")
      failed_albums.append((album, last_error))
    index += 1
    # Sleep to avoid hitting musicbrainz rate limiting
    time.sleep(1)

  print(f"Raw data refresh completed! Printing failed list of length {len(failed_albums)} now:")
  fail_data: tuple[Album, Exception]
  for fail_data in failed_albums:
    fail = fail_data[0]
    print(f"FAILED - {fail.title} - {fail.mbid} - {fail_data[1]}")
