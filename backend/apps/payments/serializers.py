from rest_framework import serializers

from apps.payments.models import PaymentRecord


class CreateCheckoutSessionSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()


class PaymentHistorySerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source="reservation.id", read_only=True)
    reservation_date = serializers.DateField(source="reservation.date", read_only=True)
    reservation_start_time = serializers.TimeField(source="reservation.start_time", read_only=True)

    class Meta:
        model = PaymentRecord
        fields = (
            "id",
            "reservation_id",
            "reservation_date",
            "reservation_start_time",
            "amount",
            "unit_price",
            "tax",
            "currency",
            "status",
            "refunded_amount",
            "idempotency_key",
            "created_at",
        )
