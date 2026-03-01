from django.contrib import admin

from apps.checkins.models import CheckinLog


@admin.register(CheckinLog)
class CheckinLogAdmin(admin.ModelAdmin):
    list_display = ("id", "reservation", "action", "source", "duration_minutes", "scanned_at", "scanned_by")
    list_filter = ("action", "source", "scanned_at")
    search_fields = ("reservation__id", "reservation__user__username", "reservation__user__display_name")
