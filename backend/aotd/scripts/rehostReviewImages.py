# One-off backfill: sanitize every existing review body and track comment, download and re-host every external
# <img> they reference, rewrite the HTML to point at the first-party paths, and link the resulting ReviewImage rows
# to their reviews. Applies the same treatment to ReviewHistory snapshots so the history accordion keeps rendering.
#
# Follows the precedent of migrateGifOffTenor.py: a django-extensions runscript, silent saves that create no
# ReviewHistory rows and no UserActions, and timestamps left untouched.
#
# Usage:
#   python manage.py runscript rehostReviewImages --script-args dry-run          # list candidates and external URLs, fetch nothing
#   python manage.py runscript rehostReviewImages --script-args review=123       # process one review by primary key
#   python manage.py runscript rehostReviewImages --script-args skip-history     # leave ReviewHistory rows alone
#   python manage.py runscript rehostReviewImages                                # the real thing
#
# Effort: 2026 User Image Uploads in Reviews

import os
import re
from dotenv import load_dotenv

from ..models import Review, ReviewHistory, ReviewImage
from ..review_image_utils import (
  processReviewHtml,
  sanitizeReviewHtml,
  extractReviewImageIds,
  isFirstPartySrc,
)

# Determine runtime enviornment
APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV=="PROD" else ".env.local")

