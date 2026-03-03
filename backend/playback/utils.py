from django.db.models import QuerySet, Count, Avg, StdDev, Q, F

import datetime

# Model imports from other apps
from photos.models import Image
from users.models import User
from quotes.models import Quote
from reactions.models import Reaction
from aotd.models import (
  Album,
  Review,
  ReviewHistory,
  DailyAlbum,
  AotdUserData
)
from .models import (
  GlobalPlayback,
  UserPlayback
)

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


def generateGlobalPlayback(year: int):
  '''
  Generate and store "CordPal Playback" data for the site-wide statistics given a year
  '''
  # Begin the process of calculating site wide statistics
  playbackData = {}
  start_datetime = datetime.datetime(year, 1, 1)
  end_datetime = datetime.datetime(year, 12, 31, 23, 59, 59)
  ###
  # Review Stats
  ###
  reviewStats = {}
  reviews = Review.objects.filter(aotd_date__range=(start_datetime.date(), end_datetime.date()))
  review_edits = ReviewHistory.objects.filter(aotd_date__range=(start_datetime.date(), end_datetime.date()))
  reviewStats['total_reviews'] = len(reviews)
  sub_leaderboard = list(
    reviews.values('user', 'user__discord_id') \
    .annotate(total_reviews=Count('pk')) \
    .order_by("-total_reviews")
  ) 
  # Update submission leaderboard with longest streak data
  for row in sub_leaderboard:
    user_id = row['user']
    user_reviews = reviews.filter(user=user_id)
    row['longest_review_streak'] = calculateLongestUserReviewStreak(user_reviews)[1]
  reviewStats['total_reviews_leaderboard'] = sub_leaderboard # Submission Leaderboard
  reviewStats['most_review_edits'] = reviews.values("review__user__discord_id").annotate(average_length=Count("pk")).order_by("-total_edits").first() # Most Reviews Edited - The Thinker
  reviewStats['least_review_edits'] = review_edits.values("review__user__discord_id").annotate(total_edits=Count("pk")).order_by("-total_edits").last() # Least Reviews Edited - Set In Stone
  reviewStats['average_rating_leaderboard'] = list(reviews.values('user', 'user__discord_id').annotate(average_score_given=Avg('score')).order_by("-average_score_given"))
  reviewStats['highest_average'] = reviewStats['average_rating_leaderboard'][0] # Most Generous Reviewer - Biggest Lover
  reviewStats['lowest_average'] = reviewStats['average_rating_leaderboard'][-1] # Harshest Reviewer - Biggest Hater
  reviewStats['stddev_leaderboard'] = list(reviews.values('user', 'user__discord_id').annotate(review_score_std=StdDev('score')).order_by("-review_score_std"))
  reviewStats['lowest_stddev'] = reviewStats['stddev_leaderboard'][-1] # Lowest standard deviation - Ol' Reliable
  reviewStats['highest_stddev'] = reviewStats['stddev_leaderboard'][0] # Highest Standard Deviation - Mr. Opinionated
  # Store Review Data
  playbackData['reviews'] = reviewStats
  ###
  # Review Reaction Stats
  ### 
  reactionStats = {}
  reactions: QuerySet[Reaction] = Reaction.objects.filter(content_type__model="review").filter(creation_timestamp__range=(start_datetime, end_datetime)) 
  reactionStats['total_reactions'] = reactions.count()
  if(reactions.count() != 0):
    reactionStats['total_reactions_leaderboard'] = list(reactions.values("user", "user__discord_id").annotate(total_reactions=Count("pk")).order_by("-total_reactions")) # User Reaction Leaderboard
    reactionStats['react_leaderboard'] = list(reactions.values("emoji", "custom_emoji").annotate(total_reactions=Count("pk")).order_by("-total_reactions"))[:10] # 10 Most Common Reaction Site-Wide
    reactionStats['most_reactions_given'] = reactionStats['total_reactions_leaderboard'][0] # Most Reactions Given - Emoji Enthusiast
    reactionStats['most_reactions_received'] = reviews.values("user", "user__discord_id").annotate(total_reactions=Count("reactions")).order_by("-total_reactions").first() # Most Reactions Received - Crowd Pleaser
    reactionStats['most_reacted_review'] = reviews \
      .annotate(distinct_reactors=Count("reactions__user__pk", distinct=True)) \
      .annotate(total_reactions=Count("reactions")) \
      .order_by("-distinct_reactors", "-total_reactions") \
      .first().toJSON() # Most Popular Review (Review with the most reactions from different users) - Reaction Farmer Review
    # Store Reaction Data
    playbackData['review_reactions'] = reactionStats
  ###
  # AOTD Stats
  ###
  albumStats = {}
  submissions: QuerySet[Album] = Album.objects.filter(submission_date__range=(start_datetime, end_datetime))
  selections: QuerySet[DailyAlbum] = DailyAlbum.objects.filter(date__range=(start_datetime, end_datetime)).exclude(rating=11).exclude(rating=None) # All Selected Albums (Excluding ones with no reviews)
  albumStats['total_submissions'] = len(submissions)
  albumStats['total_selections'] = len(selections)
  albumStats['total_submissions_leaderboard'] = list(submissions.values("submitted_by__discord_id").annotate(submission_count=Count("pk")).order_by("-submission_count")) # Submission Leaderboard
  albumStats['total_selections_leaderboard'] = list(selections.values("album__submitted_by__discord_id").annotate(selection_count=Count("pk")).order_by("-selection_count")) # Selection Leaderboard
  # Subquery for ordering album scoring by review count and score
  album_rating_qs = selections.values("pk", "album__mbid", "rating") \
    .annotate(
      review_count=Count(
        "album__reviews",
        filter=Q(album__reviews__aotd_date=F("date")),
        distinct=True
      )
    ) \
    .order_by("-rating", "-review_count")
  albumStats['highest_rated_album'] = album_rating_qs.first() | {"date": DailyAlbum.objects.get(pk=album_rating_qs.first()['pk']).dateToCalString()}  # Highest Rated Album of the Year - Most Loved (Tie broken by review count)
  albumStats['lowest_rated_album'] = album_rating_qs.last() | {"date": DailyAlbum.objects.get(pk=album_rating_qs.last()['pk']).dateToCalString()} # Lowest Rated Album of the Year - Host Hated (Tie broken by review count)
  # Subquery for ordering album standard deviation by review count and score
  album_stddev_qs = selections.values("pk", "album__mbid", "standard_deviation", "rating") \
    .annotate(
      review_count=Count(
        "album__reviews",
        filter=Q(album__reviews__aotd_date=F("date")),
        distinct=True
      )
    ) \
    .order_by("-standard_deviation", "-review_count")
  albumStats['highest_stddev_album'] = album_stddev_qs.first() | {"date": DailyAlbum.objects.get(pk=album_stddev_qs.first()['pk']).dateToCalString()}  # Most controversial album (highest standard deviation) - Most Controversial (Tie broken by review count)
  albumStats['lowest_stddev_album'] = album_stddev_qs.last() | {"date": DailyAlbum.objects.get(pk=album_stddev_qs.last()['pk']).dateToCalString()} # Least controversial album (lowest standard deviation) - Most Controversial (Tie broken by review count)
  # Store AOTD Stats
  playbackData['aotd'] = albumStats
  ###
  # Photo Stats
  ###
  photoStats = {}
  photos: QuerySet[Image] = Image.objects.filter(upload_timestamp__range=(start_datetime, end_datetime))
  photoStats['total_submissions'] = len(photos)
  photoStats['total_submissions_leaderboards'] = list(photos.values("uploader", "uploader__discord_id").annotate(upload_count=Count("pk")).order_by("-upload_count")) # Uploader Leaderboard
  photoStats['most_tagged_user'] = User.objects.values("pk", "discord_id").annotate(tagged_count=Count("images_tagged_in")).order_by("-tagged_count").first() # Most Tagged User - The Muse
  photoStats['most_artist_user'] = User.objects.values("pk", "discord_id").annotate(artist_count=Count("created_images")).order_by("-artist_count").first() # User Who was Artist the Most - The Artist
  # Store Photo Stats
  playbackData['photos'] = photoStats
  ###
  # Quote Stats
  ###
  quoteStats = {}
  quotes: QuerySet[Quote] = Quote.objects.filter(timestamp__range=(start_datetime, end_datetime))
  quoteStats = {}
  quoteStats['total_submitted'] = len(quotes)
  if(len(quotes) > 0):
    quoteStats['quoted_leaderboards'] = list(quotes.values("speaker", "speaker__discord_id").annotate(total_quotes=Count("pk")).order_by("-total_quotes"))
    quoteStats['most_quoted_user'] = quoteStats['quoted_leaderboards'][0] # Most Quoted User - Public Speaker
    quoteStats['quote_submission_leaderboards'] = list(quotes.values("submitter", "submitter__discord_id").annotate(total_submissions=Count("pk")).order_by("-total_submissions"))
    quoteStats['most_quote_submissions'] = quoteStats['quote_submission_leaderboards'][0] # User who submitted the most quotes - Court Stenographer
  # Store Quote Stats
  playbackData['quotes'] = quoteStats
  # Store playback data in database
  globalPlaybackObj = GlobalPlayback(
    year=year,
    payload=playbackData
  )
  globalPlaybackObj.save()
  # Return updated data
  return globalPlaybackObj.toJSON()


