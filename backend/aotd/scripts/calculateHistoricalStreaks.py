# This script is for a one time use to migrate AOTD data from spotify to the new AOTD backend as part of the great "Anti-Spotify" migration of June 2025
from datetime import datetime

from django.core.exceptions import ObjectDoesNotExist

from aotd.models import DailyAlbum, Review
from aotd.utils import update_user_streak


def run():
  # Retreive all aotd objects in order
  aotd_objects = DailyAlbum.objects.all().order_by('date')
  # Iterate aotd objects, get all reviews, set each reviewer's last listened date and then update review data
  index = 1
  for aotd in aotd_objects:
    print(f"Getting all Reviews for date {aotd.date.strftime('%Y-%m-%d')}: ({index}/{len(aotd_objects)})...")
    try:
      reviews = Review.objects.filter(album=aotd.album, aotd_date=aotd.date)
      for review in reviews:
        print(f"-- Currently checking user {review.user.nickname}'s review...")
        if(review.user.aotd_data.last_review_date == None):
          review.user.aotd_data.last_review_date = aotd.date
          review.user.aotd_data.save()
        streakValue = review.user.aotd_data.current_streak
        update_user_streak(review.user, aotd.date)
        if(streakValue != review.user.aotd_data.current_streak):
          print(f"---- Updated streak for user {review.user.nickname} to {review.user.aotd_data.current_streak}!")
    except Exception as e:
      print(f"\tERROR: {e}")
    # Increment Index
    index += 1