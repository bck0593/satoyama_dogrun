from rest_framework import serializers

from apps.checkins.models import CheckinLog


class QrCheckinSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField()


class CheckoutSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()


class CheckinLogSerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source="reservation.id", read_only=True)
    user_display_name = serializers.CharField(source="reservation.user.display_name", read_only=True)

    class Meta:
        model = CheckinLog
        fields = (
            "id",
            "reservation_id",
            "user_display_name",
            "action",
            "source",
            "scanned_at",
            "duration_minutes",
            "metadata",
        )
