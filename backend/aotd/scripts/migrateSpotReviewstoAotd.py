# This script is for a one time use to migrate Review and ReviewHistory data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist

from spotifyapi.models import Review as SpotReview
from spotifyapi.models import ReviewHistory as SpotReviewHistory
from aotd.models import Review, Album, ReviewHistory


def run():
  failed_update = []
  # Retreive all Spotify Album objects
  spot_review_objects = SpotReview.objects.all().order_by('aotd_date')
  # Iterate album objects and create a new Album Object in AOTD (sleep for 1 second after to avoid rate limiting)
  index = 1
  for spot_review in spot_review_objects:
    print(f"Attempting to migrate review: {spot_review.pk} ({index}/{len(spot_review_objects)})...")
    try:
      # Get new version of album
      newAlbum = Album.objects.get(mbid=spot_review.album.mbid)
      try:
        newReview = Review.objects.get(review_date=spot_review.review_date, user=spot_review.user)
      except ObjectDoesNotExist:
        # Migrate Review
        newReview = Review(
          album=newAlbum,
          user=spot_review.user,
          score=spot_review.score,
          review_text=spot_review.review_text,
          review_date=spot_review.review_date,
          last_updated=spot_review.last_updated,
          first_listen=spot_review.first_listen,
          aotd_date=spot_review.aotd_date,
          version=spot_review.version
        )
        newReview.save()
        # Migrate review History
        spot_review_history = SpotReviewHistory.objects.filter(review=spot_review)
        for spot_hist in spot_review_history:
          newHistory = ReviewHistory(
            review=newReview,
            score=spot_hist.score,
            review_text=spot_hist.review_text,
            review_date=spot_hist.review_date,
            first_listen=spot_hist.first_listen,
            last_updated=spot_hist.last_updated,
            aotd_date=spot_hist.aotd_date,
            version=spot_hist.version,
            recorded_at=spot_hist.recorded_at
          )
          newHistory.save()
    except Exception as e:
      print(f"\tFAILED TO MIGRATE FOR: {spot_review.pk}")
      print(f"\tERROR: {e}")
      failed_update.append((spot_review, e))
    # Increment Index
    index += 1

  # Exit if successful
  if(len(failed_update) == 0):
    exit(0)
  
  # Print out failed albums from update
  print(f"{len(failed_update)} Failed Migration")
  print("| Django PK | ERROR |")
  print("| ------------------ | -------------------- |")
  entry: SpotReview
  for entry in failed_update:
    print(f"| {entry[0].pk} | {entry[1]} |")