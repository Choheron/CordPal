from django.contrib import admin
from .models import (
    AotdUserData, Album, DailyAlbum, Review, ReviewHistory,
    UserAlbumOutage, UserChanceCache, GlobalTag, AlbumTag
)


@admin.register(AotdUserData)
class AotdUserDataAdmin(admin.ModelAdmin):
    list_display = ('user', 'active', 'selection_blocked_flag', 'total_reviews', 'average_review_score', 'current_streak', 'total_submissions', 'creation_timestamp')
    list_filter = ('active', 'selection_blocked_flag')
    search_fields = ('user__username', 'user__nickname')
    readonly_fields = ('creation_timestamp',)


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'submitted_by', 'submission_date', 'hidden')
    list_filter = ('hidden',)
    search_fields = ('title', 'artist', 'mbid')
    readonly_fields = ('submission_date',)


@admin.register(DailyAlbum)
class DailyAlbumAdmin(admin.ModelAdmin):
    list_display = ('date', 'album', 'rating', 'standard_deviation', 'manual')
    list_filter = ('manual',)
    search_fields = ('album__title', 'album__artist')
    ordering = ('-date',)
    readonly_fields = ('rating_timeline',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'album', 'aotd_date', 'score', 'first_listen', 'version', 'review_date')
    list_filter = ('first_listen', 'advanced')
    search_fields = ('user__username', 'user__nickname', 'album__title')
    ordering = ('-review_date',)
    readonly_fields = ('review_date', 'last_updated')


@admin.register(ReviewHistory)
class ReviewHistoryAdmin(admin.ModelAdmin):
    list_display = ('review', 'aotd_date', 'score', 'version', 'recorded_at')
    search_fields = ('review__user__nickname', 'review__album__title')
    ordering = ('-recorded_at',)
    readonly_fields = ('recorded_at',)


@admin.register(UserAlbumOutage)
class UserAlbumOutageAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_date', 'end_date', 'admin_enacted', 'admin_enactor', 'creation_timestamp')
    list_filter = ('admin_enacted',)
    search_fields = ('user__username', 'user__nickname', 'reason')
    readonly_fields = ('creation_timestamp',)


@admin.register(UserChanceCache)
class UserChanceCacheAdmin(admin.ModelAdmin):
    list_display = ('aotd_user', 'chance_percentage', 'block_type', 'last_updated')
    list_filter = ('block_type',)
    search_fields = ('aotd_user__user__nickname',)
    readonly_fields = ('last_updated',)


@admin.register(GlobalTag)
class GlobalTagAdmin(admin.ModelAdmin):
    list_display = ('text', 'created_by', 'created_at')
    search_fields = ('text',)


@admin.register(AlbumTag)
class AlbumTagAdmin(admin.ModelAdmin):
    list_display = ('tag_text', 'album', 'submitted_by', 'is_approved', 'submitted_at')
    list_filter = ('is_approved',)
    search_fields = ('tag_text', 'album__title')