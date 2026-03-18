from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from django.utils.timezone import now
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericRelation

import logging
import pytz
import datetime
import json

from users.models import User
from spotifyapi.models import Album as SpotAlbum
from reactions.models import Reaction
from votes.models import Vote


logger = logging.getLogger(__name__)


def generateTimelineDict():
  return { "timeline": [] }


# Model for aotd data that corresponds to a user - This being in existance will serve as a way of checking for AOTD signup.
class AotdUserData(models.Model):
  """
  Stores AOTD-related data for a registered user. The existence of this record
  indicates that the user has signed up for Album of the Day participation.
  Tracks review stats, submission stats, and streak information.
  """
  # Foriegn key of a user object, primary key, required
  user = models.OneToOneField(
    User,
    on_delete=models.CASCADE,
    primary_key=True,
    related_name="aotd_data",
    unique=True
  )
  # Automatic Fields
  creation_timestamp = models.DateTimeField(auto_now_add=True)
  # Flag for if their albums are currently blocked
  selection_blocked_flag = models.BooleanField(default=False)
  # Track review stats
  total_reviews = models.IntegerField(default=None, null=True)
  missed_reviews = models.IntegerField(default=0)
  review_score_sum = models.FloatField(default=0)
  first_listen_percentage = models.FloatField(default=0)
  average_review_score = models.FloatField(default=0)
  review_score_stddev = models.FloatField(default=0)
  median_review_score = models.FloatField(default=0)
  lowest_score_given = models.FloatField(default=None, null=True)
  lowest_score_mbid = models.CharField(max_length=256, null=True, default=None)
  lowest_score_date = models.DateField(null=True, default=None)
  highest_score_given = models.FloatField(default=None, null=True)
  highest_score_mbid = models.CharField(max_length=256, null=True, default=None)
  highest_score_date = models.DateField(null=True, default=None)
  review_ratio = models.FloatField(default=0) # Corresponds to the number of days a user has reviewed versus the number they havent (since they joined)
  # Track Review Streaks
  current_streak = models.PositiveIntegerField(default=0)
  '''User's current aotd Review streak'''
  longest_streak = models.PositiveIntegerField(default=0)
  '''User's longest aotd Review streak'''
  last_review_date = models.DateField(null=True, blank=True)
  '''User's last review date (DateField)'''
  # Track some submission stats
  total_submissions = models.IntegerField(default=None, null=True)
  total_selected = models.IntegerField(default=None, null=True)
  selection_score_sum = models.FloatField(default=0)
  average_selection_score = models.FloatField(default=0)
  # Active flag, use to initiate the "yard sale" mechanic
  active = models.BooleanField(default=True)

  # toString Method
  def __str__(self):
    return "AOTD User Data:" + self.user.nickname

  # Return true if streak is set to expire today (they havent reviewed for today's aotd)
  def isStreakAtRisk(self):
    date_now = datetime.datetime.now(tz=pytz.timezone('America/Chicago'))
    if(self.last_review_date is None):
      return False
    return True if (self.last_review_date.strftime("%Y-%m-%d") != date_now.strftime("%Y-%m-%d")) else False


# Model for an album that has been submitted for album of the day
class Album(models.Model):
  """
  Represents an album submitted by a user for Album of the Day consideration.
  Stores MusicBrainz metadata, cover art, submission info, and optional track list
  (populated after the album is selected as AOTD).
  """
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
  submission_date = models.DateTimeField(null=True, default=now)
  release_date = models.DateField(max_length=50, null=True) # Date Object Release Date (Optional if a release date can be parsed)
  release_date_str = models.CharField(max_length=50, null=True) # Raw Release date, if found or provided
  disambiguation = models.CharField(max_length=256, null=False, default="") # If its a remaster or not, defauly to ""
  raw_data = models.JSONField(null=True) # JSON field to store all data returned from the frontend
  track_list = models.JSONField(null=True) # JSON field to contain a list of tracks from the musicbrainz api, will be fetched after selection.
  hidden = models.BooleanField(default=False) # If this is true, it will not appear in recent submissions

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

  def toJSON(self, include_raw=True):
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
    out['release_date_str'] = self.release_date_str
    out['user_comment'] = self.user_comment
    if(include_raw):
      out['raw_album'] = self.raw_data
    return out

  # Custom delete function to log the user action
  def delete(self, deleter=None, reason=None, *args, **kwargs):
    # Log the action before actually deleting
    from users.models import UserAction  # Import inside to avoid circular import
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


