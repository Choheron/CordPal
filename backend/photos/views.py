from django.http import HttpRequest, HttpResponse, FileResponse, JsonResponse
from django.core.files.storage import FileSystemStorage

import logging
import os
import uuid
import json


from .models import Image
from users.models import User

# Declare logging
logger = logging.getLogger('django')

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'

###
# Get all Image items in database
###
def getAllImages(request: HttpRequest):
  logger.info("getAllImages called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllImages called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Iterate and retreieve image IDs
  imageList = list(Image.objects.all().values_list('image_id', flat=True))
  # Return dict response
  out = {}
  out['ids'] = ','.join(map(str, imageList))
  return JsonResponse(out)

###
# Add an upload an image to the database
###
def uploadImage(request: HttpRequest):
  logger.info("uploadImage called...")
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("uploadImage called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Take in form data to local vars
  img_title = request.POST.get('title')
  img_description = request.POST.get('description')
  img_tagged_users = request.POST.get('tagged_users')
  img_creator = request.POST.get('creator')
  img_image_binary = request.FILES['attached_image']
  img_filename = request.POST.get('filename')
  img_filetype = request.POST.get('filetype')
  # Retrieve additional needed data for DB field (Handle lack of provided image creator)
  if(img_creator != ""):
    img_creator = User.objects.get(discord_id = img_creator)
  else:
    img_creator = None
  img_uploader = User.objects.get(discord_id = request.session['discord_id'])
  # Generate list of tagged users (Only populate if not empty)
  img_tagged_users_list = []
  if(img_tagged_users != ""):
    for userID in img_tagged_users.split(","):
      img_tagged_users_list.append(User.objects.get(discord_id = userID))
  # Generate new filename
  img_filename = uuid.uuid4().hex + "_" + img_filename
  # Create new image object
  imageDB_entry = Image(
    title = img_title,
    description = img_description if img_description != "" else "No description provided.",
    uploader = img_uploader,
    artist = img_creator,
    filename = img_filename,
    filetype = img_filetype
  )
  # Write out image to filesystem
  write_path = os.getenv('PHOTOSHOP_PATH') + img_filename
  logger.info(f"Attempting to write out image to {write_path}...")
  try:
    file_storage = FileSystemStorage(location=os.path.dirname(write_path))
    file_storage.save(img_filename, img_image_binary)
  except:
    logger.exception("UNABLE TO WRITE IMAGE TO BACKEND!")
    error_res = HttpResponse("Writing image to backend filesystem failed.")
    error_res.status_code = 500
    return error_res
  # Save image data into database
  imageDB_entry.save()
  # Retrieve new image from DB
  image_obj = Image.objects.get(filename = img_filename)
  # Add Tagged Users
  image_obj.tagged_users.add(*img_tagged_users_list)
  # Save Image
  image_obj.save()
  # Return 200
  return HttpResponse(200)


###
# Return all data about an image in json format via imageID
###
def getImageInfo(request: HttpRequest, imageID: int):
  logger.info(f"getImageInfo called with id: {imageID}...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getImageInfo called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Make sure the request included an imageID
  if(not imageID):
    logger.warning("getImageInfo called without an imageID.")
    res = HttpResponse("Missing Image ID")
    res.status_code = 422 
    return res
  # Retrieve image data from the database
  image = Image.objects.get(image_id=imageID)
  # Create out dict
  imageData = {}
  # Populate Out Dict
  imageData['image_id'] = image.image_id
  imageData['title'] = image.title
  imageData['description'] = image.description
  imageData['upload_timestamp'] = image.upload_timestamp.strftime("%m/%d/%Y, %H:%M:%S")
  imageData['uploader'] = image.uploader.discord_id
  imageData['creator'] = image.artist.discord_id
  imageData['filename'] = image.filename[(image.filename.index("_") + 1):] # Remove hex in front for readability
  imageData['tagged_users'] = []
  # Get list of discord IDs
  for user in image.tagged_users.all():
    imageData['tagged_users'].append(user.discord_id)
  # Return json
  return JsonResponse(imageData)


###
# Return an image based on an image id
###
def getImage(request: HttpRequest, imageID: int):
  logger.info(f"getImage called with id: {imageID}...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getImage called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Make sure the request included an imageID
  if(not imageID):
    logger.warning("getImage called without an imageID.")
    res = HttpResponse("Missing Image ID")
    res.status_code = 422 
    return res
  # Retrieve filename from database
  fileName = Image.objects.get(image_id=imageID).filename
  return FileResponse(open(f"{os.getenv('PHOTOSHOP_PATH')}{fileName}", "rb"))


###
# Return a filtered list of image IDs based on passed in body params
# Expected Body Filtering Options:
# - tagged: List of User Nicknames
# - uploader: Single User Nickname
# - artist: Single User Nickname
###
def getImageIds(request: HttpRequest):
  # Read Request Body
  body_params = json.loads(request.body)
  logger.info(f"getImageIds called with following filters: {body_params}...")
  # Make sure request is a post request
  if(request.method != "POST"):
    logger.warning("getImageIds called with a non-POST method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get all objects
  imageQuery = Image.objects.all()
  # Retrieve data from request body and filter
  if(body_params["tagged"] != 'undefined'): # NOTE: Tagged users current doesnt work
    for nick in body_params['tagged']:
      imageQuery = imageQuery.filter(tagged_users__nickname=nick)
  if(body_params["uploader"] != 'undefined'):
    imageQuery = imageQuery.filter(uploader__nickname=body_params['uploader'])
  if(body_params["artist"] != 'undefined'):
    imageQuery = imageQuery.filter(artist__nickname=body_params['artist'])
  # Declare and populate outstring
  outstring = ""
  for image in imageQuery:
    outstring += f"{image.image_id},"
  return JsonResponse({"imageIds": outstring})


###
# Return a list of all discord User IDs that have submitted photoshops
###
def getAllUploaders(request: HttpRequest):
  logger.info(f"getAllUploaders called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllUploaders called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get distinct uploaders
  uploaders = Image.objects.all().values("uploader").distinct()
  # Iterate through uploaders and create list of discord IDs
  out = []
  for uploader in uploaders:
    uploader_obj = User.objects.get(pk=uploader['uploader'])
    tempDict = {}
    tempDict['discord_id'] = uploader_obj.discord_id
    tempDict['avatar_url'] = uploader_obj.get_avatar_url()
    tempDict['nickname'] = uploader_obj.nickname
    # Store tempDict in out json
    out.append(tempDict)
  return JsonResponse({"uploaders": out})


###
# Return a list of all discord User IDs that have been marked as artists
###
def getAllArtists(request: HttpRequest):
  logger.info(f"getAllArtists called...")
  # Make sure request is a get request
  if(request.method != "GET"):
    logger.warning("getAllArtists called with a non-GET method, returning 405.")
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get distinct artists
  artists = Image.objects.all().values("artist").distinct()
  # Iterate through artists and create list of discord IDs
  out = []
  for artist in artists:
    artist_obj = User.objects.get(pk=artist['artist'])
    tempDict = {}
    tempDict['discord_id'] = artist_obj.discord_id
    tempDict['avatar_url'] = artist_obj.get_avatar_url()
    tempDict['nickname'] = artist_obj.nickname
    # Store tempDict in out json
    out.append(tempDict)
  return JsonResponse({"artists": out})