from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
  path('submitQuote', views.submitQuote),
  path('getAllQuotesList/<str:sortMethod>', views.getAllQuotesList),
  path('getUserSpokenQuotes/<int:user_guid>', views.getUserSpokenQuotes),
  path('getAllQuotesLegacy', views.getAllQuotesLegacy),
]
