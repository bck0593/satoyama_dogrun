from django.contrib import admin

from apps.checkins.models import CheckinLog, Entry


@admin.register(CheckinLog)
class CheckinLogAdmin(admin.ModelAdmin):
    list_display = ("id", "reservation", "action", "source", "duration_minutes", "scanned_at", "scanned_by")
    list_filter = ("action", "source", "scanned_at")
    search_fields = ("reservation__id", "reservation__user__username", "reservation__user__display_name")


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reservation",
        "user",
        "dog_name_snapshot",
        "breed_snapshot",
        "status",
        "checked_in_at",
        "checked_out_at",
    )
    list_filter = ("status", "source", "checked_in_at", "checked_out_at")
    search_fields = (
        "reservation__id",
        "user__username",
        "user__display_name",
        "dog_name_snapshot",
        "breed_snapshot",
    )
