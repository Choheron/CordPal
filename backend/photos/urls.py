from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('getAllImages/', views.getAllImages),
  path('image/<int:imageID>/', views.getImage),
  path('uploadImage/', views.uploadImage),
  path('getImageInfo/<int:imageID>/', views.getImageInfo),
  path('getImageIds/', views.getImageIds),
  path('getAllUploaders/', views.getAllUploaders),
  path('getAllArtists/', views.getAllArtists)
]
