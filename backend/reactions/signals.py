from django.db.models.signals import post_save
from django.dispatch import receiver
from django.forms.models import model_to_dict

from .models import Reaction
from users.models import UserAction

@receiver(post_save, sender=Reaction)
def log_reaction_creation(sender, instance: Reaction, created, **kwargs):
  if created:  # Ensure it runs only on first creation
    UserAction.objects.create(
      user=instance.user,
      action_type="CREATE",
      entity_type="REACTION",
      entity_id=instance.pk,
      details={"emoji": instance.emoji, "reaction_pk": instance.pk}
    )