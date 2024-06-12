from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('token', views.getDiscordToken),
    path('userData', views.getDiscordUserData),
    path('test1', views.testSessionStart),
    path('test2', views.testSessionEnd),
]
