from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('token', views.doSpotifyTokenSwap),
  path('connected', views.isSpotifyConnected),
  path('getSpotifyData', views.getSpotifyData),
  path('getTopItems/<str:item_type>/<str:time_range>/<str:limit>/<str:offset>', views.getTopItems),
]
