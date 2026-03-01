from django.db import models

from apps.common.validators import validate_image_extension, validate_image_size


class BreedDailyStats(models.Model):
    date = models.DateField()
    breed = models.CharField(max_length=120)
    total_checkins = models.IntegerField(default=0)
    unique_dogs = models.IntegerField(default=0)
    total_duration_minutes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-total_checkins", "breed"]
        constraints = [
            models.UniqueConstraint(fields=["date", "breed"], name="uniq_breed_daily_stats_date_breed"),
        ]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["breed"]),
        ]

    def __str__(self) -> str:
        return f"{self.date} {self.breed} ({self.total_checkins})"


class HomeHeroSlide(models.Model):
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    image = models.ImageField(
        upload_to="content/home-hero/",
        validators=[validate_image_extension, validate_image_size],
    )
    alt_text = models.CharField(max_length=120, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self) -> str:
        return f"{self.display_order}: {self.title}"
