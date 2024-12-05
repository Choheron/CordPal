from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  # Oauth URLS
  path('token', views.doSpotifyTokenSwap),
  path('connected', views.isSpotifyConnected),
  # Basic Spotify Interaction Endpoints
  path('getSpotifyData', views.getSpotifyData),
  path('getSpotifyUsersObj', views.getSpotifyUsersObj),
  path('getTopItems/<str:item_type>/<str:time_range>/<str:limit>/<str:offset>', views.getTopItems),
  # Album of the Day Endpoints
  path('spotifySearch/<str:item_type>/<str:query>/<str:limit>/<str:offset>', views.spotifySearch),
  path('checkIfAlbumAlreadyExists/<str:album_spotify_id>', views.checkIfAlbumAlreadyExists),
  path('submitReview', views.submitReview),
  path('getReviewsForAlbum/<str:album_spotify_id>', views.getReviewsForAlbum),
  path('getUserReviewForAlbum/<str:album_spotify_id>', views.getUserReviewForAlbum),
  path('submitAlbum', views.submitAlbum),
  path('getAlbum/<str:album_spotify_id>', views.getAlbum),
  path('getAllAlbums', views.getAllAlbums),
  path('getLastXAlbums/<int:count>', views.getLastXAlbums),
  path('getAlbumAvgRating/<str:album_spotify_id>', views.getAlbumAvgRating),
  # Below URL has two variations (one for lack of URL Param)
  path('getAlbumOfDay/<str:date>', views.getAlbumOfDay),
  path('getAlbumOfDay', views.getAlbumOfDay),
  # Statistics Endpoints
  path('getAlbumsStats', views.getAlbumsStats),
  path('getLowestHighestAlbumStats', views.getLowestHighestAlbumStats),
  # Command to be called by cronjob to set the album of the day
  path('setAlbumOfDay', views.setAlbumOfDay),
]
