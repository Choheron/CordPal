from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Vote(models.Model):
  UPVOTE = 1
  DOWNVOTE = -1
  VOTE_TYPES = [
    (UPVOTE, 'Upvote'),
    (DOWNVOTE, 'Downvote'),
  ]

  user = models.ForeignKey(User, on_delete=models.CASCADE)
  content_type = models.ForeignKey("contenttypes.ContentType", on_delete=models.CASCADE)
  object_id = models.PositiveIntegerField()
  vote_type = models.SmallIntegerField(choices=VOTE_TYPES)
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    unique_together = ('user', 'content_type', 'object_id')  # Ensures one vote per user per object