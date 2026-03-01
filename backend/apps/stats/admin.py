from django.contrib import admin

from apps.stats.models import BreedDailyStats


@admin.register(BreedDailyStats)
class BreedDailyStatsAdmin(admin.ModelAdmin):
    list_display = ("date", "breed", "total_checkins", "unique_dogs", "total_duration_minutes")
    list_filter = ("date", "breed")
    search_fields = ("breed",)