# Model for an album of the day
class DailyAlbum(models.Model):
  """
  Represents the Album of the Day for a specific date. Links an Album to its
  scheduled date and stores aggregate rating data, standard deviation, and a
  rating timeline that is built up as reviews come in throughout the day.
  """
  album = models.ForeignKey(Album, on_delete=models.PROTECT)
  date = models.DateField(unique=True)
  manual = models.BooleanField(default=False)
  admin_message = models.TextField(null=True, blank=True)  # If set by an admin, and the admin provided a message, store that here. [The frontend will not show that an admin set this day unless a description is provided]
  rating_timeline = models.JSONField(default=generateTimelineDict, null=True)
  rating = models.FloatField(default=11.0, null=True) # Score for this day, will only be populated after the day is over (11 means it was not populated yet, Null means no reviews were made)
  standard_deviation = models.FloatField(default=None, null=True)

  def getReviewCount(self):
    return Review.objects.filter(aotd_date=self.date, album=self.album).count()

  def dateToCalString(self):
    return self.date.strftime('%Y-%m-%d')

  def toJSON(self, timeline: bool = False, include_raw_album: bool = True):
    out = {}
    out['album_data'] = self.album.toJSON(include_raw=include_raw_album)
    out['date'] = self.dateToCalString()
    out['manual'] = self.manual
    out['admin_message'] = self.admin_message
    if(timeline):
      out['rating_timeline'] = self.rating_timeline
    out['rating'] = self.rating
    out['standard_deviation'] = self.standard_deviation
    return out

  def __str__(self):
    return f"Album for {self.date}: {self.album}"


# Model for a User's review of an album.
class Review(models.Model):
  """
  A user's review of an Album of the Day. Each user may submit one review per
  AOTD date. Supports a score, optional text, first-listen flag, reactions, and
  advanced per-track review data. Updates are versioned and persisted to ReviewHistory.
  """
  album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="reviews")
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="aotd_reviews")
  score = models.FloatField()  # Score out of 10
  review_text = models.TextField(null=True, blank=True)
  review_date = models.DateTimeField(null=True, default=now)
  last_updated = models.DateTimeField(auto_now=True)  # Track the latest update
  first_listen = models.BooleanField(default=None, null=True) # Is this review a result of a first listen?
  aotd_date = models.DateField(null=False) # Attach each review to the aotd date in which it was provided
  # Add review versioning for display
  version = models.IntegerField(default=1)
  # Add reactions relationship for easy query
  reactions = GenericRelation(Reaction)
  # Advanced Review Support (Added in June of 2025)
  advanced = models.BooleanField(default = False, null=False)
  advancedReviewDict = models.JSONField(default=None, null=True)

  class Meta:
    unique_together = ('album', 'user', 'aotd_date')  # Prevent duplicate reviews for the same user and album

  def toJSON(self, full: bool = False):
    """
    Return a review as a JSON. (For HTTP JSON Responses)
    Parameters:
    - full: Boolean - Include all data from album and any other related objects
    """
    outObj = {}
    outObj['id'] = self.pk
    outObj['user_id'] = self.user.discord_id
    outObj['user_nickname'] = self.user.nickname
    outObj['album_id'] = self.album.mbid
    if(full):
      outObj['album'] = self.album.toJSON()
    outObj['score'] = self.score
    outObj['comment'] = self.review_text
    outObj['review_date'] = self.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['last_updated'] = self.last_updated.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['first_listen'] = self.first_listen
    outObj['aotd_date'] = self.aotd_date.strftime("%Y-%m-%d")
    outObj['version'] = self.version
    outObj['advanced'] = self.advanced
    outObj['trackData'] = self.advancedReviewDict
    # Get all reactions, group by reaction, and store a list
    reactions = self.reactions.all()
    rObj = {}
    reaction: Reaction
    for reaction in reactions:
      if(reaction.emoji in rObj.keys()):
        rObj[reaction.emoji]['count'] += 1
        rObj[reaction.emoji]['objects'].append(reaction.toJSON())
      else:
        rObj[reaction.emoji] = {
          "count": 1,
          "emoji": reaction.emoji,
          "objects": [reaction.toJSON()],
          "custom": reaction.custom_emoji
        }
    # Convert to list and attach to out obj
    outObj['reactions'] = list(rObj.values())
    return outObj

  def save(self, silent_update: bool = False, *args, **kwargs):
    """Save override, will create a history object and user action."""
    from users.models import UserAction
    # Create a history record before updating the review
    if self.pk and not silent_update:  # Only if this is an update, not a new review and is not a silent update by an admin
      # Fetch the original (pre-save) instance from the DB
      old_review = Review.objects.get(pk=self.pk)
      # Create review history object
      history = ReviewHistory.objects.create(
        review=self,
        score=old_review.score,
        review_text=old_review.review_text,
        review_date=old_review.review_date,
        last_updated=old_review.last_updated,
        first_listen=old_review.first_listen,
        aotd_date=old_review.aotd_date,
        version=old_review.version,
        advanced=old_review.advanced,
        advancedReviewDict=old_review.advancedReviewDict
      )
      # Create UserAction for review update
      UserAction.objects.create(
        user=self.user,
        action_type="UPDATE",
        entity_type="REVIEW",
        entity_id=self.pk,
        details={"old_review_score": self.score, "old_review_text": self.review_text, "reviewhistory_pk": history.pk}
      )
    super().save(*args, **kwargs)

  def __str__(self):
    return f"Review by {self.user.username} for {self.album.title}"


