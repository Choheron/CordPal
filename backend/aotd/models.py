from django.db import models

import logging

from users.models import User
from spotifyapi.models import Album as SpotAlbum
from reactions.models import Reaction

import json

logger = logging.getLogger(__name__)

# Model for aotd data that corresponds to a user - This being in existance will serve as a way of checking for AOTD signup.
class AotdUserData(models.Model):
  # Foriegn key of a user object, primary key, required
  user = models.OneToOneField(
    User,
    on_delete=models.CASCADE,
    primary_key=True,
    related_name="aotd_data"
  )
  # Automatic Fields
  creation_timestamp = models.DateTimeField(auto_now_add=True)
  # Flag for if their albums are currently blocked
  selection_blocked_flag = models.BooleanField(default=False)

  # toString Method
  def __str__(self):
    return "AOTD User Data:" + self.user.nickname
  

# Model for an album that has been submitted for album of the day
class Album(models.Model):
  mbid = models.CharField(max_length=256, unique=True, null=False)
  
  title = models.CharField(max_length=256)
  artist = models.CharField(max_length=256)
  artist_url = models.CharField(default="", max_length=512) # Links back to MusicBrainz Page using artistID
  cover_url = models.CharField(max_length=512) # Retrieved using CoverArtArchive
  album_url= models.CharField(default="", max_length=512) # Url to access album from MusicBrainz
  submitted_by = models.ForeignKey(
    User, 
    on_delete=models.SET_NULL,  # Keep the album, set submitted_by to NULL
    null=True,
    blank=True,
    related_name="submitted_albums"
  )
  user_comment = models.TextField(null=True, blank=True)  # User's comment on the album
  submission_date = models.DateTimeField(auto_now_add=True) 
  release_date = models.DateField(max_length=50, null=True) # Date Object Release Date (Optional if a release date can be parsed)
  release_date_str = models.CharField(max_length=50, null=True) # Raw Release date, if found or provided
  disambiguation = models.CharField(max_length=50, null=False, default="") # If its a remaster or not, defauly to ""
  raw_data = models.JSONField(null=True) # JSON field to store all data returned from the frontend
  track_list = models.JSONField(null=True) # JSON field to contain a list of tracks from the musicbrainz api, will be fetched after selection.

  legacy_album = models.OneToOneField(
    SpotAlbum,
    on_delete=models.SET_NULL,  # Keep the album, set legacy album to NULL
    null=True,
    blank=True,
    related_name="migrated_album",
    unique=True
  )

  def subDateToCalString(self):
    return self.submission_date.strftime('%Y-%m-%d')
    
  def relDateToCalString(self):
    if(self.release_date_date):
      return self.release_date.strftime("%Y-%m-%d")
    elif(self.release_date):
      return self.release_date
    else:
      return "Not Available"
    
  def toJSON(self):
    """Return an Album as a JSON. (For HTTP JSON Responses)"""
    out = {}
    out['mbid'] = self.mbid
    out['title'] = self.title
    out['artist'] = self.artist
    out['artist_url'] = self.artist_url
    out['cover_url'] = self.cover_url
    out['album_url'] = self.album_url
    out['submitter'] = self.submitted_by.nickname
    out['submitter_id'] = self.submitted_by.discord_id
    out['submission_date'] = self.submission_date.strftime("%m/%d/%Y, %H:%M:%S")
    out['release_date'] = self.release_date
    out['user_comment'] = self.user_comment
    out['raw_album'] = self.raw_data
    return out

  # Custom delete function to log the user action
  def delete(self, deleter=None, reason=None, *args, **kwargs):
    # Log the action before actually deleting
    from users.models import UserAction  # Import inside to avoid circular import
    from spotifyapi.utils import albumToDict

    # If deleter is not provided, log critical log and do not delete album
    if(deleter == None):
      logger.critical(f"ATTEMPTED DELETE OF ALBUM (ID: {self.mbid}) WITH NO USER PASSED IN! KEEPING ALBUM: {self.title}")
      return
    # Create user action log
    UserAction.objects.create(
      user=deleter, 
      action_type="DELETE",
      entity_type="ALBUM",
      entity_id=self.id,
      details={"reason": reason, "deleted_album": self.title, "album_raw_data": self.toJSON() }
    )
    # Call Django's default delete method
    super().delete(*args, **kwargs)

  def __str__(self):
    return f"{self.title} by {self.artist}"