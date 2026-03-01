from datetime import date

from django.db.models import Count
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservations.models import FacilityRule, Reservation, ReservationDog
from apps.reservations.serializers import (
    ReservationCancelSerializer,
    ReservationCreateSerializer,
    ReservationNoShowSerializer,
    ReservationSerializer,
)
from apps.reservations.services import generate_slot_windows, reconcile_reservation_statuses


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        reconcile_reservation_statuses()
        queryset = Reservation.objects.select_related("user").prefetch_related(
            "reservation_dogs",
            "reservation_dogs__dog",
            "checkin_logs",
        )
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return ReservationCreateSerializer
        return ReservationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        serializer = ReservationCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if reservation.status in [
            Reservation.Status.CANCELLED,
            Reservation.Status.COMPLETED,
            Reservation.Status.NO_SHOW,
            Reservation.Status.CHECKED_IN,
            Reservation.Status.EXPIRED,
        ]:
            return Response({"detail": "この予約はキャンセルできません。"}, status=status.HTTP_400_BAD_REQUEST)

        rule = FacilityRule.get_current()
        should_refund = reservation.payment_status == Reservation.PaymentStatus.PAID and reservation.can_refund(
            rule.cancellation_refund_hours
        )

        reservation.status = Reservation.Status.CANCELLED
        reservation.cancelled_at = timezone.now()
        reservation.note = (reservation.note + "\n" if reservation.note else "") + serializer.validated_data.get("reason", "")
        reservation.save(update_fields=["status", "cancelled_at", "note", "updated_at"])

        return Response(
            {
                "reservation_id": reservation.id,
                "status": reservation.status,
                "refund_eligible": should_refund,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def mark_no_show(self, request, pk=None):
        reservation = self.get_object()
        serializer = ReservationNoShowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.mark_no_show(reservation)
        return Response(ReservationSerializer(reservation).data)


class AdminReservationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reservation.objects.select_related("user").prefetch_related("reservation_dogs", "reservation_dogs__dog", "checkin_logs")


class ReservationAvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "public_availability"

    def get(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        date_query = request.query_params.get("date")
        if not date_query:
            return Response({"detail": "dateは必須です。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = date.fromisoformat(date_query)
        except ValueError:
            return Response({"detail": "dateはYYYY-MM-DD形式で指定してください。"}, status=status.HTTP_400_BAD_REQUEST)

        rule = FacilityRule.get_current()
        if rule.rain_closure_enabled:
            return Response({"date": target_date, "slots": [], "rain_closed": True})

        reservations = (
            ReservationDog.objects.filter(
                reservation__date=target_date,
                reservation__status__in=Reservation.active_statuses(),
            )
            .values("reservation__start_time", "size_category")
            .annotate(count=Count("id"))
        )

        slot_map = {}
        for row in reservations:
            key = str(row["reservation__start_time"])
            bucket = slot_map.setdefault(key, {"total": 0, "large": 0, "small": 0})
            bucket["total"] += row["count"]
            if row["size_category"] == "large":
                bucket["large"] += row["count"]
            if row["size_category"] == "small":
                bucket["small"] += row["count"]

        slots = []
        for start_time, end_time in generate_slot_windows(target_date, rule):
            key = str(start_time)
            counts = slot_map.get(key, {"total": 0, "large": 0, "small": 0})
            slots.append(
                {
                    "start_time": str(start_time),
                    "end_time": str(end_time),
                    "max_total_dogs": rule.max_total_dogs_per_slot,
                    "max_large_dogs": rule.max_large_dogs_per_slot,
                    "max_small_dogs": rule.max_small_dogs_per_slot,
                    "reserved_total": counts["total"],
                    "reserved_large": counts["large"],
                    "reserved_small": counts["small"],
                    "available_total": max(rule.max_total_dogs_per_slot - counts["total"], 0),
                    "available_small": max(rule.max_small_dogs_per_slot - counts["small"], 0),
                }
            )

        return Response({"date": target_date, "slots": slots, "rain_closed": False})
