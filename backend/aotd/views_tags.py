from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count

import json
import logging

from users.utils import getUserObj
from votes.models import Vote
from .models import Album, AlbumTag, GlobalTag

logger = logging.getLogger(__name__)

APPROVAL_THRESHOLD = 3
SUGGESTION_MIN_ALBUMS = 3


def normalize_tag(text: str) -> str:
  """Title-case each word and strip surrounding whitespace."""
  return ' '.join(word.capitalize() for word in text.strip().split())

## =========================================================================================================================================================================================
## TAGGING METHODS
## =========================================================================================================================================================================================

def getTagsForAlbum(request: HttpRequest, mbid: str):
  """Return all tags for an album, ordered by approval status then submission date. Includes the requesting user's vote if authenticated."""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("Called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Try to get the album passed in
  try:
    album = Album.objects.get(mbid=mbid)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Album not found'}, status=404)
  # Get Tags for the album including if the user has cast a vote on the tag
  user = getUserObj(request.session.get('discord_id'))
  tags = AlbumTag.objects.filter(album=album).order_by('-is_approved', '-submitted_at')
  return JsonResponse({'tags': [t.toJSON(user=user) for t in tags]})


def submitTag(request: HttpRequest):
  """Submit a new tag on an album. Accepts mbid, tag_text, and optional global_tag_id. Auto-upvotes on creation and logs the vote."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retreieve user submitting the tag
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("User is not authenticated", extra={'crid': request.crid})
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  if not hasattr(user, 'aotd_data'):
    logger.error("User is not enrolled in AOTD", extra={'crid': request.crid})
    return JsonResponse({'error': 'Must be AOTD-enrolled to submit tags'}, status=403)
  # Parse JSON body
  body = json.loads(request.body)
  mbid = body.get('mbid', '').strip()
  raw_text = body.get('tag_text', '').strip()
  global_tag_id = body.get('global_tag_id', None)
  emoji = body.get('emoji', None) or None  # normalize empty string to None
  # Error handling around mbid and tag text
  if not mbid or not raw_text:
    logger.error("Malformed request body: mbid and tag_text are required", extra={'crid': request.crid})
    return JsonResponse({'error': 'mbid and tag_text are required'}, status=400)
  if len(raw_text) > 50:
    logger.error("Malformed request body: Tag must be 50 characters or fewer", extra={'crid': request.crid})
    return JsonResponse({'error': 'Tag must be 50 characters or fewer'}, status=400)
  # Normalize tag text
  tag_text = normalize_tag(raw_text)
  # Get Album from DB
  try:
    album = Album.objects.get(mbid=mbid)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Album not found'}, status=404)
  # Resolve global tag if the frontend indicated one was selected
  global_tag = None
  if global_tag_id is not None:
    try:
      global_tag = GlobalTag.objects.get(pk=global_tag_id)
    except ObjectDoesNotExist:
      return JsonResponse({'error': 'Global tag not found'}, status=404)
  # Enforce case-insensitive uniqueness per album
  if AlbumTag.objects.filter(album=album, tag_text__iexact=tag_text).exists():
    return JsonResponse({'error': 'This tag already exists on this album'}, status=409)
  # Create Tag object
  tag = AlbumTag.objects.create(album=album, tag_text=tag_text, submitted_by=user, global_tag=global_tag, emoji=emoji)
  # Auto-upvote from submitter
  ct = ContentType.objects.get_for_model(AlbumTag)
  Vote.objects.create(user=user, content_type=ct, object_id=tag.pk, vote_type=Vote.UPVOTE)
  tag.log_vote(user, Vote.UPVOTE)
  # Recalculate tag approval status and return response
  tag.recalculate_approval()
  return JsonResponse({'success': True, 'tag': tag.toJSON(user=user)}, status=201)


def voteOnTag(request: HttpRequest):
  """Cast or change a vote (1 or -1) on an existing tag. One vote per user per tag; returns 409 if already voted the same way."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retreieve user submitting the tag
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("User is not authenticated", extra={'crid': request.crid})
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  if not hasattr(user, 'aotd_data'):
    logger.error("User is not enrolled in AOTD", extra={'crid': request.crid})
    return JsonResponse({'error': 'Must be AOTD-enrolled to vote on tags'}, status=403)
  # Parse JSON Body
  body = json.loads(request.body)
  tag_id = body.get('tag_id')
  vote_type = body.get('vote_type')  # 1 or -1
  # Vote Type Error Handling
  if vote_type not in (1, -1):
    logger.error("vote_type must be 1 or -1", extra={'crid': request.crid})
    return JsonResponse({'error': 'vote_type must be 1 or -1'}, status=400)
  # Get Existing Tag Object from DB
  try:
    tag = AlbumTag.objects.get(pk=tag_id)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Tag not found'}, status=404)
  # Handle retrieval and creation of vote on tag
  ct = ContentType.objects.get_for_model(AlbumTag)
  existing = Vote.objects.filter(user=user, content_type=ct, object_id=tag.pk).first()
  if existing:
    if existing.vote_type == vote_type:
      return JsonResponse({'error': 'You have already voted this way'}, status=409)
    existing.vote_type = vote_type
    existing.save()
  else:
    Vote.objects.create(user=user, content_type=ct, object_id=tag.pk, vote_type=vote_type)
  # Log vote and recalculate tag approval status and return response
  tag.log_vote(user, vote_type)
  tag.recalculate_approval()
  return JsonResponse({'success': True, 'tag': tag.toJSON(user=user)})


def removeVoteFromTag(request: HttpRequest):
  """Remove the requesting user's vote from a tag. Returns 404 if no vote exists to remove."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retreieve user submitting the tag
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("User is not authenticated", extra={'crid': request.crid})
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  # Parse JSON Body
  body = json.loads(request.body)
  tag_id = body.get('tag_id')
  # Get Existing Tag Object from DB
  try:
    tag = AlbumTag.objects.get(pk=tag_id)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Tag not found'}, status=404)
  # Handle retrieval and vote deletion
  ct = ContentType.objects.get_for_model(AlbumTag)
  deleted, _ = Vote.objects.filter(user=user, content_type=ct, object_id=tag.pk).delete()
  if not deleted:
    logger.error("No vote found to remove", extra={'crid': request.crid})
    return JsonResponse({'error': 'No vote found to remove'}, status=404)
  # Log vote removal
  from users.models import UserAction
  UserAction.objects.create(
    user=user,
    action_type="DELETE",
    entity_type="ALBUM_TAG_VOTE",
    entity_id=tag.pk,
    details={"tag_text": tag.tag_text, "album_mbid": tag.album.mbid}
  )
  # Recalculate tag approval status and return response
  tag.recalculate_approval()
  return JsonResponse({'success': True, 'tag': tag.toJSON(user=user)})


def deleteTag(request: HttpRequest):
  """Delete a tag. Submitters may delete their own unapproved tags; admins may delete any tag."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Retreieve user submitting the tag
  user = getUserObj(request.session.get('discord_id'))
  if not user:
    logger.error("User is not authenticated", extra={'crid': request.crid})
    return JsonResponse({'error': 'Not authenticated'}, status=401)
  # Parse JSON Body
  body = json.loads(request.body)
  tag_id = body.get('tag_id')
  # Get Existing Tag Object from DB
  try:
    tag = AlbumTag.objects.get(pk=tag_id)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Tag not found'}, status=404)
  # Handle Tag Deletion
  is_submitter = (tag.submitted_by == user)
  is_admin = user.is_staff
  if is_admin:
    tag.delete(deleter=user, admin_delete=True)
  elif is_submitter and not tag.is_approved:
    tag.delete(deleter=user, admin_delete=False)
  else:
    return JsonResponse({'error': 'You do not have permission to delete this tag'}, status=403)
  # Return Response
  return JsonResponse({'success': True})


def getTagSuggestions(request: HttpRequest):
  """Return a sorted list of tag suggestion objects {text, emoji}, combining admin-preset GlobalTags and community tags approved on 2+ distinct albums."""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("Called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Admin-preset global tags with their emojis
  global_tag_map = {gt.text: gt.emoji for gt in GlobalTag.objects.all()}
  # Tags approved on >= 3 distinct albums
  common_tags = set(
    AlbumTag.objects
    .filter(is_approved=True)
    .values('tag_text')
    .annotate(album_count=Count('album', distinct=True))
    .filter(album_count__gte=SUGGESTION_MIN_ALBUMS)
    .values_list('tag_text', flat=True)
  )
  # Merge, preferring global tag emoji when text appears in both
  all_texts = set(global_tag_map.keys()) | common_tags
  suggestions = sorted(
    [{'text': text, 'emoji': global_tag_map.get(text)} for text in all_texts],
    key=lambda x: x['text']
  )
  return JsonResponse({'suggestions': suggestions})


def createGlobalTag(request: HttpRequest):
  """Admin action. Create a new site-wide GlobalTag. Returns created=False if the tag already exists."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user creating the global tag
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Parse JSON Body
  body = json.loads(request.body)
  raw_text = body.get('tag_text', '').strip()
  if not raw_text:
    return JsonResponse({'error': 'tag_text is required'}, status=400)
  emoji = body.get('emoji', None) or None
  # Normalize Tag
  tag_text = normalize_tag(raw_text)
  # Create Tag
  tag, created = GlobalTag.objects.get_or_create(text=tag_text, defaults={'created_by': user, 'emoji': emoji})
  return JsonResponse({'success': True, 'created': created, 'tag': {'id': tag.pk, 'text': tag.text, 'emoji': tag.emoji}})


def deleteGlobalTag(request: HttpRequest):
  """Admin action. Delete a GlobalTag by id."""
  # Make sure request is a POST request
  if(request.method != "POST"):
    logger.warning("Called with a non-POST method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user deleting the global tag
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Parse JSON Body
  body = json.loads(request.body)
  tag_id = body.get('tag_id')
  # Retrieve and delete tag
  try:
    tag = GlobalTag.objects.get(pk=tag_id)
  except ObjectDoesNotExist:
    return JsonResponse({'error': 'Global tag not found'}, status=404)
  tag.delete(deleter=user)
  # Return Tag deletion status
  return JsonResponse({'success': True})


def getGlobalTags(request: HttpRequest):
  """Admin action. Return all GlobalTags ordered alphabetically."""
  # Make sure request is a GET request
  if(request.method != "GET"):
    logger.warning("Called with a non-GET method, returning 405.", extra={'crid': request.crid})
    res = HttpResponse("Method not allowed")
    res.status_code = 405
    return res
  # Get user requesting tags and ensure they are admin
  user = getUserObj(request.session.get('discord_id'))
  if not user or not user.is_staff:
    return JsonResponse({'error': 'Admin access required'}, status=403)
  # Return list of tags
  tags = list(GlobalTag.objects.order_by('text').values('id', 'text', 'emoji', 'created_at'))
  return JsonResponse({'global_tags': tags})

