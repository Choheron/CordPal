from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('getUserCount', views.getUserCount),
    path('getUserData', views.getUserData),
    path('getUserAvatarURL', views.getUserAvatarURL),
    path('updateUserData', views.updateUserData),
]
