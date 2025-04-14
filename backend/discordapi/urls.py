from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('token', views.getDiscordToken),
  path('validateMember', views.validateServerMember),
  path('userData', views.getDiscordUserData),
  path('checkToken', views.checkIfPrevAuth),
  path('logout', views.revokeDiscordToken),
  path('getEmojiList', views.getEmojiList),
]
