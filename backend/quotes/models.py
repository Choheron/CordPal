from django.db import models
from django.utils.timezone import now

import logging

from users.models import User

logger = logging.getLogger(__name__)

# Create your models here.
class Quote(models.Model):
  submitter = models.ForeignKey(
    User,
    related_name="quotes_submitted",
    on_delete=models.SET_NULL,
    null=True
  ) # The user who submitted the quote NOTE: NOT THE SPEAKER OF THE QUOTE
  submitter_nickname = models.TextField(null=True, blank=True) # The nickname of the quote submitter at the time of submission (NOT ACCURATE TO USER's CURRENT NICKNAME)
  submitter_discord_id = models.CharField(max_length=255, null=True) # The discord ID of the submitter, ONLY USED IF SUBMITTER IS NOT ACTIVELY PART OF THE SITE
  speaker = models.ForeignKey(
    User,
    related_name="quotes",
    on_delete=models.SET_NULL,
    null=True
  ) # The user who spoke the quote
  speaker_discord_id = models.CharField(max_length=255, null=True) # The discord ID of the speaker, ONLY USED IF SPEAKER IS NOT ACTIVELY PART OF THE SITE
  text = models.TextField(null=True, blank=True) # The actual text of the quote
  timestamp = models.DateTimeField(null=True, default=now)

  def toJSON(self):
    """Return a Quote as a JSON. (For HTTP JSON Responses)"""
    out = {}
    out['submitter'] = self.submitter.toJSON() if self.submitter else None
    out['submitter_nickname'] = self.submitter_nickname
    out['submitter_discord_id'] = self.submitter_discord_id
    out['speaker'] = self.speaker.toJSON() if self.speaker else None
    out['speaker_discord_id'] = self.speaker_discord_id 
    out['text'] = self.text
    out['timestamp'] = self.timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    return out
  
  # Get speaker discord ID
  def get_speaker_id(self):
    return self.speaker.discord_id if self.speaker else self.speaker_discord_id

  # Custom delete function to log the user action
  def delete(self, deleter=None, reason=None, *args, **kwargs):
    # Log the action before actually deleting
    from users.models import UserAction  # Import inside to avoid circular import
    # If deleter is not provided, log critical log and do not delete album
    if(deleter == None):
      logger.critical(f"ATTEMPTED DELETE OF QUOTE (ID: {self.pk}) WITH NO USER PASSED IN! KEEPING QUOTE: {self.text}")
      return
    # Create user action log
    UserAction.objects.create(
      user=deleter, 
      action_type="DELETE",
      entity_type="QUOTE",
      entity_id=self.id,
      details={"reason": reason, "quote_raw_data": self.toJSON()}
    )
    # Call Django's default delete method
    super().delete(*args, **kwargs)

  def __str__(self):
    return f"{self.title} by {self.artist}"