from django.db import models

# Model for todo list items
class TodoItem(models.Model):
  # Title text for todo item
  todo_title = models.CharField(max_length=100) 
  # Description of todo item (optional)
  todo_description = models.TextField(
    default="No Description Provided",
  )
  # Status Choices
  TODO_STATUS_CHOICES = {
    "BK": "Backlog",
    "IP": "Work In Progress",
    "DN": "Done",
  }
  # Status of todo item
  todo_status = models.CharField(
    max_length=2,
    choices=TODO_STATUS_CHOICES,
    default="BK",
  )
  # Category Choices
  TODO_CATEGORY_CHOICES = {
    "FN": "Functionality",
    "UI": "User Interface/User Experience",
    "CI": "CI/CD",
    "DE": "Data Engineering"
  }
  # Category of todo item
  todo_category = models.CharField(
    max_length=2,
    choices=TODO_CATEGORY_CHOICES,
    default="FN",
  )
  # toString Method
  def __str__(self):
    return self.todo_title
