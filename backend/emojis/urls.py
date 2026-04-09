from django.urls import path
from . import views

urlpatterns = [
  path('list/', views.listEmojis),
  path('serve/<int:emoji_id>/', views.serveEmoji),
  path('upload/', views.uploadEmoji),
  path('recordUse/<int:emoji_id>/', views.recordEmojiUse),
  path('delete/<int:emoji_id>/', views.deleteEmoji),
  path('adminList/', views.adminListEmojis),
  path('updateMeta/<int:emoji_id>/', views.updateEmojiMeta),
]