from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('getAllTodoItems', views.getAllToDo),
    path('createTodo', views.createTodo),
    path('bulkCreateTodo', views.bulkCreateTodo),
    path('getAllToDoChoices', views.getAllToDoChoices),
    path('updateTodo', views.updateTodo),
]
