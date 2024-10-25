from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('getUserCount', views.getUserCount),
    path('getUserList', views.getUserList),
    # Below URL has two variations (one for lack of URL Param)
    path('getUserData/<str:user_discord_id>', views.getUserData),
    path('getUserData', views.getUserData),
    # Below URL has two variations (one for lack of URL Param)
    path('getUserAvatarURL/<str:user_discord_id>', views.getUserAvatarURL),
    path('getUserAvatarURL', views.getUserAvatarURL),
    path('updateUserData', views.updateUserData),
]
