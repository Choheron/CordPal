from django.db import models

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

  def get_avatar_url(self):
    """Construct the avatar URL from Discord's CDN."""
    if self.discord_avatar:
        return f"https://cdn.discordapp.com/avatars/{self.discord_id}/{self.discord_avatar}.png"
    return f"https://cdn.discordapp.com/embed/avatars/{int(self.discord_discriminator) % 5}.png"


  # toString Method
  def __str__(self):
    return self.discord_id