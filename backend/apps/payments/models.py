from decimal import Decimal

from django.db import models


class PaymentRecord(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "作成済み"
        PAID = "paid", "決済済み"
        FAILED = "failed", "失敗"
        REFUNDED = "refunded", "返金済み"

    reservation = models.ForeignKey("reservations.Reservation", on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, default="stripe")
    checkout_session_id = models.CharField(max_length=255, blank=True, db_index=True)
    payment_intent_id = models.CharField(max_length=255, blank=True, db_index=True)
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    unit_price = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    currency = models.CharField(max_length=8, default="jpy")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    refunded_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    idempotency_key = models.CharField(max_length=120, blank=True, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    webhook_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Payment reservation={self.reservation_id} status={self.status}"
