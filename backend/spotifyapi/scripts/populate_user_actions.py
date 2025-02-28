# This script is for a one time use to populate the UserActions table with previous user actions around albums and reviews,
# as user actions were not tracked until 02/28/2025
from django.forms.models import model_to_dict

from ..models import (
  Review,
  ReviewHistory,
  Album,
  DailyAlbum,
)
from users.models import (
  User,
  UserAction
)

def run():
  failed_update = []
  # Retreive all Album objects
  album_objects = Album.objects.all()
  # Iterate album objects and create a user action for uploading of the album with the submission timestamp
  for album in album_objects:
    try:
      UserAction.objects.create(
        user=album.submitted_by,
        action_type="CREATE",
        entity_type="ALBUM",
        entity_id=album.pk,
        timestamp=album.submission_date,
        details={"title": album.title, "artist": album.artist}
      )
    except:
      failed_update.append(album)
  # Get all reviews and create user actions for them
  review_objects = Review.objects.all()
  # Iterate and create user actions for leaving reviews
  for review in review_objects:
    try:
      UserAction.objects.create(
        user=review.user,
        action_type="CREATE",
        entity_type="REVIEW",
        entity_id=review.pk,
        timestamp=review.review_date,
        details={"album_pk": review.album.pk, "review_pk": review.pk}
      )
    except:
      failed_update.append(review)
  # Get all review histories and create user actions for them
  hist_objects = ReviewHistory.objects.all()
  # Iterate and create user actions for leaving reviews
  for history in hist_objects:
    try:
      UserAction.objects.create(
        user=history.review.user,
        action_type="UPDATE",
        entity_type="REVIEW",
        entity_id=history.review.pk,
        timestamp=history.recorded_at,
        details={"old_review_score": history.review.score, "old_review_text": history.review.review_text, "reviewhistory_pk": history.pk}
      )
    except:
      failed_update.append(review)


  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print("| Entity Type | Django PK |")
  print("| -------------------- | ------------------ |")
  for entry in failed_update:
    print(f"| {type(entry)} | {entry.pk} |")