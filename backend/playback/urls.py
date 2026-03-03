from django.contrib import admin
from django.urls import path

from . import (
  views
)

urlpatterns = [
  path('generateCordpalPlayback', views.generateCordpalPlayback),
  # Below URL has two variations (for different URL params)
  path('getGlobalPlaybackData/<int:year>/<str:recalculate>', views.getGlobalPlaybackData),
  path('getGlobalPlaybackData/<int:year>', views.getGlobalPlaybackData),
  # Below URL has two variations (for different URL params)
  path('getUserPlaybackData/<int:year>/<str:user_discord_id>/<str:recalculate>', views.getUserPlaybackData),
  path('getUserPlaybackData/<int:year>/<str:user_discord_id>/', views.getUserPlaybackData),
  # Below URL has two variations (for different URL params)
  path('isPlaybackAvailable/<int:year>/<str:user_discord_id>', views.isPlaybackAvailable),
  path('isPlaybackAvailable/<int:year>', views.isPlaybackAvailable),
]
