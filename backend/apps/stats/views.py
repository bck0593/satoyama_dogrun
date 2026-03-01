from datetime import date, datetime, timedelta

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.checkins.models import CheckinLog
from apps.dogs.models import Dog
from apps.payments.models import PaymentRecord
from apps.reservations.models import FacilityRule, Reservation, ReservationDog
from apps.reservations.services import reconcile_reservation_statuses
from apps.stats.models import BreedDailyStats


def _active_reservation_dogs(now: datetime):
    active_reservations = Reservation.objects.filter(
        date=now.date(),
        status=Reservation.Status.CHECKED_IN,
        start_time__lte=now.time(),
        end_time__gte=now.time(),
    )
    return ReservationDog.objects.filter(reservation__in=active_reservations)


class CurrentStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        now = timezone.localtime()
        active_links = _active_reservation_dogs(now)
        current_dogs = active_links.count()
        breed_counts = list(active_links.values("breed").annotate(count=Count("id")).order_by("-count", "breed"))
        dogs = list(
            active_links.values("dog_name", "breed", "size_category").order_by("dog_name", "id")
        )

        size_rows = active_links.values("size_category").annotate(count=Count("id"))
        size_counts = {row["size_category"]: row["count"] for row in size_rows}

        rule = FacilityRule.get_current()
        max_capacity = rule.max_total_dogs_per_slot
        ratio = current_dogs / max_capacity if max_capacity else 0

        if ratio >= 1:
            congestion = "full"
        elif ratio >= 0.75:
            congestion = "high"
        elif ratio >= 0.4:
            congestion = "medium"
        else:
            congestion = "low"

        return Response(
            {
                "timestamp": now,
                "current_dogs": current_dogs,
                "total_dogs": current_dogs,
                "large_dogs": size_counts.get(Dog.SizeCategory.LARGE, 0),
                "medium_dogs": size_counts.get(Dog.SizeCategory.MEDIUM, 0),
                "small_dogs": size_counts.get(Dog.SizeCategory.SMALL, 0),
                "max_capacity": max_capacity,
                "available": max(max_capacity - current_dogs, 0),
                "congestion": congestion,
                "breed_counts": breed_counts,
                "breeds": breed_counts,
                "dogs": dogs,
            }
        )


class BreedStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        period = request.query_params.get("period", "daily").lower()
        now = timezone.localtime()

        try:
            if period == "realtime":
                data = list(_active_reservation_dogs(now).values("breed").annotate(count=Count("id")).order_by("-count", "breed"))
                return Response(
                    {
                        "period": "realtime",
                        "target_date": now.date(),
                        "data": data,
                        "generated_at": now,
                    }
                )

            if period == "daily":
                target_date = self._parse_daily_target_date(request.query_params.get("date"), default=now.date())
                rows = list(
                    BreedDailyStats.objects.filter(date=target_date)
                    .values("breed")
                    .annotate(count=Coalesce(Sum("total_checkins"), 0), unique_dogs=Coalesce(Sum("unique_dogs"), 0))
                    .order_by("-count", "breed")
                )
                return Response(
                    {
                        "period": "daily",
                        "target_date": target_date,
                        "data": rows,
                        "generated_at": now,
                    }
                )

            if period == "monthly":
                month_start, month_end = self._parse_month_range(request.query_params.get("month"), default=now.date())
                rows = list(
                    BreedDailyStats.objects.filter(date__gte=month_start, date__lt=month_end)
                    .values("breed")
                    .annotate(count=Coalesce(Sum("total_checkins"), 0), unique_dogs=Coalesce(Sum("unique_dogs"), 0))
                    .order_by("-count", "breed")
                )
                return Response(
                    {
                        "period": "monthly",
                        "target_month": month_start.strftime("%Y-%m"),
                        "data": rows,
                        "generated_at": now,
                    }
                )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        return Response({"detail": "periodはdaily/monthly/realtimeのいずれかを指定してください。"}, status=400)

    @staticmethod
    def _parse_daily_target_date(date_str: str | None, default: date) -> date:
        if not date_str:
            return default
        try:
            return date.fromisoformat(date_str)
        except ValueError as exc:
            raise ValueError("dateはYYYY-MM-DD形式で指定してください。") from exc

    @staticmethod
    def _parse_month_range(month_str: str | None, default: date) -> tuple[date, date]:
        if month_str:
            try:
                month_start = datetime.strptime(month_str, "%Y-%m").date().replace(day=1)
            except ValueError as exc:
                raise ValueError("monthはYYYY-MM形式で指定してください。") from exc
        else:
            month_start = default.replace(day=1)

        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        return month_start, month_end


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        reconcile_reservation_statuses()

        today = timezone.localdate()
        sales_today = (
            PaymentRecord.objects.filter(status=PaymentRecord.Status.PAID, created_at__date=today).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        return Response(
            {
                "today_date": today,
                "members": User.objects.count(),
                "dogs": Dog.objects.count(),
                "today_reservations": Reservation.objects.filter(date=today).count(),
                "today_checkins": CheckinLog.objects.filter(action=CheckinLog.Action.CHECK_IN, scanned_at__date=today).count(),
                "active_checkins": Reservation.objects.filter(
                    date=today,
                    status=Reservation.Status.CHECKED_IN,
                ).count(),
                "pending_payment": Reservation.objects.filter(
                    date=today,
                    status=Reservation.Status.PENDING_PAYMENT,
                ).count(),
                "no_show_today": Reservation.objects.filter(
                    date=today,
                    status=Reservation.Status.NO_SHOW,
                ).count(),
                "sales_today": sales_today,
            }
        )
