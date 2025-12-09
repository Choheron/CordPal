from django.db import models
from django.forms.models import model_to_dict
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

import json

from users.models import User

class Reaction(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  # Relations to target object
  content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
  object_id = models.PositiveIntegerField()
  content_object = GenericForeignKey("content_type", "object_id")
  # Model Specific Fields
  emoji = models.CharField(max_length=255)
  creation_timestamp = models.DateTimeField(auto_now_add=True)
  custom_emoji = models.BooleanField(default=False)


  def toJSON(self):
    """Return a reaction as a JSON. (For HTTP JSON Responses)"""
    outObj = {}
    outObj['id'] = self.pk
    outObj['user_id'] = self.user.pk
    outObj['user_data'] = {
      "discord_id": self.user.discord_id,
      "nickname": self.user.nickname
    }
    outObj['target_object_id'] = self.object_id
    outObj['emoji'] = self.emoji
    outObj['creation_timestamp'] = self.creation_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
    outObj['custom_emoji'] = self.custom_emoji
    return outObj

  
  def save(self, *args, **kwargs):
    """Save function override, to log user actions on update"""
    from users.models import UserAction
    # Create a history record before updating the review
    if self.pk:  # Only if this is an update, not a new review
      # Create UserAction for review update
      UserAction.objects.create(
        user=self.user, 
        action_type="UPDATE",
        entity_type="REACTION",
        entity_id=self.pk,
        details={"old_emoji": self.emoji}
      )
    super().save(*args, **kwargs)


  def delete(self, deleter=None, delete_reason=None, *args, **kwargs):
    """Custom delete function to log the user action"""
    # Log the action before actually deleting
    from users.models import UserAction  # Import inside to avoid circular import

    # Create user action to log deletion
    UserAction.objects.create(
      user=deleter, 
      action_type="DELETE",
      entity_type="REACTION",
      entity_id=self.pk,
      details={ "reaction_raw_data": json.dumps(model_to_dict(self)) }
    )
    # Call Django's default delete method
    super().delete(*args, **kwargs)

  
  def __str__(self):
    return f"Comment by {self.user} on {self.content_type} ({self.object_id})"