# Model for a User's older review of an album.
class ReviewHistory(models.Model):
  """
  Immutable snapshot of a Review at the point it was last saved. Created automatically
  by Review.save() whenever an existing review is updated (excluding silent admin updates).
  Preserves the previous score, text, and advanced review data for audit and display purposes.
  """
  review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="history")
  score = models.IntegerField()
  review_text = models.TextField(null=True, blank=True)
  review_date = models.DateTimeField()  # Original date of the review
  first_listen = models.BooleanField(default=None, null=True) # Is this review a result of a first listen?
  last_updated = models.DateTimeField(default=None, null=True) # When was this version of the review (the one being overwritten) recorded
  aotd_date = models.DateField(null=False) # Attach each review to the aotd date in which it was provided
  # Add review versioning for display
  version = models.IntegerField(default=1)
  recorded_at = models.DateTimeField(auto_now_add=True)  # When the history record was created
  # Advanced Review Support (Added in June of 2025)
  advanced = models.BooleanField(default=False, null=False)
  advancedReviewDict = models.JSONField(default=None, null=True)

  def toJSON(self, full: bool = False):
    """
    Return a review history as a JSON. (For HTTP JSON Responses)
    """
    outObj = {}
    outObj['id'] = self.pk
    outObj['score'] = self.score
    outObj['comment'] = self.review_text
    outObj['review_date'] = self.review_date.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['last_updated'] = self.last_updated.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['first_listen'] = self.first_listen
    outObj['aotd_date'] = self.aotd_date.strftime("%Y-%m-%d")
    outObj['version'] = self.version
    outObj['advanced'] = self.advanced
    outObj['trackData'] = self.advancedReviewDict
    outObj['recorded_at'] = self.recorded_at.strftime("%m/%d/%Y, %H:%M:%S")
    if(full):
      outObj['review'] = self.review.toJSON()
    return outObj

  def __str__(self):
    return f"History for {self.review} at {self.recorded_at}"


