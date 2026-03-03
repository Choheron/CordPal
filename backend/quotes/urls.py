from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('submitQuote', views.submitQuote),
  path('getAllQuotesList/<str:sortMethod>', views.getAllQuotesList),
  path('getUserSpokenQuotes/<str:user_discord_id>', views.getUserSpokenQuotes),
  path('getAllQuotesLegacy', views.getAllQuotesLegacy),
]
