# CordPal

A companion website for a private Discord server. Auth is Discord OAuth, access requires server membership and a specific role.

The core feature is **Album of the Day**: each night at midnight, the system picks one album from the community's pool for everyone to listen to and review. Over time this has grown into a much larger system with streaks, inactivity detection, planned outages, community tag voting, per-user selection probability, and a "yard sale"/rescue for abandoned submissions.

**Stack:** Next.js 16 (App Router) + Django 5.0. Music data comes from MusicBrainz.

---

## Album of the Day

### How selection works

Users enroll, submit albums via MusicBrainz search, and every night a cron job picks one. Each user's probability is proportional to how many of their submitted albums haven't been AOTD yet.

A user's albums are excluded from selection if they've been inactive (no review in 2+ days). Submissions come back into the pool once you review again.

**Outages** let you declare a planned absence in advance (at least 3 days out). While an outage is active, you're skipped for selection without having your streak affected.

Every 30 minutes, a cron job recalculates each user's exact probability and caches it. The frontend shows your current chance percentage and why you might be blocked.

### Reviews and streaks

Submitting an album requires you to have reviewed the current day's AOTD first. Reviews have a score (0–10), freeform text, and an optional "first time listen" flag. Advanced reviews support per-track ratings.

Edits are versioned: on update, the old state is pushed to `ReviewHistory` and the version counter increments. Reviews start at `version=2` for legacy compatibility.

Reactions on reviews update in real time. The backend publishes to a Redis channel when a review is saved; the frontend subscribes via a long-lived SSE connection (`/api/review-events`).

Streaks track consecutive review days. Miss a day and yours resets. The cron checks every midnight.

### Yard sales

If an album's original submitter has gone inactive and the album has never been AOTD, it becomes rescue-eligible. An active user can claim it: they become the owner and `AlbumOwnershipHistory` records the transfer. The original submitter is still credited in the UI.

### Tags

Users can tag albums. Tags surface as community-curated labels (e.g. genres, moods) and can reference a global suggestion or be freeform. A tag isn't visible publicly (after the AOTD date) until it reaches 3 net upvotes from the community. Votes are attached via Django's `ContentType` framework, same as review reactions.

---

## Other features

**Photos & Clips** — Members upload images/video with user tags. Stored on disk at a configured path, served through the API.

**Quotes** — Submit memorable things said in the server. Falls back to Discord user ID if the speaker isn't a site member.

**Custom Emojis** — Site-wide emoji with name slugs and keyword search. Used in reactions and tags. `use_count` tracks how often each gets used.

**Playback** — On January 1st, a cron job generates site-wide and per-user year-end stats. Highest/lowest rated albums, most controversial by standard deviation, review streaks, reaction counts, photo credits, quote tallies.

---

## Architecture

```
frontend/          Next.js 16, TypeScript, App Router
backend/           Django 5.0, PostgreSQL, Redis

backend/
  aotd/            Album submission, selection, reviews, tags, outages, streaks
  discordapi/      Discord OAuth token exchange + member/role validation
  users/           User model (AbstractUser + discord_id), heartbeat, online status
  reactions/       GenericForeignKey reactions — attaches to any model
  votes/           GenericForeignKey votes — same pattern
  playback/        Year-end stats generation
  photos/          Photo uploads + user tagging
  emojis/          Custom emoji storage + keyword search
  quotes/          Quote submission
  botInteraction/  Reads JSON data written by the Discord bot
  spotifyapi/      Deprecated — removed but retained for historical migration data
```

The `aotd` app is split into multiple view files: `views_album.py`, `views_review.py`, `views_aotd.py`, `views_user.py`, `views_tags.py`, `views_outage.py`, `views_oauth.py`.

---

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

`.env.local`:
```
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_BOT_TOKEN
CORD_SERVER_ID              # Guild ID gating access
CORD_ROLE_ID                # Role required to enter
PHOTOSHOP_PATH              # Disk path for photo uploads
EMOJI_PATH                  # Disk path for emoji files
BACKEND_BASE_URL            # Used for internal server-to-server calls
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
REDIS_CONNECTION_NAMESPACE  # Prefix all Redis keys — prevents dev/prod collision
TENOR_API_KEY
DISCORD_BOT_DATA_FILEPATH
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`.env.development`:
```
NEXT_PUBLIC_DISCORD_AUTH_URL
BASE_BACKEND_URL            # Server-side requests (internal)
BASE_BACKEND_URL_CLIENT     # Client-side requests (public)
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

On Windows: `run_dev.ps1` or `start_dev.bat` opens 4 terminal tabs (Django, Next.js, Redis, watcher).

---

## Deployment

Backend runs in Docker. The Dockerfile deletes `settings_dev.py` so it can't accidentally load in production. The entrypoint runs migrations before starting the server.

Frontend uses `output: 'standalone'` — builds to `.next/standalone` and runs as `node server.js`.

Cron jobs run in a `cron_manager` container:

| Schedule | Job |
|---|---|
| Midnight | Select AOTD, reset streaks, invalidate ISR cache |
| 2:15 AM | Extra cache flush |
| Every 30 min | Recalculate selection probabilities |
| Jan 1 midnight | Generate Playback stats, revalidate Playback cache |

ISR cache invalidation works by having the cron POST to `/api/revalidateAOtD` and `/api/revalidatePlayback`, which call Next.js's `revalidateTag()`. Pages regenerate on the next request.

Prometheus metrics are in `settings_prod.py` only. They must wrap all other middleware to get accurate request counts.

---

## Non-obvious details

**Album cover proxy** — Covers are served through `/api/album-cover/[mbid]` rather than fetched directly from CoverArtArchive. This avoids CORS issues and lets the backend cache aggressively.

**All times are `America/Chicago`** — Streak resets, AOTD date boundaries, calendar views, Playback calculations — everything assumes Central Time. This is load-bearing, not incidental. Backend uses `pytz`.

**Tag voting targets `AlbumTag`, not `GlobalTag`** — The `GlobalTag` is a site-wide concept (created once); `AlbumTag` is its instance on a specific album. Community votes happen on `AlbumTag`. A `GlobalTag` can be referenced by many album tags.

**Audit trail is write-only** — `UserAction` records log every significant create, update, and delete with a JSON snapshot of the data at the time. There's no delete endpoint for `UserAction` records. Album model `delete()` methods log before deleting, so nothing is lost silently.

**Online status** — The heartbeat endpoint (`/users/heartbeat`) updates `last_heartbeat_timestamp`. ≤3 min since last heartbeat = online. >5 min since `last_request` = away. Shown on `/dashboard/about`. Heartbeats can also carry timezone updates.
