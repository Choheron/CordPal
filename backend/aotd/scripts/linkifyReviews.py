# One-off backfill: wrap bare URLs in existing review bodies and track comments with <a> tags, so reviews written
# before the editor supported links get clickable links too. Applies the same treatment to ReviewHistory snapshots.
#
# Only version 2 reviews are touched. Version 1 reviews still run through the render-time YouTube regex in
# review_utils.ts, which would turn a linked YouTube URL into an iframe inside an anchor.
#
# Follows the precedent of rehostReviewImages.py: a django-extensions runscript, silent saves that create no
# ReviewHistory rows and no UserActions, and timestamps left untouched.
#
# Usage:
#   python manage.py runscript linkifyReviews --script-args dry-run          # list the URLs that would be linked, write nothing
#   python manage.py runscript linkifyReviews --script-args review=123       # process one review by primary key
#   python manage.py runscript linkifyReviews --script-args skip-history     # leave ReviewHistory rows alone
#   python manage.py runscript linkifyReviews                                # the real thing
#
# Effort: 2026 Embedded Links in Reviews

import os
import re
from dotenv import load_dotenv
from django.db.models import Q

from ..models import Review, ReviewHistory
from ..review_image_utils import sanitizeReviewHtml

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

# A bare URL in a text segment of sanitized HTML. Stops at whitespace, '<', '"', and the &nbsp; entity TipTap emits
# for runs of spaces. Trailing punctuation is trimmed off afterwards by _linkifyMatch.
BARE_URL_RE = re.compile(r'https?://(?:(?!&nbsp;)[^\s<"])+')
# Text inside these tags is never linkified: already a link, or meant to be shown literally.
NO_LINKIFY_TAG_RE = re.compile(r'^<(/?)(a|code|pre)\b')


def run(*args):
  # ------------------------------------------------------------------------------------------------------------
  # 1. Parse flags. runscript hands --script-args through as plain strings.
  # ------------------------------------------------------------------------------------------------------------
  dry_run = 'dry-run' in args
  skip_history = 'skip-history' in args
  only_review_pk = None
  # For any arg shaped like "review=<int>", set only_review_pk to that int
  for arg in args:
    if arg.startswith("review="):
      only_review_pk = int(arg.split("=", 1)[1])
  stats = {
    'reviews_scanned': 0, 'reviews_changed': 0,
    'histories_scanned': 0, 'histories_changed': 0,
    'urls_linked': 0,
  }
  # ------------------------------------------------------------------------------------------------------------
  # 2. Select candidate reviews.
  #    Cheap pre-filter: version 2 bodies containing "http", plus every version 2 advanced review (track comments
  #    live inside a JSON column, so inspect those in Python rather than trying to query into the JSON).
  # ------------------------------------------------------------------------------------------------------------
  candidate_filter = Q(version=2) & (Q(review_text__contains='http') | Q(advanced=True))
  candidates = Review.objects.filter(candidate_filter)
  if only_review_pk is not None:
    candidates = candidates.filter(pk=only_review_pk)
  print(f"Scanning {candidates.count()} candidate review(s)...")
  # ------------------------------------------------------------------------------------------------------------
  # 3. Process each review.
  # ------------------------------------------------------------------------------------------------------------
  for review in candidates:
    stats['reviews_scanned'] += 1
    label = f"review {review.pk}"
    new_body, new_track_data, linked = _linkifyRow(review)
    if not linked:
      continue
    stats['urls_linked'] += len(linked)
    for url in linked:
      print(f"  {label}: {'would link' if dry_run else 'linked'} {url}")
    if dry_run:
      continue

    # --- save silently: no ReviewHistory snapshot, no UserAction, last_updated untouched (not in update_fields)
    review.review_text = new_body
    update_fields = ['review_text']
    if new_track_data is not None:
      review.advancedReviewDict = new_track_data
      update_fields.append('advancedReviewDict')
    review.save(silent_update=True, update_fields=update_fields)
    stats['reviews_changed'] += 1

  # ------------------------------------------------------------------------------------------------------------
  # 4. ReviewHistory snapshots. Same processing, but written with a queryset .update() rather than .save():
  #    history rows are immutable snapshots and going around the model avoids any save-time side effects.
  # ------------------------------------------------------------------------------------------------------------
  if not skip_history:
    histories = ReviewHistory.objects.filter(candidate_filter)
    if only_review_pk is not None:
      histories = histories.filter(review_id=only_review_pk)
    print(f"Scanning {histories.count()} candidate history row(s)...")
    for history in histories:
      stats['histories_scanned'] += 1
      label = f"history {history.pk} (review {history.review_id})"
      new_body, new_track_data, linked = _linkifyRow(history)
      if not linked:
        continue
      stats['urls_linked'] += len(linked)
      for url in linked:
        print(f"  {label}: {'would link' if dry_run else 'linked'} {url}")
      if dry_run:
        continue

      # --- queryset update: no model save(), so no signals or timestamp changes on the snapshot
      update_values = {'review_text': new_body}
      if new_track_data is not None:
        update_values['advancedReviewDict'] = new_track_data
      ReviewHistory.objects.filter(pk=history.pk).update(**update_values)
      stats['histories_changed'] += 1

  # ------------------------------------------------------------------------------------------------------------
  # 5. Report.
  # ------------------------------------------------------------------------------------------------------------
  print("\nBackfill complete" + (" (DRY RUN, nothing written)" if dry_run else ""))
  print(f"  reviews:   {stats['reviews_scanned']} scanned, {stats['reviews_changed']} rewritten")
  print(f"  histories: {stats['histories_scanned']} scanned, {stats['histories_changed']} rewritten")
  print(f"  urls {'to link' if dry_run else 'linked'}: {stats['urls_linked']}")


