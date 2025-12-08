# This script is for a one time use to update previously entered track data for all albums in the website, to support multiple track groupings from MB - December 2025

from ..models import Album
from ..utils import get_album_from_mb

def run():
  # Get all albums
  allAlbums = Album.objects.all()
  # Track failed updates
  failed_albums = []
  # Iterate albums and update track data
  album: Album
  for album in allAlbums:
    try:
      print(f"Updating track list for album: {album.title}...")
      # Parse full track list
      track_list = []
      # Iterate each side/disk of the release
      for grouping in album.raw_data['media']:
        for track in grouping['tracks']:
          track_list.append(track)
      # Update album track list
      album.track_list = {"tracks": track_list}
      album.save()
    except Exception as e:
      print(f"FAILED - Updating track list for album: {album.title}...")
      failed_albums.append((album, e))
      continue
  
  print(f"Album updates completed! Printing failed list of length {len(fail_data)} now:")
  fail_data: tuple[Album, Exception]
  for fail_data in failed_albums:
    fail = fail_data[0]
    print(f"FAILED - {fail.title} - {fail.mbid} - {fail_data[1]}")

  print(f"Attempting to pull failed album data directly from MB:")
  fail_data: tuple[Album, Exception]
  for fail_data in failed_albums:
    album = fail_data[0]
    print(f"Attempting to pull data for {album.title} - {album.mbid}")
    try:
      # Query musicbrainz for album
      freshAlbum = get_album_from_mb(album.mbid)
      # Copy over data
      album.raw_data = freshAlbum.raw_data
      album.track_list = freshAlbum.track_list
      # Save original album (NOTE: DO NOT SAVE NEW ALBUM OR DUPLICATES WILL END UP IN THE DB AND THATS VERY BAD)
      album.save()
      print(f"Successfully pulled data for {album.title} - {album.mbid}")
    except Exception as e:
      print(f"Failed trying to get {album.title} - {album.mbid} from MB: {e}")