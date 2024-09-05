from django.http import HttpRequest, HttpResponse, JsonResponse

import logging
import os
import json

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

# Import Models
from todo.models import TodoItem

###
# Get all todo list items in database
###
def getAllToDo(request: HttpRequest):
  logger.info("getAllToDo called...")
  # Make sure request is a post request
  if(request.method != "GET"):
    logger.warning("getAllToDo called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Return todo data
  todoItemsQuerySet = TodoItem.objects.values()
  # Convert into a dict
  todoItems = list(todoItemsQuerySet)
  print(todoItems)
  # Get Options for DB to Human Readable conversion
  statusDict = dict(TodoItem.todo_status.field.choices)
  categoryDict = dict(TodoItem.todo_category.field.choices)
  # Perform replacements
  for elem in todoItems:
    elem['todo_status'] = statusDict[elem['todo_status']]
    elem['todo_category'] = categoryDict[elem['todo_category']]
  # Convert to json string
  todoItems = json.dumps(todoItems)
  # Return list of all todo items
  return HttpResponse(todoItems, content_type='text/json', status=200)

###
# Add a new todo item to the database
###
def createTodo(request: HttpRequest):
  logger.info("createTodo called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("createTodo called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Body data
  reqBody = json.loads(request.body)
  # Create todo item object and add the required objects
  item = TodoItem()
  item.todo_title = reqBody['title']
  if(('description' in reqBody.keys()) and (len(reqBody['description']) > 0)):
    item.todo_description = reqBody['description']
  if('category' in reqBody.keys()):
    item.todo_category = reqBody['category']
  # Save Item
  item.save()
  # Return list of all todo items
  return HttpResponse(status=200)

###
# Bulk add todo items from a raw list
###
def bulkCreateTodo(request: HttpRequest):
  logger.info("bulkCreateTodo called...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("bulkCreateTodo called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Body data
  itemList = list(eval(request.body))
  print(itemList)
  # Create todo item object and add the required objects
  for reqBody in itemList:
    item = TodoItem()
    item.todo_title = reqBody['title']
    if(('description' in reqBody.keys()) and (len(reqBody['description']) > 0)):
      item.todo_description = reqBody['description']
    if('category' in reqBody.keys()):
      item.todo_category = stringConvert(reqBody['category'])
    if('status' in reqBody.keys()):
      item.todo_status = stringConvert(reqBody['status'])
    # Save Item
    item.save()
  # Return list of all todo items
  return HttpResponse(status=200)

def stringConvert(inString):
  match inString:
    case "UI/UX":
      return "UI"
    case "Functionality":
      return "FN"
    case "CI/CD":
      return "CI"
    case "Data Engineering":
      return "DE"
    # Conversions for Status
    case "BACKLOG":
      return "BK"
    case "WIP":
      return "IP"
    case "DONE":
      return "DN"