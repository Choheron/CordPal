# This script is only to be run once to populate the "aotd_date" field added to Reviews
# Script is part of effort to prepare system for an album being chosen more than once as Album Of the Day
import pytz
from ..models import (
  Review, 
  ReviewHistory,
  DailyAlbum
)

def run():
  failed_update = []
  # Retreive all Review objects
  review_objects = Review.objects.all()
  # Iterate through all review objects and search album to determine date
  for review in review_objects:
    # Determine album
    album = review.album
    # Determine aotd date (cut off time from date)
    tz = pytz.timezone('America/Chicago')
    review_date = review.review_date.astimezone(tz).date()
    # Verify that date is correct by checking DailyAlbum table
    verification_aotd = DailyAlbum.objects.get(album=album)
    if(verification_aotd.date != review_date):
      print(f"ERROR: Incorrect date found for album of the day!\n\tReview ID/Date/Album: {review.pk}/{review_date}/{review.album.title}\n\tAOtD ID/Date/Album: {verification_aotd.pk}/{verification_aotd.date}/{verification_aotd.album.title}")
      failed_update.append({"Review ID/Date/Album": {review.pk}/{review_date}/{review.album.title}, "AOtD ID/Date/Album": {verification_aotd.pk}/{verification_aotd.date}/{verification_aotd.album.title}})
    # Update Review field with album of the day date
    print(f"SUCCESS: Setting AOtD ID/Date of {verification_aotd.pk}/{verification_aotd.date} for review ID/submitter/album: {review.pk}/{review.user.nickname}/{review.album.title}...")
    review.aotd_date = verification_aotd.date
    # Save Review
    review.save()

  # Retreive all HISTORICAL Review objects
  review_objects = ReviewHistory.objects.all()
  # Iterate through all HISTORICAL review objects and search album to determine date
  for review in review_objects:
    # Determine album
    album = review.review.album
    # Determine aotd date (cut off time from date)
    tz = pytz.timezone('America/Chicago')
    review_date = review.review_date.astimezone(tz).date()
    # Verify that date is correct by checking DailyAlbum table
    verification_aotd = DailyAlbum.objects.get(album=album)
    if(verification_aotd.date != review_date):
      print(f"ERROR: HISTORICAL - Incorrect date found for album of the day!\n\tReview ID/Date/Album: {review.pk}/{review_date}/{review.review.album.title}\n\tAOtD ID/Date/Album: {verification_aotd.pk}/{verification_aotd.date}/{verification_aotd.album.title}")
      failed_update.append({"Review ID/Date/Album": {review.pk}/{review_date}/{review.review.album.title}, "AOtD ID/Date/Album": {verification_aotd.pk}/{verification_aotd.date}/{verification_aotd.album.title}})
    # Update Review field with album of the day date
    print(f"SUCCESS: Setting HISTORICAL AOtD ID/Date of {verification_aotd.pk}/{verification_aotd.date} for review ID/submitter/album: {review.review.pk}/{review.review.user.nickname}/{review.review.album.title}...")
    review.aotd_date = verification_aotd.date
    # Save Review
    review.save()
    
    # Print out failed albums from update
    print(failed_update)