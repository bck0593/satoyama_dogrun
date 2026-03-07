import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class FacilityRule(models.Model):
    name = models.CharField(max_length=80, default="default")
    open_time = models.TimeField(default="09:00")
    close_time = models.TimeField(default="17:00")
    slot_minutes = models.PositiveIntegerField(default=60)
    max_total_dogs_per_slot = models.PositiveIntegerField(default=30)
    max_large_dogs_per_slot = models.PositiveIntegerField(default=10)
    max_small_dogs_per_slot = models.PositiveIntegerField(default=20)
    max_dogs_per_owner = models.PositiveIntegerField(default=3)
    allow_restricted_breeds = models.BooleanField(default=False)
    checkin_open_minutes_before = models.PositiveIntegerField(default=30)
    checkin_close_minutes_after_start = models.PositiveIntegerField(default=30)
    auto_checkout_grace_minutes = models.PositiveIntegerField(default=30)
    cancellation_refund_hours = models.PositiveIntegerField(default=24)
    max_no_show_before_suspension = models.PositiveIntegerField(default=2)
    suspension_days = models.PositiveIntegerField(default=14)
    rain_closure_enabled = models.BooleanField(default=False)
    base_fee_per_dog = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("200.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def get_current(cls) -> "FacilityRule":
        rule = cls.objects.first()
        if rule:
            return rule
        return cls.objects.create()


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "決済待ち"
        CONFIRMED = "confirmed", "予約確定"
        CHECKED_IN = "checked_in", "チェックイン済み"
        COMPLETED = "completed", "利用完了"
        CANCELLED = "cancelled", "キャンセル"
        NO_SHOW = "no_show", "無断キャンセル"
        EXPIRED = "expired", "期限切れ"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "未決済"
        PAID = "paid", "決済済み"
        REFUNDED = "refunded", "返金済み"
        FAILED = "failed", "決済失敗"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reservations")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    party_size = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    qr_expires_at = models.DateTimeField(null=True, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    no_show_marked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-start_time", "-created_at"]
        indexes = [
            models.Index(fields=["date", "start_time"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Reservation #{self.pk} {self.date} {self.start_time}"

    @property
    def dog_count(self) -> int:
        return self.reservation_dogs.count()

    @classmethod
    def active_statuses(cls):
        return [cls.Status.PENDING_PAYMENT, cls.Status.CONFIRMED, cls.Status.CHECKED_IN]

    def can_refund(self, refund_window_hours: int) -> bool:
        slot_start = timezone.make_aware(datetime.combine(self.date, self.start_time))
        return timezone.now() <= slot_start - timedelta(hours=refund_window_hours)


class ReservationDog(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="reservation_dogs")
    dog = models.ForeignKey("dogs.Dog", on_delete=models.PROTECT, related_name="reservation_links")
    dog_name = models.CharField(max_length=80)
    breed = models.CharField(max_length=120)
    size_category = models.CharField(max_length=10)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        unique_together = ("reservation", "dog")

    def __str__(self) -> str:
        return f"{self.dog_name} -> reservation {self.reservation_id}"


class NoShowRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="no_show_records")
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="no_show_record")
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"No-show user={self.user_id} reservation={self.reservation_id}"
