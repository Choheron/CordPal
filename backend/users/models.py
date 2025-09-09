from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password
from django.forms.models import model_to_dict
from django.db import models
from django.utils import timezone

from datetime import (
  datetime,
  timedelta
)

# Model for Users
class User(AbstractUser):
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
  nickname = models.CharField(max_length=254, unique=True)
  timezone_string = models.CharField(max_length=255, default="America/Chicago") # Last timezone
  password = models.CharField(max_length=128, null=True, blank=True) # OPTIONAL Password Field (Users [Currently] have the option to create a password after authenticating with discord)
  # Discord Integration Data
  discord_id = models.CharField(max_length=255)
  discord_discriminator = models.CharField(max_length=4, null=True, blank=True)  # 4-digit tag from Discord
  discord_is_verified = models.BooleanField(default=False)  # Discord account email verification status
  discord_avatar = models.CharField(max_length=255, null=True, blank=True)  # Avatar hash
  # Aotd Participation Flag
  aotd_enrolled = models.BooleanField(default=False)
  # User Permissions Fields
  is_active = models.BooleanField(default=True)
  is_staff = models.BooleanField(default=False)
  # Track any and all API calls that come through with this user's session cookie
  last_request_timestamp = models.DateTimeField(null = True)
  last_heartbeat_timestamp = models.DateTimeField(null = True)
  
  # Some Backend overhauls
  USERNAME_FIELD = 'nickname' # Set username field to nickname so users can change their email to change their username, email must be unique now

  def get_avatar_url(self):
    """Construct the avatar URL from Discord's CDN."""
    if self.discord_avatar:
        return f"https://cdn.discordapp.com/avatars/{self.discord_id}/{self.discord_avatar}.png"
    return f"https://cdn.discordapp.com/embed/avatars/{int(self.discord_discriminator) % 5}.png"

  def is_online(self):
    """Return true if the last_heartbeat_timestamp is within 1 min."""
    try:
      return ((timezone.now() - self.last_heartbeat_timestamp) < timedelta(minutes=1))
    except:
      return False
  
  def online_status(self):
    """Return one of three strings: ONLINE, AWAY, or OFFLINE"""
    if(not self.is_online()):
      return "Offline"
    time_since_request = (timezone.now() - self.last_request_timestamp)
    if(time_since_request > timedelta(minutes=2)):
      return "Away"
    # If we reach this point, they have had a heartbeat and a request within the last two mins, meaning they are online
    return "Online"
  
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
      out += f"{'{:.1f}'.format((days + (hours/24.0)))} days" if (hours > 3) else f"{days} day"
    elif(hours > 0):
      out += f"{hours} hours" if hours > 1 else f"{hours} hour"
    elif(minutes > 1):
      out += f"{minutes} minutes" if minutes > 1 else f"{minutes} minute"
    else:
      return "Just Now"
    return (out + " ago")
  
  def toJSON(self):
    """Return this User as a JSON. (For HTTP JSON Responses)"""
    out={}
    out['guid'] = self.guid
    out['username'] = self.username
    out['last_updated_timestamp'] = self.last_updated_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    out['creation_timestamp'] = self.creation_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    out['email'] = self.email
    out['nickname'] = self.nickname
    out['timezone_string'] = self.timezone_string
    out['discord_id'] = self.discord_id
    out['discord_discriminator'] = self.discord_discriminator
    out['discord_is_verified'] = self.discord_is_verified
    out['discord_avatar'] = self.discord_avatar
    out['aotd_enrolled'] = self.aotd_enrolled
    out['is_active'] = self.is_active
    out['is_staff'] = self.is_staff
    out['last_request_timestamp'] = self.last_request_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    out['last_heartbeat_timestamp'] = self.last_heartbeat_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    return out

  # toString Method
  def __str__(self):
    return self.discord_id
  

# Model for UserActions, to track deletions and updates
class UserAction(models.Model):
  ACTION_TYPES = [
    ("CREATE", "Create"),
    ("UPDATE", "Update"),
    ("DELETE", "Delete"),
    ("LOGIN", "Login"),
    ("LOGOUT", "Logout"),
  ]

  user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="actions")
  action_type = models.CharField(max_length=10, choices=ACTION_TYPES)
  entity_type = models.CharField(max_length=50)  # Examples: "REVIEW", "ALBUM", "PHOTOSHOP", "ALBUM_SELECTION_OUTAGE", "USERDATA",
  entity_id = models.IntegerField()
  timestamp = models.DateTimeField(default=timezone.now, blank=True, null=True)
  details = models.JSONField(null=True, blank=True)  # Store extra details (e.g., old vs. new values)

  # toString Method
  def __str__(self):
    return f"{self.user} {self.action_type} {self.entity_type} (ID: {self.entity_id}) at {self.timestamp}"