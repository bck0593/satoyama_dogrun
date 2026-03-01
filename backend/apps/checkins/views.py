from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.checkins.models import CheckinLog
from apps.checkins.serializers import CheckinLogSerializer, CheckoutSerializer, QrCheckinSerializer
from apps.reservations.models import FacilityRule, Reservation
from apps.reservations.services import reconcile_reservation_statuses


def _calculate_duration_minutes(reservation: Reservation, checked_out_at) -> int | None:
    if not reservation.checked_in_at:
        return None
    elapsed = checked_out_at - reservation.checked_in_at
    return max(int(elapsed.total_seconds() // 60), 0)


class QrCheckinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        serializer = QrCheckinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reservation = Reservation.objects.select_related("user").get(qr_token=serializer.validated_data["qr_token"])
        except Reservation.DoesNotExist:
            return Response({"detail": "予約が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and reservation.user_id != request.user.id:
            return Response({"detail": "この予約をチェックインできません。"}, status=status.HTTP_403_FORBIDDEN)

        if reservation.status not in [Reservation.Status.CONFIRMED, Reservation.Status.CHECKED_IN]:
            return Response({"detail": "チェックイン可能な状態ではありません。"}, status=status.HTTP_400_BAD_REQUEST)

        rule = FacilityRule.get_current()
        slot_start = timezone.make_aware(datetime.combine(reservation.date, reservation.start_time))
        slot_end = timezone.make_aware(datetime.combine(reservation.date, reservation.end_time))
        open_at = slot_start - timedelta(minutes=rule.checkin_open_minutes_before)
        close_at = slot_start + timedelta(minutes=rule.checkin_close_minutes_after_start)
        now = timezone.now()

        if reservation.qr_expires_at and now > reservation.qr_expires_at:
            return Response({"detail": "QRコードの有効期限が切れています。"}, status=status.HTTP_400_BAD_REQUEST)

        if now < open_at or now > close_at or now > slot_end:
            return Response({"detail": "チェックイン可能時間外です。"}, status=status.HTTP_400_BAD_REQUEST)

        if reservation.status != Reservation.Status.CHECKED_IN:
            reservation.status = Reservation.Status.CHECKED_IN
            reservation.checked_in_at = now
            reservation.save(update_fields=["status", "checked_in_at", "updated_at"])
            CheckinLog.objects.create(
                reservation=reservation,
                action=CheckinLog.Action.CHECK_IN,
                source="qr",
                scanned_by=request.user,
                metadata={"scanned_by": request.user.id},
            )

        return Response(
            {
                "reservation_id": reservation.id,
                "status": reservation.status,
                "checked_in_at": reservation.checked_in_at,
            }
        )


class CheckoutView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reservation = Reservation.objects.get(id=serializer.validated_data["reservation_id"])
        except Reservation.DoesNotExist:
            return Response({"detail": "予約が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)

        if reservation.status != Reservation.Status.CHECKED_IN:
            return Response({"detail": "チェックアウト可能な状態ではありません。"}, status=status.HTTP_400_BAD_REQUEST)

        checked_out_at = timezone.now()
        duration_minutes = _calculate_duration_minutes(reservation, checked_out_at)

        reservation.status = Reservation.Status.COMPLETED
        reservation.save(update_fields=["status", "updated_at"])

        CheckinLog.objects.create(
            reservation=reservation,
            action=CheckinLog.Action.CHECK_OUT,
            source="admin",
            scanned_by=request.user,
            duration_minutes=duration_minutes,
            metadata={"checked_out_by": request.user.id},
        )

        return Response({"reservation_id": reservation.id, "status": reservation.status})


class CheckinLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CheckinLogSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CheckinLog.objects.select_related("reservation", "reservation__user").all()
