from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericRelation

import random
import string

from users.models import User
from votes.models import Vote


def generate_public_id():
  """Generates a unique 8-character alphanumeric ID."""
  while True:
    new_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    if not FunctionalityRequest.objects.filter(public_id=new_id).exists():
      return new_id


class FunctionalityRequest(models.Model):
  """A model for a functionality request that can be submitted by a user"""
  STATUS_CHOICES = [
    ('pending', '🟡 Pending'),
    ('under_review', '🔍 Under Review'),
    ('approved', '✅ Approved'),
    ('in_progress', '🚧 In Progress'),
    ('implemented', '🚀 Implemented'),
    ('rejected', '❌ Rejected'),
  ]

  STATUS_DESCRIPTIONS = {
    'pending': "Your request has been submitted and is awaiting review.",
    'under_review': "Your request is being evaluated by the team.",
    'approved': "Your request has been approved and will be worked on when prioritized.",
    'in_progress': "Development is in progress for this request.",
    'implemented': "The requested feature has been successfully implemented.",
    'rejected': "The request was reviewed but will not be implemented.",
  }

  title = models.CharField(max_length=255)
  description = models.TextField()
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  # Automatic Fields 
  public_id = models.CharField(max_length=10, unique=True, default=generate_public_id, editable=False)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
  votes = GenericRelation(Vote)  # Enables querying related votes easily

  # Timestamps for status changes
  submitted_at = models.DateTimeField(auto_now_add=True)
  reviewed_at = models.DateTimeField(null=True, blank=True)
  approved_at = models.DateTimeField(null=True, blank=True)
  in_progress_at = models.DateTimeField(null=True, blank=True)
  implemented_at = models.DateTimeField(null=True, blank=True)
  rejected_at = models.DateTimeField(null=True, blank=True)

  def save(self, *args, **kwargs):
    """Automatically update timestamps when the status changes and track updates to a functionality request before saving."""
    # Create history of changes to functionality requests
    if self.pk:  # Check if object already exists
      original = FunctionalityRequest.objects.get(pk=self.pk)
      changed_fields = {}
      for field in ['title', 'description', 'status']:
        old_value = getattr(original, field)
        new_value = getattr(self, field)
        if old_value != new_value:
          changed_fields[field] = (old_value, new_value)

      if changed_fields:
        FunctionalityRequestUpdate.objects.create(
          request=self,
          updated_by=self.user,  # Assuming user is making the update
          changes=changed_fields
        )
    # Update timestamps when status changes
    if self.status == 'under_review' and not self.reviewed_at:
      self.reviewed_at = timezone.now()
    elif self.status == 'approved' and not self.approved_at:
      self.approved_at = timezone.now()
    elif self.status == 'in_progress' and not self.in_progress_at:
      self.in_progress_at = timezone.now()
    elif self.status == 'implemented' and not self.implemented_at:
      self.implemented_at = timezone.now()
    elif self.status == 'rejected' and not self.rejected_at:
      self.rejected_at = timezone.now()
    
    super().save(*args, **kwargs)

  def get_status_display_with_emoji(self):
    """Returns the status label with its emoji."""
    return dict(self.STATUS_CHOICES).get(self.status, self.status)
  
  def get_status_description(self):
    """Returns the description of the current status."""
    return self.STATUS_DESCRIPTIONS.get(self.status, "No description available.")
  

class FunctionalityRequestUpdate(models.Model):
  """Model to track updates made to a functionality request"""
  request = models.ForeignKey(FunctionalityRequest, on_delete=models.CASCADE, related_name="updates")
  updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)  # Tracks who made the update
  changes = models.JSONField()  # Stores old & new values
  updated_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"Update on {self.request.title} by {self.updated_by} at {self.updated_at}"