def generateUserPlayback(year: int, userId: str):
  '''
  Generate and store "CordPal Playback" data for the user specific statistics given a year and a user id.
  '''
  # Retreive user data
  user: User = User.objects.get(pk=userId)
  aotd_user: AotdUserData = user.aotd_data
  # Begin the process of calculating user statistics
  playbackData = {}
  start_datetime = datetime.datetime(year, 1, 1)
  end_datetime = datetime.datetime(year, 12, 31, 23, 59, 59)
  ###
  # Review Stats
  ###
  reviewStats = {}
  # Retrieve all reviews this year
  allReviews = Review.objects.all().filter(aotd_date__range=(start_datetime.date(), end_datetime.date()))
  # Retreive reviews from this user this year
  reviews: QuerySet[Review] = user.aotd_reviews.filter(aotd_date__range=(start_datetime.date(), end_datetime.date())) 
  # Retrieve reactions from this user this year
  reactions: QuerySet[Reaction] = Reaction.objects.filter(content_type__model="review").filter(user=user).filter(creation_timestamp__range=(start_datetime, end_datetime)) 
  # Build out stats
  reviewStats['total_reviews'] = len(reviews) # Total count of reviews
  reviewStats['avg_review_score'] = reviews.aggregate(Avg("score", default=0))['score__avg'] # User's average review score
  reviewStats['stddev_review_score'] = reviews.aggregate(StdDev("score", default=0))['score__stddev'] # User's standard deviation review score
  longest_streak = calculateLongestUserReviewStreak(reviews)
  reviewStats['longest_review_streak'] = { # Longest Review Streak
    "start_date": longest_streak[0].strftime("%d/%m/%Y"),
    "length": longest_streak[1],
    "end_date": longest_streak[2].strftime("%d/%m/%Y")
  }
  reviewStats['total_first_time_listens'] = reviews.filter(first_listen=True).count()
  reviewStats['most_reacted_review'] = reviews.annotate(react_count=Count("reactions")).order_by("-react_count")[0].toJSON() # Review with the most reactions
  if(len(reactions) > 0):
    reviewStats['most_used_reaction'] = reactions.values("emoji", "custom_emoji").annotate(total=Count("id")).order_by("-total").first() # User's most used reaction
  # Place review stats into overall stat tracking
  playbackData['reviews'] = reviewStats
  ###
  # AOTD Stats
  ###
  albumStats = {}
  # Albums submitted by user this year
  submittedAlbums: QuerySet[Album] = user.submitted_albums.filter(submission_date__range=(start_datetime, end_datetime))
  # AOTDs selected from user this year 
  selectedAlbums: QuerySet[DailyAlbum] = DailyAlbum.objects.filter(date__range=(start_datetime.date(), end_datetime.date())).filter(album__submitted_by=user)
  # Build out stats
  albumStats['total_submitted'] = len(submittedAlbums) # Total album submissions
  albumStats['total_selected'] = len(selectedAlbums) # Total album selections
  albumStats['personal_celeb_list'] = list(
    reviews.values('album__submitted_by__pk', 'album__submitted_by__nickname') \
      .annotate(avg_score=Avg('score')) \
      .order_by('-avg_score') # Get this user's personal celeb list
  )[:4]
  if(len(selectedAlbums) > 0):
    albumStats['highest_rated_aotd'] = selectedAlbums.exclude(rating=11).exclude(rating=None).order_by("-rating", "-date")[0].toJSON(include_raw_album=False) # Highest Rated AOTD Selection
    albumStats['lowest_rated_aotd'] = selectedAlbums.exclude(rating=11).exclude(rating=None).order_by("rating")[0].toJSON(include_raw_album=False) # Lowest Rated AOTD Selection
    albumStats['highest_std'] = selectedAlbums.exclude(rating=11).exclude(standard_deviation=None).order_by("-standard_deviation")[0].toJSON(include_raw_album=False) # Most Controvertial AOTD Selection
    # Get the user who rated your albums highest on average
    albumStats['biggest_fan_list'] = list(
      allReviews.filter(album__submitted_by=user) \
        .exclude(user=user) \
        .values('user__pk', 'user__nickname') \
        .annotate(avg_score=Avg('score')) \
        .order_by('-avg_score') # Get this user's biggest fan list (not including themselves)
    )[:4]
  # Place aotd stats into overall stat tracking
  playbackData['aotd'] = albumStats
  ###
  # Photo Stats
  ###
  photoStats = {}
  # Build out Photo Stats
  photoStats['total_submitted'] = len(user.uploaded_images.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  photoStats['total_artist_of'] = len(user.created_images.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  photoStats['tagged_in'] = len(user.images_tagged_in.filter(upload_timestamp__range=(start_datetime, end_datetime)))
  # Place photo stats into overall stat tracking
  playbackData['photos'] = photoStats
  ###
  # Quote Stats
  ###
  quoteStats = {}
  # Build out Photo Stats
  quoteStats['total_submitted'] = len(user.quotes_submitted.filter(timestamp__range=(start_datetime, end_datetime)))
  quoteStats['total_quoted'] = len(user.quotes.filter(timestamp__range=(start_datetime, end_datetime)))
  # Place aotd stats into overall stat tracking
  playbackData['quotes'] = quoteStats
  # Store playback data in database
  userPlaybackObj = UserPlayback(
    aotd_user=aotd_user,
    year=year,
    payload=playbackData
  )
  userPlaybackObj.save()
  # Return updated data
  return userPlaybackObj.toJSON()