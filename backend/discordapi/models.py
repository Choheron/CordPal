from django.db import models
import logging

from users.models import User

logger = logging.getLogger(__name__)

# Model for spotify data that corresponds to a user
class DiscordTokens(models.Model):
  # One to One Connection with User Model
  user = models.OneToOneField(
    User,
    on_delete=models.CASCADE,
    primary_key=True,
  )
  # API data, encrypted
  access_token = models.CharField(null=True, max_length=512)
  token_type = models.CharField(null=True, max_length=50)
  expiry_date = models.DateTimeField(null = True)
  refresh_token = models.CharField(null=True, max_length=512)
  scope = models.CharField(null=True, max_length=512)

  # Clear token data
  def clearTokens(self):
    self.access_token = None
    self.token_type = None
    self.expiry_date = None
    self.refresh_token = None
    self.scope = None
    self.save()