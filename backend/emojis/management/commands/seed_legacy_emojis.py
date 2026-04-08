"""
Management command to seed the 13 legacy custom emojis that were previously
hardcoded in emoji_mart_popover.tsx with Discord CDN URLs.

Downloads each emoji from Discord CDN, stores it locally, creates a CustomEmoji
DB record, then performs a second pass updating all existing data (Reactions,
AlbumTags, GlobalTags, Reviews, ReviewHistory) that reference the old Discord
CDN URLs so they point to the new local serve endpoints.

Usage:
  python manage.py seed_legacy_emojis --default-user <discord_id>

Flags:
  --default-user   Discord ID of the user to set as submitted_by for all legacy emojis
  --dry-run        Print what would happen without writing anything to disk or DB
  --skip-data-update  Seed emojis only; skip the existing-data URL update pass
"""

import os
import re
import uuid

import requests
from dotenv import load_dotenv
from django.core.management.base import BaseCommand, CommandError

APP_ENV = os.getenv('APP_ENV') or 'DEV'
load_dotenv(".env.production" if APP_ENV == "PROD" else ".env.local")
from django.db import transaction

from emojis.models import CustomEmoji
from users.models import User


# ─────────────────────────────────────────────────────────────────────────────
# Legacy emoji data sourced from emoji_mart_popover.tsx
# Format: (slug, display_name, keywords_list, discord_cdn_id)
# ─────────────────────────────────────────────────────────────────────────────
LEGACY_EMOJIS = [
    ('tfw',          'TFW',           ['tfw', 'knee surgery'],            '1310014250789371976'),
    ('dogi',         'Dogi',          ['dogi', 'dog', 'sad'],             '1430310636742774904'),
    ('soynik',       'Soynik',        ['soy', 'nik', 'jak'],              '1375613103089254461'),
    ('cringe',       'Cringe',        ['cringe'],                          '1367864039639744523'),
    ('proprat',      'Propeller Rat', ['rat', 'propellar', 'propellarRat'],'1410019637579485344'),
    ('laughing_rat', 'Laughing Rat',  ['rat', 'laugh', 'joy', 'funny'],   '683873459834454031'),
    ('cowboy_rat',   'Cowboy Rat',    ['cowboy', 'rat', 'yeehaw'],         '1384923211384357005'),
    ('gigachad',     'Gigachad',      ['gigachad', 'giga', 'chad'],        '926282130890293298'),
    ('duckcock',     'Duckcock',      ['duck', 'cock', 'duckcock'],        '743581643662688367'),
    ('mike_rat',     'MikeRat',       ['mike', 'rat', 'mikerat'],          '1368623628110921798'),
    ('rat_grab',     'RatGrab',       ['grab', 'rat', 'grabrat', 'ratgrab'],'676632269611597834'),
    ('pointin_rat',  'PointinRat',    ['point', 'rat', 'pointrat'],        '1027788393171669002'),
    ('blair_rat',    'BlairRat',      ['blair', 'rat', 'blairrat'],        '1368628543042355230'),
]

# Download at 256px — good quality for emoji use, reasonable file size
CDN_URL_TEMPLATE = 'https://cdn.discordapp.com/emojis/{discord_id}.webp?size=256'

# Match any Discord CDN URL for a given emoji ID, regardless of extension or query params
# e.g. matches: .webp?size=40  .png  .gif?size=96  etc.
CDN_PATTERN_TEMPLATE = r'https://cdn\.discordapp\.com/emojis/{discord_id}[^\s"\'<>]*'


