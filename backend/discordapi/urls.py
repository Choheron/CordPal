from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('token', views.getDiscordToken),
    path('userData', views.getDiscordUserData),
    path('validateMember', views.validateServerMember)
]
