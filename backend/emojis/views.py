from django.http import HttpRequest, HttpResponse, FileResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import FileSystemStorage
from django.db.models import F

import json
import logging
import os
import re
import uuid
from dotenv import load_dotenv

from .models import CustomEmoji
from users.utils import getUserObj

# Declare logging
logger = logging.getLogger()

# Determine runtime environment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV == "PROD" else ".env.local")

# Allowed MIME types for emoji uploads
ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/gif', 'image/webp'}
# Max file size for an emoji upload (256 KB)
MAX_EMOJI_SIZE_BYTES = 256 * 1024
# Valid slug pattern — lowercase letters, digits, and underscores only
SLUG_PATTERN = re.compile(r'^[a-z0-9_]+$')


###
# Return the full list of active custom emojis in emoji-mart custom format.
# Used by the frontend emoji picker to dynamically populate the Custom category.
###
def listEmojis(request: HttpRequest):
  # Make sure request is a GET request
  if request.method != 'GET':
    logger.warning("listEmojis called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve all active emojis ordered by name
  emojis = CustomEmoji.objects.filter(is_active=True)
  # Build base URL once outside the loop
  backend_base = (os.getenv('BACKEND_BASE_URL') or '').rstrip('/')
  # Build emoji-mart compatible emoji list
  out = []
  for emoji in emojis:
    out.append({
      'id': emoji.name,
      'emoji_id': emoji.emoji_id,
      'name': emoji.display_name or emoji.name,
      'keywords': emoji.keywords,
      'skins': [{'src': f'{backend_base}/emojis/serve/{emoji.emoji_id}/'}],
    })
  return JsonResponse({'emojis': out})


###
# Stream the image file for a given emoji.
# No auth required — emoji images are served as static-like assets.
###
def serveEmoji(request: HttpRequest, emoji_id: int):
  # Make sure request is a GET request
  if request.method != 'GET':
    logger.warning("serveEmoji called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve the emoji record
  try:
    emoji = CustomEmoji.objects.get(emoji_id=emoji_id, is_active=True)
  except ObjectDoesNotExist:
    logger.warning(f"serveEmoji could not find active emoji with id={emoji_id}.", extra={'crid': request.crid})
    res = HttpResponse("Emoji not found")
    res.status_code = 404
    return res
  # Build path and stream file
  file_path = os.path.join(os.getenv('EMOJI_PATH'), emoji.filename)
  logger.info(f"Serving emoji file: {file_path}", extra={'crid': request.crid})
  try:
    return FileResponse(open(file_path, 'rb'), content_type=emoji.filetype)
  except FileNotFoundError:
    logger.error(f"serveEmoji file not found on disk for emoji_id={emoji_id}: {file_path}", extra={'crid': request.crid})
    res = HttpResponse("Emoji file not found")
    res.status_code = 404
    return res


###
# Upload a new custom emoji.
# Any authenticated user may submit an emoji. Accepts multipart/form-data.
# Expected Fields:
#   - name:           Unique slug (lowercase letters, digits, underscores; max 100 chars)
#   - display_name:   Human-readable label shown in the picker (optional, falls back to name)
#   - keywords:       Comma-separated search keywords (optional)
#   - attached_image: The image file
#   - filename:       Original filename (used for extension)
#   - filetype:       MIME type of the image
###
def uploadEmoji(request: HttpRequest):
  # Make sure request is a POST request
  if request.method != 'POST':
    logger.warning("uploadEmoji called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve the requesting user
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("uploadEmoji called by unauthenticated user.", extra={'crid': request.crid})
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  # Pull form fields
  name         = (request.POST.get('name') or '').strip().lower()
  display_name = (request.POST.get('display_name') or '').strip()
  keywords_raw = (request.POST.get('keywords') or '').strip()
  img_filename = request.POST.get('filename') or ''
  img_filetype = (request.POST.get('filetype') or '').strip()
  # Validate name slug
  if not name:
    return JsonResponse({'error': 'name is required'}, status=400)
  if not SLUG_PATTERN.match(name):
    return JsonResponse({'error': 'name must contain only lowercase letters, digits, and underscores'}, status=400)
  if len(name) > 100:
    return JsonResponse({'error': 'name must be 100 characters or fewer'}, status=400)
  # Validate name uniqueness
  if CustomEmoji.objects.filter(name=name).exists():
    logger.warning(f"uploadEmoji rejected duplicate name='{name}'.", extra={'crid': request.crid})
    return JsonResponse({'error': f"An emoji with the name '{name}' already exists"}, status=409)
  # Validate file presence and MIME type
  if 'attached_image' not in request.FILES:
    return JsonResponse({'error': 'attached_image file is required'}, status=400)
  img_file = request.FILES['attached_image']
  if img_filetype not in ALLOWED_MIME_TYPES:
    return JsonResponse({'error': f"File type '{img_filetype}' is not allowed. Must be one of: {', '.join(ALLOWED_MIME_TYPES)}"}, status=400)
  # Validate file size
  if img_file.size > MAX_EMOJI_SIZE_BYTES:
    return JsonResponse({'error': f"File is too large ({img_file.size} bytes). Maximum size is {MAX_EMOJI_SIZE_BYTES} bytes (256 KB)"}, status=400)
  # Parse keywords into a list
  keywords = [k.strip() for k in keywords_raw.split(',') if k.strip()] if keywords_raw else []
  # Generate unique filename and write to disk
  stored_filename = uuid.uuid4().hex + '_' + (img_filename or f'{name}.webp')
  write_path = os.getenv('EMOJI_PATH')
  logger.info(f"Attempting to write emoji '{name}' to {write_path}{stored_filename}", extra={'crid': request.crid})
  try:
    file_storage = FileSystemStorage(location=write_path)
    file_storage.save(stored_filename, img_file)
  except Exception:
    logger.exception("uploadEmoji failed to write file to disk.", extra={'crid': request.crid})
    res = HttpResponse("Failed to write emoji file to backend filesystem.")
    res.status_code = 500
    return res
  # Create the database record
  try:
    emoji = CustomEmoji(
      name=name,
      display_name=display_name or name,
      keywords=keywords,
      filename=stored_filename,
      filetype=img_filetype,
      submitted_by=user,
    )
    emoji.save()
  except Exception:
    logger.exception("uploadEmoji failed to create database record.", extra={'crid': request.crid})
    # Clean up the file we just wrote so we don't leave orphans on disk
    try:
      os.remove(os.path.join(write_path, stored_filename))
    except OSError:
      pass
    res = HttpResponse("Failed to create emoji record in database.")
    res.status_code = 500
    return res
  logger.info(f"Emoji '{name}' uploaded successfully by {user.nickname} (emoji_id={emoji.emoji_id}).", extra={'crid': request.crid})
  return JsonResponse({'success': True, 'emoji': emoji.toJSON()})


###
# Increment the use count for a custom emoji.
# Called fire-and-forget from the frontend whenever a custom emoji is selected
# from the picker (reaction, tag, or rich-text insertion).
###
def recordEmojiUse(request: HttpRequest, emoji_id: int):
  # Make sure request is a POST request
  if request.method != 'POST':
    logger.warning("recordEmojiUse called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Require authentication — no anonymous use tracking
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  # Atomically increment use count — F() expression prevents race conditions
  updated = CustomEmoji.objects.filter(emoji_id=emoji_id, is_active=True).update(
    use_count=F('use_count') + 1
  )
  if not updated:
    # Silently succeed even if the emoji doesn't exist — this is fire-and-forget
    logger.warning(f"recordEmojiUse found no active emoji with id={emoji_id}.", extra={'crid': request.crid})
  return JsonResponse({'success': True})


###
# Admin action. Delete a custom emoji and its file from disk.
# Logs the deletion via the model's delete() override.
###
def deleteEmoji(request: HttpRequest, emoji_id: int):
  # Make sure request is a POST request
  if request.method != 'POST':
    logger.warning("deleteEmoji called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Verify admin access
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Parse JSON body
  body = json.loads(request.body)
  reason = body.get('reason', None)
  # Retrieve the emoji to delete
  try:
    emoji = CustomEmoji.objects.get(emoji_id=emoji_id)
  except ObjectDoesNotExist:
    logger.warning(f"deleteEmoji could not find emoji with id={emoji_id}.", extra={'crid': request.crid})
    return JsonResponse({'error': 'Emoji not found'}, status=404)
  # Remove the file from disk before deleting the DB record
  file_path = os.path.join(os.getenv('EMOJI_PATH'), emoji.filename)
  try:
    os.remove(file_path)
    logger.info(f"Deleted emoji file: {file_path}", extra={'crid': request.crid})
  except FileNotFoundError:
    # File already gone — log and continue, don't block the delete
    logger.warning(f"deleteEmoji: file not found on disk for emoji_id={emoji_id}: {file_path}", extra={'crid': request.crid})
  except OSError:
    logger.exception(f"deleteEmoji: OS error removing file for emoji_id={emoji_id}.", extra={'crid': request.crid})
  # Delete the record — model logs the UserAction
  logger.info(f"Admin {user.nickname} deleting emoji '{emoji.name}' (emoji_id={emoji_id}).", extra={'crid': request.crid})
  emoji.delete(deleter=user, reason=reason)
  return JsonResponse({'success': True})


###
# Admin action. Return all custom emojis (including inactive) with full metadata.
# Used by the admin emoji management panel.
###
def adminListEmojis(request: HttpRequest):
  # Make sure request is a GET request
  if request.method != 'GET':
    logger.warning("adminListEmojis called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Verify admin access
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Retrieve all emojis — no is_active filter, admins see everything
  emojis = CustomEmoji.objects.all()
  return JsonResponse({'emojis': [e.toJSON(admin=True) for e in emojis]})


###
# Admin action. Toggle is_active and/or hide_submitted_at on an emoji.
# Only these two fields are patchable — name and display_name changes are not
# supported as they would invalidate any existing references in reactions and
# review text.
# Expected Body:
#   - is_active:         Boolean (optional)
#   - hide_submitted_at: Boolean (optional)
###
def updateEmojiMeta(request: HttpRequest, emoji_id: int):
  # Make sure request is a POST request
  if request.method != 'POST':
    logger.warning("updateEmojiMeta called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Verify admin access
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Retrieve the emoji to update
  try:
    emoji = CustomEmoji.objects.get(emoji_id=emoji_id)
  except ObjectDoesNotExist:
    logger.warning(f"updateEmojiMeta could not find emoji with id={emoji_id}.", extra={'crid': request.crid})
    return JsonResponse({'error': 'Emoji not found'}, status=404)
  # Parse JSON body and apply any provided fields
  body = json.loads(request.body)
  update_fields = []
  if 'is_active' in body:
    emoji.is_active = bool(body['is_active'])
    update_fields.append('is_active')
  if 'hide_submitted_at' in body:
    emoji.hide_submitted_at = bool(body['hide_submitted_at'])
    update_fields.append('hide_submitted_at')
  if not update_fields:
    return JsonResponse({'error': 'No valid fields provided to update'}, status=400)
  # Save only the changed fields — skip_action_log since meta updates are not user-facing actions
  emoji.save(update_fields=update_fields, skip_action_log=True)
  logger.info(f"Admin {user.nickname} updated emoji '{emoji.name}' (emoji_id={emoji_id}): {update_fields}.", extra={'crid': request.crid})
  return JsonResponse({'success': True, 'emoji': emoji.toJSON(admin=True)})