# Model for an Album Selection Outage. Users or admins can impose selection outages where a user's albums will be unable to be selected
class UserAlbumOutage(models.Model):
  """
  A date range during which a user's albums are ineligible for AOTD selection.
  Can be self-imposed or admin-enacted. Deletion is audited and requires a deleter
  to be passed explicitly.
  """
  user = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
  )
  start_date = models.DateField()
  end_date = models.DateField()
  reason = models.TextField(blank=True, null=True)
  admin_enacted = models.BooleanField(default=False) # Flag to signify if an admin enacted this outage
  admin_enactor = models.ForeignKey( # If the admin_enacted flag is true, this field will contain the admin that created the outage
    User,
    on_delete=models.SET_NULL,
    default=None,
    related_name="outage_admin_enactor",
    null=True
  )
  creation_timestamp = models.DateTimeField(null=True, default=now)

  # Return True if outage is currently in effect or False if not
  def isActive(self):
    return ((self.start_date < timezone.now().date()) and (timezone.now().date() < self.end_date))

  # Convert to a dict
  def dict(self):
    out = {}
    out['user_pk'] = self.user.pk
    out['user_discord_id'] = self.user.discord_id
    out['user_nickname'] = self.user.nickname
    out['start_date'] = self.start_date.strftime('%Y-%m-%d')
    out['end_date'] = self.end_date.strftime('%Y-%m-%d')
    out['reason'] = self.reason
    out['admin_enacted'] = self.admin_enacted
    if(self.admin_enactor):
      out['admin_enactor_pk'] = self.admin_enactor.pk
      out['admin_enactor_discord_id'] = self.admin_enactor.discord_id
      out['admin_enactor_nickname'] = self.admin_enactor.nickname
    out['creation_timestamp'] = self.creation_timestamp.strftime('%m/%d/%Y, %H:%M:%S')
    out['active'] = self.isActive()
    # Return outage as a dict
    return out

  # Custom delete function to log the user action
  def delete(self, deleter=None, delete_reason=None, *args, **kwargs):
    # Log the action before actually deleting
    from users.models import UserAction  # Import inside to avoid circular import

    # If deleter is not provided, log critical log and do not delete album
    if(deleter == None):
      logger.critical(f"ATTEMPTED DELETE OF ALBUM_SELECTION_OUTAGE (ID: {self.pk}) WITH NO DELETER USER PASSED IN! KEEPING OUTAGE: {self.pk}")
      return
    # Create user action log
    UserAction.objects.create(
      user=deleter,
      action_type="DELETE",
      entity_type="ALBUM_SELECTION_OUTAGE",
      entity_id=self.pk,
      details={"delete_reason": delete_reason, "deleted_outage": self.pk, "outage_raw_data": json.dumps(self.dict) }
    )
    # Call Django's default delete method
    super().delete(*args, **kwargs)


# Storage for User chance object, representing the chance that a user will be selected for the next AOtD
class UserChanceCache(models.Model):
  """
  Cached record of a user's current probability of being selected for the next AOTD.
  Stores the computed percentage alongside any block reason (outage or inactivity).
  Refreshed periodically; the last_updated timestamp indicates cache freshness.
  """
  aotd_user = models.OneToOneField(
    AotdUserData,
    on_delete=models.CASCADE,
    related_name="aotd_chance"
  )
  chance_percentage = models.FloatField() # Percentage that user will be selected.
  block_type = models.CharField(max_length=50, null=True) # Should be either "OUTAGE", "INACTIVITY", or None
  outage = models.OneToOneField(UserAlbumOutage, null=True, on_delete=models.CASCADE) # If user is under an outage, link to that outage.
  reason = models.TextField(null=True) # Reason for the percentage, should be empty if user is not blocked in any way (This will carry the outage reason as well if user is under outage)
  last_updated = models.DateTimeField(auto_now=True)

  def toJSON(self):
    """Convert cache object to a dict for HTTP transfer"""
    out = {}
    out['aotd_user_id'] = self.aotd_user.pk
    out['user_id'] = self.aotd_user.user.guid
    out['user_nickname'] = self.aotd_user.user.nickname
    out['percentage'] = self.chance_percentage
    out['block_type'] = self.block_type
    out['reason'] = self.reason
    out['last_updated'] = self.last_updated.strftime('%m/%d/%Y, %H:%M:%S')
    if(self.outage != None):
      out['outage'] = {}
      out['outage']["target_user"] = self.outage.user.discord_id
      out['outage']["admin_outage"] = f"{self.outage.admin_enacted}"
      out['outage']["outage_start"] = self.outage.start_date.strftime('%Y-%m-%d')
      out['outage']["outage_end"] = self.outage.end_date.strftime('%Y-%m-%d')
    return out


# Global Tag for all albums (appearing as suggestions for future albums)
class GlobalTag(models.Model):
  """
  A site-wide tag that can be associated with albums, surfaced as suggestions
  when users are submitting new albums. Tags are unique by text and track who
  created them.
  """
  text = models.CharField(max_length=50, unique=True)
  created_by = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    related_name="created_global_tags"
  )
  created_at = models.DateTimeField(auto_now_add=True)

  def save(self, *args, **kwargs):
    from users.models import UserAction
    is_new = self.pk is None
    super().save(*args, **kwargs)
    if is_new and self.created_by:
      UserAction.objects.create(
        user=self.created_by,
        action_type="CREATE",
        entity_type="GLOBAL_TAG",
        entity_id=self.pk,
        details={"tag_text": self.text}
      )

  def delete(self, deleter=None, reason=None, *args, **kwargs):
    from users.models import UserAction
    if deleter is None:
      logger.critical(f"ATTEMPTED DELETE OF GLOBAL_TAG (ID: {self.pk}) WITH NO DELETER PASSED IN! KEEPING TAG: {self.text}")
      return
    UserAction.objects.create(
      user=deleter,
      action_type="DELETE",
      entity_type="GLOBAL_TAG",
      entity_id=self.pk,
      details={"reason": reason, "tag_text": self.text}
    )
    super().delete(*args, **kwargs)

  def __str__(self):
    return self.text


