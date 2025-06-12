# This script is for a one time use to migrate AOTD data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.contenttypes.models import ContentType

from reactions.models import Reaction
from spotifyapi.models import Review as SpotReview
from aotd.models import Review


def run():
  failed_update = []
  # Retreive all Spotify Album objects
  spot_review_objects = SpotReview.objects.all()
  # Get content types
  old_review_ct = ContentType.objects.get_for_model(SpotReview)
  new_review_ct = ContentType.objects.get_for_model(Review)
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  for spot_review in spot_review_objects:
    print(f"Attempting to migrate reactions for review {index} out of {len(spot_review_objects)}")
    reaction_objects = spot_review.reactions.all()
    if(len(reaction_objects) == 0):
      print(f"\tReview has no reactions, skipping...")
      index += 1
      continue
    # Get corresponding new review
    new_review: Review = Review.objects.get(album__legacy_album=spot_review.album, user=spot_review.user, score=spot_review.score, review_date=spot_review.review_date)
    reaction: Reaction
    for reaction in reaction_objects:
      # Update reaction to point to the new review
      reaction.content_type = new_review_ct
      reaction.object_id = new_review.pk
      reaction.save()
    # Print confirm, inc index, cont
    print(f"Successfully migrated reactions")
    index += 1
    
    

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print(f"{len(failed_update)} Failed Migration")
  print("| Failed Date | Django PK | ERROR |")
  print("| -------------------- | ------------------ | -------------------- |")
  entry: SpotReview
  for entry in failed_update:
    print(f"| {entry[0].date} | {entry[0].pk} | {entry[1]} |")