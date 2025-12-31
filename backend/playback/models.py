from django.db import models

from aotd.models import AotdUserData

class GlobalPlayback(models.Model):
  '''
  Model representing the entirety of the CordPal Playback sitewide data, not individual user data.
  '''
  year = models.IntegerField(null=False, primary_key=True)
  payload = models.JSONField(null=False)
  generation_timestamp = models.DateTimeField(auto_now_add=True)

  def toJSON(self):
    '''Return JSON representation of Playback data'''
    out = {}
    out['year'] = self.year
    out['payload'] = self.payload
    out['generation_timestamp'] = self.generation_timestamp.strftime("%Y-%m-%d")
    return out


class UserPlayback(models.Model):
  '''
  Model representing the CordPal Playback data for a single user.
  '''
  # Foriegn key of a user AOTD object
  aotd_user = models.OneToOneField(
    AotdUserData,
    on_delete=models.CASCADE,
    primary_key=True,
    unique=True
  )
  year = models.IntegerField(null=False)
  payload = models.JSONField(null=False)
  generation_timestamp = models.DateTimeField(auto_now_add=True)
  public = models.BooleanField(default=False)
  '''Flag allowing user to decide if their CordPal Playback Data can be viewed by others on the site'''

  def toJSON(self):
    '''Return JSON representation of Playback data'''
    out = {}
    out['user'] = self.aotd_user.user.toJSON()
    out['aotd_user'] = self.aotd_user.pk
    out['year'] = self.year
    out['payload'] = self.payload
    out['generation_timestamp'] = self.generation_timestamp.strftime("%Y-%m-%d")
    out['public'] = self.public
    return out

  class Meta:
    unique_together = (("aotd_user", "year"))