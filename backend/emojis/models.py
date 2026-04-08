import logging
import os

from django.db import models
from users.models import User

logger = logging.getLogger()


class CustomEmoji(models.Model):
  """
  A custom server emoji uploaded by a member, served locally rather than
  via Discord CDN. Tracks submission metadata, use count, and active status.
  """
  emoji_id          = models.BigAutoField(primary_key=True)
  name              = models.CharField(max_length=100, unique=True)   # URL-safe slug, e.g. "tfw"
  display_name      = models.CharField(max_length=200, blank=True)    # Picker label
  keywords          = models.JSONField(default=list)                   # ["tfw", "knee surgery"]
  filename          = models.CharField(max_length=300)                 # {uuid.hex}_{original}
  filetype          = models.CharField(max_length=50)                  # e.g. "image/webp"
  submitted_by      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
  submitted_at      = models.DateTimeField(null=True, blank=True)      # null = legacy/unknown
  hide_submitted_at = models.BooleanField(default=False)               # Admin suppresses public display
  use_count         = models.PositiveBigIntegerField(default=0)
  is_active         = models.BooleanField(default=True)
  upload_timestamp  = models.DateTimeField(auto_now_add=True)

  class Meta:
    ordering = ['name']

  def toJSON(self, admin=False):
    """
    Return a serialisable dict of this emoji for HTTP responses.

    admin=True includes fields that should not be exposed to regular users
    """
    backend_base = os.getenv('BACKEND_BASE_URL', '').rstrip('/')
    out = {}
    out['emoji_id']      = self.emoji_id
    out['name']          = self.name
    out['display_name']  = self.display_name or self.name
    out['keywords']      = self.keywords
    out['serve_url']     = f'{backend_base}/emojis/serve/{self.emoji_id}/'
    out['use_count']     = self.use_count
    out['is_active']     = self.is_active
    out['upload_timestamp'] = self.upload_timestamp.strftime('%m/%d/%Y, %H:%M:%S')
    out['submitted_by']  = self.submitted_by.nickname if self.submitted_by else None
    # Respect hide_submitted_at for non-admin callers
    if admin:
      out['submitted_at']      = self.submitted_at.strftime('%m/%d/%Y, %H:%M:%S') if self.submitted_at else None
      out['hide_submitted_at'] = self.hide_submitted_at
      out['filename']          = self.filename
      out['filetype']          = self.filetype
    else:
      out['submitted_at'] = (
        self.submitted_at.strftime('%m/%d/%Y, %H:%M:%S')
        if self.submitted_at and not self.hide_submitted_at
        else None
      )

    return out

  def save(self, *args, skip_action_log=False, **kwargs):
    """
    Save override. Logs a CREATE UserAction when a new emoji is saved,
    unless skip_action_log=True (used by the seed_legacy_emojis management
    command to avoid polluting the audit log with bulk historical imports).
    """
    from users.models import UserAction
    is_new = self.pk is None
    super().save(*args, **kwargs)
    if is_new and self.submitted_by and not skip_action_log:
      UserAction.objects.create(
        user=self.submitted_by,
        action_type='CREATE',
        entity_type='CUSTOM_EMOJI',
        entity_id=self.pk,
        details={
          'name': self.name,
          'display_name': self.display_name,
        }
      )

  def delete(self, deleter=None, reason=None, *args, **kwargs):
    """
    Delete override. Requires a deleter to be passed — refuses and logs a
    critical error if called without one (prevents silent, unattributed deletes).
    Logs a DELETE UserAction before removing the record.
    """
    from users.models import UserAction
    if deleter is None:
      logger.critical(
        f'ATTEMPTED DELETE OF CUSTOM_EMOJI (ID: {self.pk}, name: {self.name}) '
        f'WITH NO DELETER PASSED IN! KEEPING EMOJI.'
      )
      return
    UserAction.objects.create(
      user=deleter,
      action_type='DELETE',
      entity_type='CUSTOM_EMOJI',
      entity_id=self.pk,
      details={
        'reason': reason,
        'name': self.name,
        'display_name': self.display_name,
      }
    )
    super().delete(*args, **kwargs)

  def __str__(self):
    return self.name
