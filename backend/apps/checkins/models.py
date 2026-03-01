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
