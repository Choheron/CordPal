from django.contrib import admin
from django.urls import path

from . import (
  views_aotd,
  views_review,
  views_album,
  views_user,
  views_oauth,
  views_outage
)

urlpatterns = [
  ## ============================================================================================================
  ## OAuth Views
  ## ============================================================================================================
  path('token', views_oauth.doSpotifyTokenSwap),
  path('connected', views_oauth.isSpotifyConnected),
  ## ============================================================================================================
  ## User Views
  ## ============================================================================================================
  path('getSpotifyData', views_user.getSpotifyData),
  path('getSpotifyUsersObj', views_user.getSpotifyUsersObj),
  path('getSpotifyUsersList', views_user.getSpotifyUsersList),
  path('getSpotifyUserCount', views_user.getSpotifyUserCount),
  path('getTopItems/<str:item_type>/<str:time_range>/<str:limit>/<str:offset>', views_user.getTopItems),
  path('spotifySearch/<str:item_type>/<str:query>/<str:limit>/<str:offset>', views_user.spotifySearch),
  path('getSelectionBlockedFlag', views_user.getSelectionBlockedFlag),
  ## ============================================================================================================
  ## Album Views
  ## ============================================================================================================
  path('checkIfAlbumAlreadyExists/<str:album_spotify_id>', views_album.checkIfAlbumAlreadyExists),
  path('submitAlbum', views_album.submitAlbum),
  path('deleteAlbum', views_album.deleteAlbum),
  path('getAlbum/<str:album_spotify_id>', views_album.getAlbum),
  path('getAllAlbums', views_album.getAllAlbums),
  path('getLastXAlbums/<int:count>', views_album.getLastXAlbums),
  # Below URL has three variations (for different URL params)
  path('getAlbumAvgRating/<str:album_spotify_id>/<str:rounded>/<str:date>', views_album.getAlbumAvgRating),
  path('getAlbumAvgRating/<str:album_spotify_id>/<str:rounded>', views_album.getAlbumAvgRating),
  path('getAlbumAvgRating/<str:album_spotify_id>', views_album.getAlbumAvgRating),
  # Below URL has two variations (one for lack of URL Param)
  path('checkIfUserCanSubmit/<str:date>', views_album.checkIfUserCanSubmit),
  path('checkIfUserCanSubmit', views_album.checkIfUserCanSubmit),
  # Statistics Endpoints
  path('getAlbumsStats', views_album.getAlbumsStats),
  path('getLowestHighestAlbumStats', views_album.getLowestHighestAlbumStats), 
  path('getSubmissionsByMonth/<str:year>/<str:month>', views_album.getSubmissionsByMonth),
  # Below URL has two variations (one for lack of URL Param)
  path('isUserAlbumUploader/<str:album_spotify_id>/<str:user_discord_id>', views_album.isUserAlbumUploader),
  path('isUserAlbumUploader/<str:album_spotify_id>', views_album.isUserAlbumUploader),
  ## ============================================================================================================
  ## Review Views
  ## ============================================================================================================
  path('submitReview', views_review.submitReview),
  # Below URL has two variations, one in which a date is provided and one where it isnt
  path('getReviewsForAlbum/<str:album_spotify_id>/<str:date>', views_review.getReviewsForAlbum),
  path('getReviewsForAlbum/<str:album_spotify_id>', views_review.getReviewsForAlbum),
  # Below URL has two variations, for lack of date provided
  path('getUserReviewForAlbum/<str:album_spotify_id>/<str:date>', views_review.getUserReviewForAlbum),
  path('getUserReviewForAlbum/<str:album_spotify_id>', views_review.getUserReviewForAlbum),
  path('getAllUserReviewStats', views_review.getAllUserReviewStats),
  path('getUserReviewStats/<str:user_discord_id>', views_review.getUserReviewStats),
  path('getSimilarReviewsForRatings', views_review.getSimilarReviewsForRatings),
  # Below URL has two variations, for lack of userID provided
  path('getAllUserReviews/<str:user_discord_id>', views_review.getAllUserReviews),
  path('getAllUserReviews', views_review.getAllUserReviews),
  path('getReviewStatsByMonth/<str:year>/<str:month>', views_review.getReviewStatsByMonth),
  path('submitReviewReaction', views_review.submitReviewReaction),
  path('deleteReviewReaction', views_review.deleteReviewReaction),
  path('getReviewByID/<int:id>', views_review.getReviewByID),
  path('getReviewHistoricalByID/<int:id>', views_review.getReviewHistoricalByID),
  ## ============================================================================================================
  ## Album Of the Day Views
  ## ============================================================================================================
  # Below URL has two variations (one for lack of URL Param)
  path('getAlbumOfDay/<str:date>', views_aotd.getAlbumOfDay),
  path('getAlbumOfDay', views_aotd.getAlbumOfDay),
  # Command to be called by cronjob to set the album of the day
  path('setAlbumOfDay', views_aotd.setAlbumOfDay),
  # Command to be called by cronjob to calculate selection chances on a cadence
  path('calculateAOTDChances', views_aotd.calculateAOTDChances),
  # ADMIN Command to be called by admin for special occasion album of the days
  path('setAlbumOfDayADMIN/<str:date>/<str:album_spotify_id>', views_aotd.setAlbumOfDayADMIN),
  # Return dates in which the passed in album was aotd
  path('getAotdDates/<str:album_spotify_id>', views_aotd.getAotdDates),
  # Below URL has two variations, one in which a date is provided and one where it isnt
  # Get chance a certian user's album will be picked given current conditions
  path('getChanceOfAotdSelect/<str:user_discord_id>', views_aotd.getChanceOfAotdSelect),
  path('getChanceOfAotdSelect', views_aotd.getChanceOfAotdSelect),
  # Get all AOtD Instances for a month
  path('getAOtDByMonth/<str:year>/<str:month>', views_aotd.getAOtDByMonth),
  # Get AOtD Rating Timeline
  path('getDayTimelineData/<str:aotd_date>', views_aotd.getDayTimelineData),
  ## ============================================================================================================
  ## User Selection Outage Views
  ## ============================================================================================================
  path('createOutage', views_outage.createOutage),
  path('deleteOutage', views_outage.deleteOutage),
  # Below URL has two variations (one for lack of URL Param)
  path('getUserOutages/<str:user_discord_id>', views_outage.getUserOutages),
  path('getUserOutages', views_outage.getUserOutages),
  path('getCurrentOutages', views_outage.getCurrentOutages),
  path('getOutagesByDate/<str:date>', views_outage.getOutagesByDate),
]
