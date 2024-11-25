from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('token', views.doSpotifyTokenSwap),
  path('connected', views.isSpotifyConnected),
  path('getSpotifyData', views.getSpotifyData),
  path('getSpotifyUsersObj', views.getSpotifyUsersObj),
  path('getTopItems/<str:item_type>/<str:time_range>/<str:limit>/<str:offset>', views.getTopItems),
  path('spotifySearch/<str:item_type>/<str:query>/<str:limit>/<str:offset>', views.spotifySearch),
  path('checkIfAlbumAlreadyExists/<str:album_spotify_id>', views.checkIfAlbumAlreadyExists),
  path('submitReview', views.submitReview),
  path('getReviewsForAlbum/<str:album_spotify_id>', views.getReviewsForAlbum),
  path('submitAlbum', views.submitAlbum),
  path('getAlbum/<str:album_spotify_id>', views.getAlbum),
  # Below URL has two variations (one for lack of URL Param)
  path('getAlbumOfDay/<str:date>', views.getAlbumOfDay),
  path('getAlbumOfDay', views.getAlbumOfDay),
]