# Tag for a specific album
class AlbumTag(models.Model):
  """
  A user-submitted tag on a specific album. Tags are subject to community approval
  via upvotes/downvotes — a tag is marked approved once its net score reaches 3.
  Unique per album+text combination (case-sensitive at DB level; enforce iexact in views).
  If the tag was applied from a GlobalTag suggestion, global_tag will be set; otherwise it is null.
  """
  album = models.ForeignKey(
    Album,
    on_delete=models.CASCADE,
    related_name="tags"
  )
  tag_text = models.CharField(max_length=50)
  submitted_by = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    related_name="submitted_tags"
  )
  submitted_at = models.DateTimeField(auto_now_add=True)
  is_approved = models.BooleanField(default=False)
  votes = GenericRelation(Vote)
  global_tag = models.ForeignKey(
    GlobalTag,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="usages"
  )

  class Meta:
    unique_together = ('album', 'tag_text')  # case-sensitive at DB level; enforce iexact in view

  def get_net_score(self):
    from django.db.models import Sum
    result = self.votes.aggregate(total=Sum('vote_type'))
    return result['total'] or 0

  def recalculate_approval(self):
    """Recompute is_approved and save. Call after any vote change."""
    self.is_approved = self.get_net_score() >= 3
    self.save(update_fields=['is_approved'])

  def save(self, *args, **kwargs):
    from users.models import UserAction
    is_new = self.pk is None
    super().save(*args, **kwargs)
    if is_new and self.submitted_by:
      UserAction.objects.create(
        user=self.submitted_by,
        action_type="CREATE",
        entity_type="ALBUM_TAG",
        entity_id=self.pk,
        details={"tag_text": self.tag_text, "album_mbid": self.album.mbid, "album_title": self.album.title, "from_global_tag": self.global_tag_id is not None, "global_tag_id": self.global_tag_id}
      )

  def delete(self, deleter=None, reason=None, admin_delete=False, *args, **kwargs):
    from users.models import UserAction
    if deleter is None:
      logger.critical(f"ATTEMPTED DELETE OF ALBUM_TAG (ID: {self.pk}) WITH NO DELETER PASSED IN! KEEPING TAG: {self.tag_text}")
      return
    UserAction.objects.create(
      user=deleter,
      action_type="DELETE",
      entity_type="ALBUM_TAG",
      entity_id=self.pk,
      details={"reason": reason, "admin_delete": admin_delete, "tag_text": self.tag_text, "album_mbid": self.album.mbid}
    )
    super().delete(*args, **kwargs)

  def log_vote(self, voter, vote_type):
    """Log a vote event on this tag. Call this from the view after a Vote is created or changed."""
    from users.models import UserAction
    UserAction.objects.create(
      user=voter,
      action_type="CREATE",
      entity_type="ALBUM_TAG_VOTE",
      entity_id=self.pk,
      details={"vote_type": vote_type, "tag_text": self.tag_text, "album_mbid": self.album.mbid}
    )

  def toJSON(self, user=None):
    upvotes = self.votes.filter(vote_type=1).count()
    downvotes = self.votes.filter(vote_type=-1).count()
    out = {
      'id': self.pk,
      'tag_text': self.tag_text,
      'submitted_by': self.submitted_by.nickname if self.submitted_by else None,
      'submitted_by_id': self.submitted_by.discord_id if self.submitted_by else None,
      'submitted_at': self.submitted_at.strftime("%m/%d/%Y, %H:%M:%S"),
      'is_approved': self.is_approved,
      'net_score': upvotes - downvotes,
      'upvotes': upvotes,
      'downvotes': downvotes,
      'user_vote': None,
    }
    if user:
      user_vote = self.votes.filter(user=user).first()
      out['user_vote'] = user_vote.vote_type if user_vote else None
    return out

  def __str__(self):
    return f'"{self.tag_text}" on {self.album.title}'
