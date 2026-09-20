from django.http import HttpRequest, HttpResponse, JsonResponse, FileResponse
from django.core.exceptions import ObjectDoesNotExist

from .models import (
  AotdUserData,
  ReviewImage
)
from .review_image_utils import (
  ReviewImageError,
  storeReviewImage,
  removeReviewImageFile,
  MAX_UPLOAD_BYTES,
  ORPHAN_GRACE_HOURS,
)
from users.utils import getUserObj
from django.utils import timezone

import logging
import os
from datetime import timedelta

logger = logging.getLogger(__name__)

##
# Upload a new Review Image and return: {success, image: {image_id, url, filetype, width, height}}
##
def uploadReviewImage(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("uploadReviewImage called with a non-POST method, returning 405.", extra={'crid': request.crid, 'method': request.method})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve the requesting user from the session; no user means no valid session cookie
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("uploadReviewImage called by unauthenticated user.", extra={'crid': request.crid})
    return JsonResponse({'success': False, 'error': 'Not authenticated'}, status=401)
  # Only AOTD-enrolled users can write reviews, so only they can own review images
  aotdUserObj = AotdUserData.objects.filter(user=user).first()
  if not aotdUserObj:
    logger.warning("uploadReviewImage called by a user with no AOTD enrollment.", extra={'crid': request.crid, 'discord_id': user.discord_id, 'nickname': user.nickname})
    return JsonResponse({'success': False, 'error': 'Not enrolled in Album of the Day'}, status=403)
  # Retrieve file from attachment; a request with no file is a client error, not a crash
  img_file = request.FILES.get('attached_image')
  if img_file is None:
    logger.warning("uploadReviewImage called with no attached_image file.", extra={'crid': request.crid, 'discord_id': user.discord_id, 'files_received': list(request.FILES.keys())})
    return JsonResponse({'success': False, 'error': 'Upload failed as no image file was provided for upload: attached_image file is required'}, status=400)
  # Reject oversized uploads before reading their bytes into memory. Django reports size from the upload handler
  # without loading the file, so this check is free. The client downscales photos before sending, so hitting this
  # means the browser-side resize failed or was bypassed.
  if img_file.size > MAX_UPLOAD_BYTES:
    logger.warning("uploadReviewImage rejected an oversized file.", extra={'crid': request.crid, 'discord_id': user.discord_id, 'upload_name': img_file.name, 'upload_size': img_file.size, 'max_bytes': MAX_UPLOAD_BYTES})
    return JsonResponse({'success': False, 'error': f'File is too large ({img_file.size} bytes). Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB'}, status=400)
  # Handle processing and storage of image, as well as creation of a ReviewImage
  try:
    image = storeReviewImage(
      raw=img_file.read(),
      uploader=aotdUserObj,
      source_url=None,
      crid=request.crid
    )
  except ReviewImageError as e:
    # If error is a ReviewImageError, return it to the client for each user to be able to report issues or fix upload on their end.
    logger.warning(f"Rejected ReviewImage upload: {str(e)}", extra={
      'crid': request.crid,
      'status_code': e.status_code,
      'uploader_id': getattr(aotdUserObj, 'user_id', None),
      'upload_name': img_file.name,
      'upload_size': img_file.size,
      'upload_declared_type': img_file.content_type,
    })
    return JsonResponse({'success': False, 'error': str(e)}, status=e.status_code)
  except Exception:
    # Server based catch for non-client-facing errors
    # logger.exception attaches the traceback; the exception object is not in scope in a bare except
    logger.exception("UNEXPECTED error during ReviewImage upload", extra={
      'crid': request.crid,
      'uploader_id': getattr(aotdUserObj, 'user_id', None),
      'upload_name': img_file.name,
      'upload_size': img_file.size,
      'upload_declared_type': img_file.content_type,
    })
    return JsonResponse({'success': False,'error': "An unexpected server error has occured when attempting to upload your image, please contact admins."}, status=500)
  # Return successful upload of image for use in reviews
  logger.info(f"Successfully uploaded ReviewImage to file: {image.filename}", extra={
    'crid': request.crid,
    'uploader_id': getattr(aotdUserObj, 'user_id', None),
    'upload_name': img_file.name,
    'upload_size': img_file.size,
    'stored_size': image.size_bytes,
    'image_data': image.toJSON(),
  })
  return JsonResponse({'success': True, 'image': image.toJSON(), 'error': "N/A"})


##
# Return the file for a ReviewImage based on requested image_id
##
def serveReviewImage(request: HttpRequest, hex: str):
  # Make sure request is a GET request
  if request.method != 'GET':
    logger.warning("serveReviewImage called with a non-GET method, returning 405.", extra={'crid': request.crid, 'method': request.method, 'image_id': hex})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retrieve the ReviewImage Row
  try:
    review_image = ReviewImage.objects.get(image_id=hex)
  except ObjectDoesNotExist:
    logger.warning(f"Could not find ReviewImage with id: {hex}.", extra={'crid': request.crid, 'image_id': hex, 'client_ip': getattr(request, 'client_ip', None)})
    res = HttpResponse("ReviewImage not found")
    res.status_code = 404
    return res
  # Build path and stream file
  file_path = review_image.diskPath()
  logger.info(f"Serving ReviewImage file: {file_path}", extra={'crid': request.crid, 'image_id': hex, 'file_path': file_path, 'filetype': review_image.filetype, 'size_bytes': review_image.size_bytes})
  try:
    res = FileResponse(open(file_path, 'rb'), content_type=review_image.filetype)
    res['Cache-Control'] = 'public, max-age=31536000, immutable'
    res['X-Content-Type-Options'] = 'nosniff'
    return res
  except FileNotFoundError:
    # A row with no file means the disk and the database have diverged (missing mount, manual deletion); worth a loud log
    logger.error(f"File not found on disk for ReviewImage hex: {hex}: {file_path}", extra={'crid': request.crid, 'image_id': hex, 'file_path': file_path, 'row_pk': review_image.pk, 'uploaded_at': review_image.uploaded_at.isoformat()})
    res = HttpResponse("ReviewImage file not found")
    res.status_code = 404
    return res


##
# Crawl the unlinked ReviewImage entries and terminate them if they are old enough to be deleted without having any linked reviews.
# Returns: {deleted: n}
##
def cleanupOrphanReviewImages(request: HttpRequest):
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("cleanupOrphanReviewImages called with a non-POST method, returning 405.", extra={'crid': request.crid, 'method': request.method})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Using timezone.now() which is UTC aware (and how the timestamp is stored) so even tho its not in the server's timezone its okay. 
  cutoff = timezone.now() - timedelta(hours=ORPHAN_GRACE_HOURS)
  # Retrieve all ReviewImage rows that are not linked and have a last_used_timestamp of more than 24 hours ago.
  unlinked = ReviewImage.objects.filter(reviews__isnull=True, last_used_at__lt=cutoff).distinct()
  candidate_count = unlinked.count()
  logger.info(f"Orphan ReviewImage sweep found {candidate_count} candidate(s) older than {ORPHAN_GRACE_HOURS}h.", extra={'crid': request.crid, 'cutoff': cutoff.isoformat(), 'candidates': candidate_count})
  deleted = 0
  failed = 0
  # Iterate images that have been found and delete them
  for image in list(unlinked):
    try:
      # File first, then row. Retries will catch failed deletions
      removeReviewImageFile(image.diskPath(), crid=request.crid)
      # system=True: cron has no user, and a UserAction with a null user would crash the recent-actions view.
      image.delete(system=True, reason='orphan_gc')
      deleted += 1
      logger.info(f"Orphan ReviewImage deleted: {image.filename}", extra={'crid': request.crid, 'image_id': image.image_id.hex, 'row_pk': image.pk, 'last_used_at': image.last_used_at.isoformat(), 'size_bytes': image.size_bytes})
    except Exception:
      # Log bad deletion with the traceback and keep iterating
      failed += 1
      logger.exception(f"Failed to delete orphan ReviewImage: {image.filename}", extra={'crid': request.crid, 'image_id': image.image_id.hex, 'row_pk': image.pk})
  logger.info(f"Orphan ReviewImage sweep complete: {deleted} deleted, {failed} failed.", extra={'crid': request.crid, 'deleted': deleted, 'failed': failed, 'candidates': candidate_count})
  return JsonResponse({'deleted': deleted, 'failed': failed})