CRID = 'backfill-rehost'   # every log line from the helpers carries this so the run is easy to grep


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
  # ------------------------------------------------------------------------------------------------------------
  # 2. Shared state for the whole run.
  #    rehost_cache maps external src -> first-party path, so a Tenor GIF that appears in thirty reviews is
  #    fetched once. It is passed into every processReviewHtml call below.
  # ------------------------------------------------------------------------------------------------------------
  rehost_cache = {}
  stats = {
    'reviews_scanned': 0, 'reviews_changed': 0,
    'histories_scanned': 0, 'histories_changed': 0,
    'images_linked': 0,
    'dropped': [],   # (review or history label, src) pairs, printed at the end for eyeballing
  }
  # ------------------------------------------------------------------------------------------------------------
  # 3. Select candidate reviews.
  #    Cheap pre-filter: anything whose body contains an <img>, plus every advanced review (track comments live
  #    inside a JSON column, so inspect those in Python rather than trying to query into the JSON).
  # ------------------------------------------------------------------------------------------------------------
  if only_review_pk is not None:
    candidates = Review.objects.filter(pk=only_review_pk)
  else:
    candidates = Review.objects.filter(review_text__contains='<img') | Review.objects.filter(advanced=True)
  print(f"Scanning {candidates.count()} candidate review(s)...")
  # ------------------------------------------------------------------------------------------------------------
  # 4. Process each review.
  # ------------------------------------------------------------------------------------------------------------
  for review in candidates:
    stats['reviews_scanned'] += 1
    uploader = review.user.aotd_data
    main_text = review.review_text
    advanced = review.advanced
    if (advanced):
      advanced_track_data = review.advancedReviewDict

    if dry_run:
      # Dry run must have NO side effects, and processReviewHtml fetches and writes to disk. So only sanitize
      # (pure) and list the external sources that a real run would try to fetch.
      src_re = r'<img\b[^>]*\bsrc="([^"]*)"'
      clean = sanitizeReviewHtml(main_text)
      for src in re.findall(src_re, clean):
        if not isFirstPartySrc(src): 
          print(f"  review {review.pk}: would fetch {src}")
      if(advanced and advanced_track_data):
        print(f"  review is advanced, checking tracks")
        for track in advanced_track_data.keys():
          track_comment = advanced_track_data[track].get('cordpal_comment')
          track_comment_clean = sanitizeReviewHtml(track_comment)
          for src in re.findall(src_re, track_comment_clean):
            if not isFirstPartySrc(src): 
              print(f"  review {review.pk} track {track}: would fetch {src}")
      continue

    # --- body
    new_body, dropped = processReviewHtml(review.review_text, uploader, CRID, rehost_cache)
    stats['dropped'].extend((f"review {review.pk}", src) for src in dropped)
    changed = (new_body != review.review_text)

    # --- track comments (advanced reviews only)
    new_track_data = None
    if review.advanced and review.advancedReviewDict:
      new_track_data = review.advancedReviewDict   # same dict object; rewritten in place, then assigned back below
      for track in new_track_data.values():
        new_comment, dropped = processReviewHtml(track.get('cordpal_comment'), uploader, CRID, rehost_cache)
        stats['dropped'].extend((f"review {review.pk}", src) for src in dropped)
        if (new_comment != track.get('cordpal_comment')): 
          track['cordpal_comment'] = new_comment
          changed = True

    if not changed:
      continue

    # --- save silently: no ReviewHistory snapshot, no UserAction, last_updated untouched (not in update_fields)
    review.review_text = new_body
    update_fields = ['review_text']
    if new_track_data is not None:
      review.advancedReviewDict = new_track_data
      update_fields.append('advancedReviewDict')
    review.save(silent_update=True, update_fields=update_fields)
    stats['reviews_changed'] += 1

    # --- link every first-party image the rewritten HTML references (re-hosted just now, or uploaded earlier)
    bodies = [review.review_text] + [t.get('cordpal_comment') for t in (new_track_data or {}).values()]
    ids = extractReviewImageIds(*bodies)
    matched = ReviewImage.objects.filter(image_id__in=ids)
    review.images.add(*matched); stats['images_linked'] += matched.count()
    print(f"  review {review.pk} rewritten")

  # ------------------------------------------------------------------------------------------------------------
  # 5. ReviewHistory snapshots. Same processing, but written with a queryset .update() rather than .save():
  #    history rows are immutable snapshots and going around the model avoids any save-time side effects.
  #    Images re-hosted for a snapshot are linked to the snapshot's parent review so the orphan GC never
  #    collects something the history accordion still renders.
  # ------------------------------------------------------------------------------------------------------------
  if not skip_history and not dry_run:
    histories = ReviewHistory.objects.filter(review_text__contains='<img') | ReviewHistory.objects.filter(advanced=True)
    if only_review_pk is not None:
      histories = histories.filter(review_id=only_review_pk)
    print(f"Scanning {histories.count()} candidate history row(s)...")
    for history in histories:
      stats['histories_scanned'] += 1
      uploader = history.review.user.aotd_data
      label = f"history {history.pk} (review {history.review_id})"

      # --- body
      new_body, dropped = processReviewHtml(history.review_text, uploader, CRID, rehost_cache)
      stats['dropped'].extend((label, src) for src in dropped)
      changed = (new_body != history.review_text)

      # --- track comments
      new_track_data = None
      if history.advanced and history.advancedReviewDict:
        new_track_data = history.advancedReviewDict
        for track in new_track_data.values():
          new_comment, dropped = processReviewHtml(track.get('cordpal_comment'), uploader, CRID, rehost_cache)
          stats['dropped'].extend((label, src) for src in dropped)
          if (new_comment != track.get('cordpal_comment')):
            track['cordpal_comment'] = new_comment
            changed = True

      if not changed:
        continue

      # --- queryset update: no model save(), so no signals or timestamp changes on the snapshot
      update_values = {'review_text': new_body}
      if new_track_data is not None:
        update_values['advancedReviewDict'] = new_track_data
      ReviewHistory.objects.filter(pk=history.pk).update(**update_values)
      stats['histories_changed'] += 1

      # --- link to the PARENT review so the GC never collects an image a snapshot still renders
      bodies = [new_body] + [t.get('cordpal_comment') for t in (new_track_data or {}).values()]
      matched = ReviewImage.objects.filter(image_id__in=extractReviewImageIds(*bodies))
      history.review.images.add(*matched); stats['images_linked'] += matched.count()
      print(f"  {label} rewritten")

  # ------------------------------------------------------------------------------------------------------------
  # 6. Report. Read the dropped list before trusting a real run: every entry is an image that is now gone from
  #    a review because its host did not answer or did not return a valid image.
  # ------------------------------------------------------------------------------------------------------------
  print("\nBackfill complete" + (" (DRY RUN, nothing written)" if dry_run else ""))
  print(f"  reviews:   {stats['reviews_scanned']} scanned, {stats['reviews_changed']} rewritten")
  print(f"  histories: {stats['histories_scanned']} scanned, {stats['histories_changed']} rewritten")
  print(f"  images linked: {stats['images_linked']}")
  print(f"  images dropped: {len(stats['dropped'])}")
  for label, src in stats['dropped']:
    print(f"    {label}: {src}")

# Notes:
#  - rehostExternalImages caps fetches per call at MAX_FETCHES_PER_SUBMIT (10). That is tuned for a live submit.
#    A review with more than ten DISTINCT external images (cache hits do not count) would have the rest dropped.
#    If the dry run shows any such review, either raise the constant for the duration of the backfill or add a
#    budget parameter to rehostExternalImages.
#  - The fetch timeouts are also tuned for a live submit (3s connect, 5s read). Fine for a CDN; a flaky host will
#    be dropped rather than waited on. That is the intended trade for a script you can re-run.
#  - Re-running is safe: already-rewritten reviews contain only first-party sources, so processReviewHtml leaves
#    them unchanged and the "if not changed: continue" skips them.
