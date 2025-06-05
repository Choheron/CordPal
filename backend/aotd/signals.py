from django.db.models.signals import post_save
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import ( 
  Album,
  Review,
  UserAlbumOutage
)
from users.models import UserAction

@receiver(post_save, sender=Album)
def log_album_creation(sender, instance: Album, created, **kwargs):
  if created:  # Ensure it runs only on first creation
    UserAction.objects.create(
      user=instance.submitted_by,
      action_type="CREATE",
      entity_type="ALBUM",
      entity_id=instance.pk,
      details={"title": instance.title, "artist": instance.artist}
    )

@receiver(post_save, sender=Review)
def log_review_creation(sender, instance: Review, created, **kwargs):
  if created:  # Ensure it runs only on first creation
    UserAction.objects.create(
      user=instance.user,
      action_type="CREATE",
      entity_type="REVIEW",
      entity_id=instance.pk,
      timestamp=instance.review_date,
      details={"album_pk": instance.album.pk, "review_pk": instance.pk}
    )

@receiver(post_save, sender=UserAlbumOutage)
def log_album_selection_outage_creation(sender, instance: UserAlbumOutage, created, **kwargs):
  if created:  # Ensure it runs only on first creation
    UserAction.objects.create(
      user=(instance.admin_enactor if (instance.admin_enacted) else instance.user),
      action_type="CREATE",
      entity_type="ALBUM_SELECTION_OUTAGE",
      entity_id=instance.pk,
      details={"affected_user": instance.user.pk, "reason": instance.reason}
    )