# This script is for a single execution, it will iterate all review history objects and update them with the correct "last_updated" field to be able to track when the review being updated was recorded
# Script is part of effort to develop a chart showing how the average review changed as users updated their reviews throughout a single day.
from ..models import (
  Review, 
  ReviewHistory
)

def run():
  failed_update = []
  # Retreive all Review objects
  review_objects = Review.objects.all()
  # Iterate all review objects
  for review in review_objects:
    try:
      # Get all history objects from this review
      history: list[ReviewHistory] = list(review.history.all().order_by('id'))
      # Skip reviews with no history
      if(len(history) == 0):
        continue
      # Update the timestamp of the first object
      history[0].last_updated = review.review_date
      history[0].save()
      # Iterate review history objects, make the last_updated field equal to the recorded_at field of the previous object, to catch when each review was updated/submitted.
      for i in range(1, len(history)):
        history[i].last_updated = history[i-1].recorded_at
        history[i].save()
    except Exception as e:
      failed_update.append({"review": review.pk, "error": e})
  # Print out any failures
  print(f"\n\nFAILED:\n{failed_update}")