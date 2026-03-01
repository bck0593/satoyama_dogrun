from django.conf import settings
from django.db import models


class CheckinLog(models.Model):
    class Action(models.TextChoices):
        CHECK_IN = "check_in", "チェックイン"
        CHECK_OUT = "check_out", "チェックアウト"

    reservation = models.ForeignKey("reservations.Reservation", on_delete=models.CASCADE, related_name="checkin_logs")
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="performed_checkins",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    source = models.CharField(max_length=20, default="qr")
    scanned_at = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-scanned_at"]

    def __str__(self) -> str:
        return f"{self.action} reservation={self.reservation_id}"


class Entry(models.Model):
    class Status(models.TextChoices):
        IN = "in", "入場中"
        OUT = "out", "退場済み"
        INVALID = "invalid", "無効"

    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entries",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entries",
    )
    dog = models.ForeignKey(
        "dogs.Dog",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entries",
    )
    dog_name_snapshot = models.CharField(max_length=80)
    breed_snapshot = models.CharField(max_length=120)
    size_category_snapshot = models.CharField(max_length=10)
    weight_kg_snapshot = models.DecimalField(max_digits=5, decimal_places=2)
    checked_in_at = models.DateTimeField()
    checked_out_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.IN)
    source = models.CharField(max_length=20, default="qr")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-checked_in_at", "-id"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["checked_in_at"]),
            models.Index(fields=["reservation"]),
            models.Index(fields=["dog"]),
        ]

    def __str__(self) -> str:
        return f"entry reservation={self.reservation_id} dog={self.dog_id} status={self.status}"
