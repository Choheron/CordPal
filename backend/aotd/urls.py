from django.contrib import admin
from django.urls import path

from . import (
  views
)

urlpatterns = [
  path('testAlbumData/<str:album_spotify_id>', views.testAlbumData),
]
