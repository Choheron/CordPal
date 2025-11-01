from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('getUserCount', views.getUserCount),
    path('getUserList', views.getUserList),
    path('updateUserData', views.updateUserData),
    path('isOnline/<str:user_discord_id>', views.isOnline),
    path('getAllOnlineData', views.getAllOnlineData),
    # Below URL has two variations (one for lack of URL Param)
    path('getUserData/<str:user_discord_id>', views.getUserData),
    path('getUserData', views.getUserData),
    # Below URL has two variations (one for lack of URL Param)
    path('getUserAvatarURL/<str:user_discord_id>', views.getUserAvatarURL),
    path('getUserAvatarURL', views.getUserAvatarURL),
    # Below URL has two variations (one for lack of URL Param)
    path('isUserAdmin/<str:user_discord_id>', views.isUserAdmin),
    path('isUserAdmin', views.isUserAdmin),
    path('getUsersByTimezone', views.getUsersByTimezone),
    # Heartbeat url to determine online status
    path('heartbeat', views.heartbeat),
    path('isFieldUnique', views.isFieldUnique),
    # Below URL has two variations (one for lack of URL Param)
    path('getLoginMethods/<str:user_discord_id>', views.getLoginMethods),
    path('getLoginMethods', views.getLoginMethods),
    path('getPasswordValidators', views.getPasswordValidators),
    path('updateUserPassword', views.updateUserPassword),
    path('traditionalLogin', views.traditionalLogin),
    # ===========================
    # USER ACTIONS URLS
    # ===========================
    path('getRecentUserActions', views.getRecentUserActions)
]
