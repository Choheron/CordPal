from django.db.models import QuerySet

import datetime

from aotd.models import Review

def calculateLongestUserReviewStreak(reviews: QuerySet[Review]) -> tuple[datetime.date, int, datetime.date]:
  '''
  Iterate over the passed in reviews QuerySet, after ordering by date, return longest streak dates and count.
  
  :param reviews: Queryset containing reviews
  :type reviews: QuerySet[Review]
  :return: Tuple containing the following (Start Date, Streak Length, End Date)
  :rtype: tuple[date, int, date]
  '''
  # Return default tuple value if list is empty
  if(len(reviews) == 0):
    return (datetime.date(2000,1,1), 0, datetime.date(2000,1,1))
  # Order review by date (ascending)
  reviews = reviews.order_by("aotd_date")
  # Get first date of review and set tracking vars
  current_streak = (reviews[0].aotd_date, 1, reviews[0].aotd_date)
  longest_streak = current_streak
  current_date = reviews[0].aotd_date
  # Iterate reviews and track longest review streak
  for review in reviews[1:]:
    # Get the next days date
    next_day = current_date + datetime.timedelta(days=1)
    # Check if review is on the right time
    if(review.aotd_date == next_day):
      # If date is the next one, increment streak tracking
      current_streak = (current_streak[0], current_streak[1] + 1, next_day)
    else:
      # If streak is not continuing, check if recent streak was longest streak and handle
      if(current_streak[1] > longest_streak[1]):
        longest_streak = current_streak
      # Reset current streak
      current_streak = (review.aotd_date, 1, review.aotd_date)
    # Set current date to this review's aotd_date
    current_date = review.aotd_date
  # Check if the currently going streak is the longest
  if current_streak[1] > longest_streak[1]:
    longest_streak = current_streak
  # Return longest streak data
  return longest_streak