class Command(BaseCommand):
    help = 'Seeds the 13 legacy custom emojis from Discord CDN and migrates existing data URLs.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--default-user',
            type=str,
            required=True,
            help='Discord ID of the user to attribute legacy emoji submissions to.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print actions without writing anything to disk or DB.',
        )
        parser.add_argument(
            '--skip-data-update',
            action='store_true',
            help='Only seed emojis; skip updating existing Reactions, Tags, and Reviews.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        skip_data_update = options['skip_data_update']
        discord_id = options['default_user']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be written.\n'))

        # ── Resolve default user ──────────────────────────────────────────────
        try:
            default_user = User.objects.get(discord_id=discord_id)
        except User.DoesNotExist:
            raise CommandError(f'No user found with discord_id="{discord_id}". Aborting.')

        self.stdout.write(f'Default user: {default_user.nickname} ({discord_id})\n')

        # ── Resolve EMOJI_PATH ────────────────────────────────────────────────
        emoji_path = os.getenv('EMOJI_PATH')
        if not emoji_path:
            raise CommandError('EMOJI_PATH environment variable is not set. Aborting.')
        if not dry_run and not os.path.isdir(emoji_path):
            raise CommandError(
                f'EMOJI_PATH directory does not exist: {emoji_path}\n'
                'Create it first: mkdir -p {emoji_path}'
            )

        # ── Resolve BACKEND_BASE_URL for serve URL construction ───────────────
        backend_base_url = os.getenv('BACKEND_BASE_URL', '').rstrip('/')
        if not backend_base_url:
            raise CommandError(
                'BACKEND_BASE_URL environment variable is not set.\n'
                'This is required to construct the serve URLs for the data update pass.\n'
                'Set it (e.g. http://localhost:8000) then re-run.'
            )

        # ─────────────────────────────────────────────────────────────────────
        # PASS 1: Seed legacy emojis
        # ─────────────────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Pass 1: Seeding legacy emojis ===\n'))

        # Track (discord_cdn_id → CustomEmoji) for the data update pass
        seeded_emojis: dict[str, CustomEmoji] = {}

        for slug, display_name, keywords, cdn_id in LEGACY_EMOJIS:
            # Check if already seeded
            existing = CustomEmoji.objects.filter(name=slug).first()
            if existing:
                self.stdout.write(f'  SKIP  {slug} — already exists (emoji_id={existing.emoji_id})')
                seeded_emojis[cdn_id] = existing
                continue

            cdn_url = CDN_URL_TEMPLATE.format(discord_id=cdn_id)
            self.stdout.write(f'  GET   {slug} ← {cdn_url}')

            if dry_run:
                self.stdout.write(f'        [dry-run] would download and save as {{uuid}}_{slug}.webp')
                continue

            # Download from Discord CDN
            try:
                response = requests.get(cdn_url, timeout=15)
                response.raise_for_status()
            except requests.RequestException as exc:
                self.stdout.write(
                    self.style.WARNING(f'  WARN  {slug} — download failed: {exc}. Skipping.')
                )
                continue

            # Determine content type
            content_type = response.headers.get('Content-Type', 'image/webp').split(';')[0].strip()

            # Save file to EMOJI_PATH
            filename = f'{uuid.uuid4().hex}_{slug}.webp'
            file_path = os.path.join(emoji_path, filename)
            with open(file_path, 'wb') as f:
                f.write(response.content)

            # Create DB record — skip_action_log suppresses the CREATE UserAction
            # so the audit log isn't polluted with bulk historical imports
            with transaction.atomic():
                emoji_obj = CustomEmoji(
                    name=slug,
                    display_name=display_name,
                    keywords=keywords,
                    filename=filename,
                    filetype=content_type,
                    submitted_by=default_user,
                    submitted_at=None,          # legacy — no meaningful submission date
                    hide_submitted_at=True,     # suppress date display in UI
                    use_count=0,
                    is_active=True,
                )
                emoji_obj.save(skip_action_log=True)

            seeded_emojis[cdn_id] = emoji_obj
            self.stdout.write(
                self.style.SUCCESS(f'  OK    {slug} → saved as {filename} (emoji_id={emoji_obj.emoji_id})')
            )

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDry run complete — skipping data update pass.\n'))
            return

        if skip_data_update:
            self.stdout.write('\n--skip-data-update set. Done.\n')
            return

        if not seeded_emojis:
            self.stdout.write('\nNo emojis were seeded or found — skipping data update pass.\n')
            return

        # ─────────────────────────────────────────────────────────────────────
        # PASS 2: Update existing data that references old Discord CDN URLs
        # ─────────────────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Pass 2: Updating existing data ===\n'))

        # Build (cdn_id → new_serve_url) mapping for all emojis we know about
        url_map: dict[str, str] = {}
        for cdn_id, emoji_obj in seeded_emojis.items():
            url_map[cdn_id] = f'{backend_base_url}/emojis/serve/{emoji_obj.emoji_id}/'

        self._update_reactions(url_map)
        self._update_album_tags(url_map)
        self._update_global_tags(url_map)
        self._update_reviews(url_map)
        self._update_review_history(url_map)

        self.stdout.write(self.style.SUCCESS('\nAll done.\n'))

    # ─────────────────────────────────────────────────────────────────────────
    # Data update helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _update_reactions(self, url_map: dict[str, str]):
        """Update Reaction.emoji for rows that store Discord CDN URLs."""
        from reactions.models import Reaction

        total_updated = 0
        for cdn_id, new_url in url_map.items():
            # Match any CDN URL containing this emoji ID, regardless of extension/params
            qs = Reaction.objects.filter(
                custom_emoji=True,
                emoji__contains=f'cdn.discordapp.com/emojis/{cdn_id}',
            )
            count = qs.count()
            if count:
                qs.update(emoji=new_url)
                self.stdout.write(f'  Reactions   — updated {count} row(s) for CDN ID {cdn_id}')
                total_updated += count

        self.stdout.write(f'  Reactions total: {total_updated} updated')

    def _update_album_tags(self, url_map: dict[str, str]):
        """Update AlbumTag.emoji for rows that store Discord CDN URLs."""
        from aotd.models import AlbumTag

        total_updated = 0
        for cdn_id, new_url in url_map.items():
            qs = AlbumTag.objects.filter(
                emoji__contains=f'cdn.discordapp.com/emojis/{cdn_id}',
            )
            count = qs.count()
            if count:
                qs.update(emoji=new_url)
                self.stdout.write(f'  AlbumTags   — updated {count} row(s) for CDN ID {cdn_id}')
                total_updated += count

        self.stdout.write(f'  AlbumTags total: {total_updated} updated')

    def _update_global_tags(self, url_map: dict[str, str]):
        """Update GlobalTag.emoji for rows that store Discord CDN URLs."""
        from aotd.models import GlobalTag

        total_updated = 0
        for cdn_id, new_url in url_map.items():
            qs = GlobalTag.objects.filter(
                emoji__contains=f'cdn.discordapp.com/emojis/{cdn_id}',
            )
            count = qs.count()
            if count:
                qs.update(emoji=new_url)
                self.stdout.write(f'  GlobalTags  — updated {count} row(s) for CDN ID {cdn_id}')
                total_updated += count

        self.stdout.write(f'  GlobalTags total: {total_updated} updated')

    def _update_reviews(self, url_map: dict[str, str]):
        """
        Update Review.review_text HTML — custom emojis are embedded as
        <img src="https://cdn.discordapp.com/emojis/..." class="customEmoji">
        Replace the src URL with the new local serve URL.
        """
        from aotd.models import Review

        total_updated = 0
        # Fetch reviews that contain any Discord CDN emoji URL
        reviews = Review.objects.filter(review_text__contains='cdn.discordapp.com/emojis/')

        for review in reviews:
            new_text, changed = self._replace_cdn_urls_in_html(review.review_text, url_map)
            if changed:
                Review.objects.filter(pk=review.pk).update(review_text=new_text)
                total_updated += 1

        self.stdout.write(f'  Reviews total: {total_updated} updated')

    def _update_review_history(self, url_map: dict[str, str]):
        """Same as _update_reviews but for ReviewHistory snapshots."""
        from aotd.models import ReviewHistory

        total_updated = 0
        history_qs = ReviewHistory.objects.filter(review_text__contains='cdn.discordapp.com/emojis/')

        for entry in history_qs:
            new_text, changed = self._replace_cdn_urls_in_html(entry.review_text, url_map)
            if changed:
                ReviewHistory.objects.filter(pk=entry.pk).update(review_text=new_text)
                total_updated += 1

        self.stdout.write(f'  ReviewHistory total: {total_updated} updated')

    def _replace_cdn_urls_in_html(self, html: str, url_map: dict[str, str]) -> tuple[str, bool]:
        """
        Replace all Discord CDN emoji URLs in an HTML string with the mapped
        local serve URLs. Returns (new_html, was_changed).
        """
        if not html:
            return html, False

        changed = False
        for cdn_id, new_url in url_map.items():
            pattern = CDN_PATTERN_TEMPLATE.format(discord_id=re.escape(cdn_id))
            new_html = re.sub(pattern, new_url, html)
            if new_html != html:
                html = new_html
                changed = True

        return html, changed