def _linkifyRow(row: Review | ReviewHistory) -> tuple[str, dict | None, list[str]]:
  """Linkify a review or history row's body and track comments. Returns the new body, the new track data (None if not advanced), and every URL linked."""
  new_body, linked = linkifyReviewHtml(row.review_text)
  new_track_data = None
  if row.advanced and row.advancedReviewDict:
    new_track_data = row.advancedReviewDict   # same dict object; rewritten in place, then assigned back by the caller
    for track in new_track_data.values():
      new_comment, track_linked = linkifyReviewHtml(track.get('cordpal_comment'))
      if track_linked:
        track['cordpal_comment'] = new_comment
        linked.extend(track_linked)
  return new_body, new_track_data, linked


def linkifyReviewHtml(html: str | None) -> tuple[str | None, list[str]]:
  """
  Wrap bare URLs in the text of review HTML with <a> tags. Return the rewritten HTML and the list of URLs linked.
  If nothing is linked the input is returned untouched, so callers can compare against the original to detect a change.
  """
  if not html:
    return html, []
  # Split on tags so only text between them is touched; a URL inside an attribute (img src, iframe src) is never matched.
  # Sanitize first so the split runs on nh3's normalised output.
  segments = re.split(r'(<[^>]+>)', sanitizeReviewHtml(html))
  linked = []
  skip_depth = 0
  for i, segment in enumerate(segments):
    if segment.startswith('<'):
      tag_match = NO_LINKIFY_TAG_RE.match(segment)
      if tag_match:
        skip_depth += -1 if tag_match.group(1) else 1
      continue
    if skip_depth > 0:
      continue
    segments[i] = BARE_URL_RE.sub(lambda m: _linkifyMatch(m, linked), segment)
  if not linked:
    return html, []
  # Re-sanitize so the new anchors get the same forced rel/target as a live submit
  return sanitizeReviewHtml(''.join(segments)), linked


def _linkifyMatch(match: re.Match, linked: list[str]) -> str:
  url = match.group(0)
  # Leave sentence punctuation after the URL as text ("see https://example.com." should not link the period)
  trimmed = url.rstrip('.,!?;:)]\'')
  if trimmed in ('http://', 'https://'):
    return url
  linked.append(trimmed)
  return f'<a href="{trimmed}">{trimmed}</a>{url[len(trimmed):]}'

# Notes:
#  - Re-running is safe: an already-linked URL sits inside an <a>, which linkifyReviewHtml skips, so a second run
#    finds nothing to link.
#  - A row that gets a link is also re-sanitized as a whole. Rows saved before the sanitizer existed (and never
#    touched by rehostReviewImages) may change beyond the new anchors; that is the same cleanup a live edit would do.
#  - Only http:// and https:// URLs are linked. A bare "example.com" stays plain text.
