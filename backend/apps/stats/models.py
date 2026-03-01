from django.db import models


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
