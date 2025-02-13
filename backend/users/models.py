from django.db import models
from django.utils import timezone

from datetime import (
  datetime,
  timedelta
)

# Model for Users
class User(models.Model):
  # Required Fields
  guid = models.BigAutoField(
    "GUID",
    primary_key=True,
    editable=False,
    unique=True,
  )
  username = models.CharField(max_length=100)
  # Automatic Fields/Metadata
  last_updated_timestamp = models.DateTimeField(auto_now=True)
  creation_timestamp = models.DateTimeField(auto_now_add=True)
  # Optional Fields
  email = models.EmailField(max_length=254)
  nickname = models.CharField(max_length=254)
  # Discord Integration Data
  discord_id = models.CharField(max_length=255)
  discord_discriminator = models.CharField(max_length=4, null=True, blank=True)  # 4-digit tag from Discord
  discord_is_verified = models.BooleanField(default=False)  # Discord account email verification status
  discord_avatar = models.CharField(max_length=255, null=True, blank=True)  # Avatar hash
  # Spotify Integration Flag
  spotify_connected = models.BooleanField(default=False)
  # User Permissions Fields
  is_active = models.BooleanField(default=True)
  is_staff = models.BooleanField(default=False)
  # Track any and all API calls that come through with this user's session cookie
  last_request_timestamp = models.DateTimeField(null = True)

  def get_avatar_url(self):
    """Construct the avatar URL from Discord's CDN."""
    if self.discord_avatar:
        return f"https://cdn.discordapp.com/avatars/{self.discord_id}/{self.discord_avatar}.png"
    return f"https://cdn.discordapp.com/embed/avatars/{int(self.discord_discriminator) % 5}.png"

  def is_online(self):
    """Return true if the last_request_timestamp is within 5 mins ago."""
    return ((timezone.now() - self.last_request_timestamp) < timedelta(minutes=5))
  
  def last_seen(self):
    """Return String stating how long its been since the user was last seen."""
    time_since = (timezone.now() - self.last_request_timestamp)
    # Calculate minutes and remaining seconds
    minutes, seconds = divmod(int(time_since.total_seconds()), 60)
    # Calculate hours and remaining minutes
    hours, minutes = divmod(minutes, 60)
    # Calculate days and remaining hours
    days, hours = divmod(hours, 24)
    # Return Simplified String 
    out = ""
    if(days > 0):
      out += f"{'{:.1f}'.format((days + (hours/24.0)))} days" if (hours > 1) else f"{days} day"
    elif(hours > 0):
      out += f"{hours} hours" if hours > 1 else f"{hours} hour"
    elif(minutes > 5):
      out += f"{minutes} minutes" if minutes > 1 else f"{minutes} minute"
    else:
      return "Now"
    return (out + " ago")

  # toString Method
  def __str__(self):
    return self.discord_id