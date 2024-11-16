from django.db import models

from users.models import User

# Model for spotify data that corresponds to a user
class SpotifyUserData(models.Model):
  # Foriegn key of a user object, primary key, required
  user = models.OneToOneField(
    User,
    on_delete=models.CASCADE,
    primary_key=True,
  )
  # Spotify Data
  country = models.CharField(max_length=2)
  display_name = models.CharField(
    max_length=150,
    null=True,
  )
  email = models.EmailField(max_length=256)
  spotify_url = models.CharField(max_length=256)
  follower_count = models.IntegerField(default=0)
  user_endpoint = models.CharField(max_length=512)
  spotify_id = models.CharField(max_length=256)
  user_pfp_url = models.CharField(max_length=512, null=True)
  user_pfp_height = models.IntegerField(null=True)
  user_pfp_width = models.IntegerField(null=True)
  membership_type = models.CharField(max_length=256)
  # Automatic Fields
  creation_timestamp = models.DateTimeField(auto_now_add=True)
  # Fields for authentication and login
  access_token = models.CharField(null=True, max_length=512)
  token_type = models.CharField(null=True, max_length=30)
  token_scope = models.CharField(null=True, max_length=512)
  token_expiry_date = models.DateTimeField(null=True)
  refresh_token = models.CharField(null=True, max_length=512)

  # toString Method
  def __str__(self):
    return "Spotify:" + self.display_name