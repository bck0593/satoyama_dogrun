from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.checkins.models import CheckinLog, Entry
from apps.checkins.serializers import CheckinLogSerializer, CheckoutSerializer, QrCheckinSerializer
from apps.reservations.models import FacilityRule, Reservation
from apps.reservations.services import reconcile_reservation_statuses


def _calculate_duration_minutes(reservation: Reservation, checked_out_at) -> int | None:
    if not reservation.checked_in_at:
        return None
    elapsed = checked_out_at - reservation.checked_in_at
    return max(int(elapsed.total_seconds() // 60), 0)


def _build_checkin_window(reservation: Reservation, rule: FacilityRule):
    slot_start = timezone.make_aware(datetime.combine(reservation.date, reservation.start_time))
    slot_end = timezone.make_aware(datetime.combine(reservation.date, reservation.end_time))
    open_at = slot_start - timedelta(minutes=rule.checkin_open_minutes_before)
    close_at = slot_start + timedelta(minutes=rule.checkin_close_minutes_after_start)
    return {
        "slot_start": slot_start,
        "slot_end": slot_end,
        "open_at": open_at,
        "close_at": close_at,
    }


def _evaluate_checkin_eligibility(reservation: Reservation, now, rule: FacilityRule):
    window = _build_checkin_window(reservation, rule)

    if reservation.user.is_suspended:
        return {
            "allowed": False,
            "reason_code": "user_suspended",
            "reason": "利用停止中のためチェックインできません。",
            "window": window,
        }

    if reservation.status == Reservation.Status.CHECKED_IN:
        return {
            "allowed": False,
            "reason_code": "already_checked_in",
            "reason": "この予約はすでにチェックイン済みです。",
            "window": window,
        }

    if reservation.status != Reservation.Status.CONFIRMED:
        return {
            "allowed": False,
            "reason_code": "status_invalid",
            "reason": "チェックイン可能な状態ではありません。",
            "window": window,
        }

    if reservation.qr_expires_at and now > reservation.qr_expires_at:
        return {
            "allowed": False,
            "reason_code": "qr_expired",
            "reason": "QRコードの有効期限が切れています。",
            "window": window,
        }

    if now < window["open_at"]:
        return {
            "allowed": False,
            "reason_code": "too_early",
            "reason": "チェックイン開始前です。",
            "window": window,
        }

    if now > window["close_at"] or now > window["slot_end"]:
        return {
            "allowed": False,
            "reason_code": "outside_window",
            "reason": "チェックイン可能時間外です。",
            "window": window,
        }

    return {
        "allowed": True,
        "reason_code": "ok",
        "reason": "チェックイン可能です。",
        "window": window,
    }


def _build_preview_response(reservation: Reservation, eligibility: dict, now):
    dogs = list(
        reservation.reservation_dogs.values(
            "dog_id",
            "dog_name",
            "breed",
            "size_category",
            "weight_kg",
        )
    )
    window = eligibility["window"]

    return {
        "reservation_id": reservation.id,
        "status": reservation.status,
        "payment_status": reservation.payment_status,
        "user": {
            "id": reservation.user_id,
            "display_name": reservation.user.display_name,
            "suspended_until": reservation.user.suspended_until,
        },
        "slot": {
            "date": reservation.date,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time,
        },
        "dogs": dogs,
        "eligibility": {
            "allowed": eligibility["allowed"],
            "reason_code": eligibility["reason_code"],
            "reason": eligibility["reason"],
        },
        "checkin_window": {
            "open_at": window["open_at"],
            "close_at": window["close_at"],
            "slot_start": window["slot_start"],
            "slot_end": window["slot_end"],
            "qr_expires_at": reservation.qr_expires_at,
            "checked_at": now,
        },
    }


class QrCheckinPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, qr_token, *args, **kwargs):
        reconcile_reservation_statuses()

        try:
            reservation = (
                Reservation.objects.select_related("user")
                .prefetch_related("reservation_dogs")
                .get(qr_token=qr_token)
            )
        except Reservation.DoesNotExist:
            return Response({"detail": "予約が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and reservation.user_id != request.user.id:
            return Response({"detail": "この予約情報を表示できません。"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        rule = FacilityRule.get_current()
        eligibility = _evaluate_checkin_eligibility(reservation=reservation, now=now, rule=rule)

        return Response(_build_preview_response(reservation=reservation, eligibility=eligibility, now=now))


class QrCheckinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        serializer = QrCheckinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            try:
                reservation = (
                    Reservation.objects.select_for_update()
                    .select_related("user")
                    .prefetch_related("reservation_dogs")
                    .get(qr_token=serializer.validated_data["qr_token"])
                )
            except Reservation.DoesNotExist:
                return Response({"detail": "予約が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)

            if not request.user.is_staff and reservation.user_id != request.user.id:
                return Response({"detail": "この予約をチェックインできません。"}, status=status.HTTP_403_FORBIDDEN)

            now = timezone.now()
            rule = FacilityRule.get_current()
            eligibility = _evaluate_checkin_eligibility(reservation=reservation, now=now, rule=rule)

            if not eligibility["allowed"]:
                if eligibility["reason_code"] == "already_checked_in":
                    return Response(
                        {
                            "detail": eligibility["reason"],
                            "reservation_id": reservation.id,
                            "status": reservation.status,
                            "checked_in_at": reservation.checked_in_at,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                return Response({"detail": eligibility["reason"]}, status=status.HTTP_400_BAD_REQUEST)

            reservation.status = Reservation.Status.CHECKED_IN
            reservation.checked_in_at = now
            reservation.save(update_fields=["status", "checked_in_at", "updated_at"])

            checkin_log = CheckinLog.objects.create(
                reservation=reservation,
                action=CheckinLog.Action.CHECK_IN,
                source="qr",
                scanned_by=request.user,
                metadata={"scanned_by": request.user.id},
            )

            entries = []
            for link in reservation.reservation_dogs.all():
                entries.append(
                    Entry(
                        reservation=reservation,
                        user=reservation.user,
                        dog_id=link.dog_id,
                        dog_name_snapshot=link.dog_name,
                        breed_snapshot=link.breed,
                        size_category_snapshot=link.size_category,
                        weight_kg_snapshot=link.weight_kg,
                        checked_in_at=now,
                        status=Entry.Status.IN,
                        source="qr",
                        metadata={"checkin_log_id": checkin_log.id},
                    )
                )
            if entries:
                Entry.objects.bulk_create(entries)

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

        with transaction.atomic():
            try:
                reservation = (
                    Reservation.objects.select_for_update()
                    .prefetch_related("reservation_dogs")
                    .get(id=serializer.validated_data["reservation_id"])
                )
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

            active_entries = Entry.objects.filter(
                reservation=reservation,
                status=Entry.Status.IN,
                checked_out_at__isnull=True,
            )
            updated_count = active_entries.update(
                status=Entry.Status.OUT,
                checked_out_at=checked_out_at,
                updated_at=checked_out_at,
            )

            if updated_count == 0:
                backfill_entries = [
                    Entry(
                        reservation=reservation,
                        user=reservation.user,
                        dog_id=link.dog_id,
                        dog_name_snapshot=link.dog_name,
                        breed_snapshot=link.breed,
                        size_category_snapshot=link.size_category,
                        weight_kg_snapshot=link.weight_kg,
                        checked_in_at=reservation.checked_in_at or checked_out_at,
                        checked_out_at=checked_out_at,
                        status=Entry.Status.OUT,
                        source="admin",
                        metadata={"created_by": "checkout_backfill"},
                    )
                    for link in reservation.reservation_dogs.all()
                ]
                if backfill_entries:
                    Entry.objects.bulk_create(backfill_entries)

        return Response({"reservation_id": reservation.id, "status": reservation.status})


class CheckinLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CheckinLogSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CheckinLog.objects.select_related("reservation", "reservation__user").all()
