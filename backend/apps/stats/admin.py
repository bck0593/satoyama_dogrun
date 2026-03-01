from django.contrib import admin

from apps.stats.models import BreedDailyStats, HomeHeroSlide


@admin.register(BreedDailyStats)
class BreedDailyStatsAdmin(admin.ModelAdmin):
    list_display = ("date", "breed", "total_checkins", "unique_dogs", "total_duration_minutes")
    list_filter = ("date", "breed")
    search_fields = ("breed",)


@admin.register(HomeHeroSlide)
class HomeHeroSlideAdmin(admin.ModelAdmin):
    list_display = ("display_order", "title", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "description", "alt_text")
    ordering = ("display_order", "id")
