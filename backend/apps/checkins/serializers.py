from django.utils import timezone
from rest_framework import serializers

from apps.checkins.models import CheckinLog, Entry


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


class AdminUsageEntrySerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source="reservation.id", read_only=True)
    reservation_date = serializers.DateField(source="reservation.date", read_only=True)
    reservation_start_time = serializers.TimeField(source="reservation.start_time", read_only=True)
    reservation_end_time = serializers.TimeField(source="reservation.end_time", read_only=True)
    user_display_name = serializers.SerializerMethodField()
    usage_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = (
            "id",
            "reservation_id",
            "reservation_date",
            "reservation_start_time",
            "reservation_end_time",
            "user_display_name",
            "dog_name_snapshot",
            "breed_snapshot",
            "size_category_snapshot",
            "weight_kg_snapshot",
            "status",
            "source",
            "checked_in_at",
            "checked_out_at",
            "usage_minutes",
        )

    def get_user_display_name(self, obj: Entry) -> str:
        if obj.user:
            return obj.user.display_name or obj.user.username
        return "-"

    def get_usage_minutes(self, obj: Entry) -> int:
        end_at = obj.checked_out_at or timezone.now()
        elapsed = end_at - obj.checked_in_at
        return max(int(elapsed.total_seconds() // 60), 0)
