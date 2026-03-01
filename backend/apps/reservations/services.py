from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone

from apps.reservations.models import FacilityRule, Reservation


def generate_slot_windows(target_date, rule: FacilityRule):
    current = datetime.combine(target_date, rule.open_time)
    close = datetime.combine(target_date, rule.close_time)
    step = timedelta(minutes=rule.slot_minutes)

    slots = []
    while current + step <= close:
        slots.append((current.time(), (current + step).time()))
        current += step
    return slots


def expire_unpaid_reservations(now=None) -> int:
    current = now or timezone.now()
    target_date = current.date()
    target_time = current.time()

    queryset = Reservation.objects.filter(status=Reservation.Status.PENDING_PAYMENT).filter(
        Q(date__lt=target_date) | Q(date=target_date, start_time__lte=target_time)
    )
    return queryset.update(status=Reservation.Status.EXPIRED, updated_at=current)


def auto_checkout_checked_in_reservations(rule: FacilityRule, now=None) -> int:
    current = now or timezone.now()
    grace = timedelta(minutes=rule.auto_checkout_grace_minutes)

    candidates = (
        Reservation.objects.filter(status=Reservation.Status.CHECKED_IN)
        .filter(Q(date__lt=current.date()) | Q(date=current.date(), end_time__lte=current.time()))
        .select_related("user")
    )

    checkout_count = 0
    checked_out_rows = []
    for reservation in candidates:
        slot_end = timezone.make_aware(datetime.combine(reservation.date, reservation.end_time))
        if current > slot_end + grace:
            duration_minutes = None
            if reservation.checked_in_at:
                elapsed = current - reservation.checked_in_at
                duration_minutes = max(int(elapsed.total_seconds() // 60), 0)
            reservation.status = Reservation.Status.COMPLETED
            reservation.save(update_fields=["status", "updated_at"])
            checked_out_rows.append(
                {
                    "reservation_id": reservation.id,
                    "duration_minutes": duration_minutes,
                }
            )
            checkout_count += 1

    if checked_out_rows:
        from apps.checkins.models import CheckinLog

        CheckinLog.objects.bulk_create(
            [
                CheckinLog(
                    reservation_id=row["reservation_id"],
                    action=CheckinLog.Action.CHECK_OUT,
                    source="system",
                    scanned_by=None,
                    duration_minutes=row["duration_minutes"],
                    metadata={"reason": "auto_checkout_by_grace_rule"},
                )
                for row in checked_out_rows
            ]
        )

    return checkout_count


def reconcile_reservation_statuses(now=None) -> dict[str, int]:
    current = now or timezone.now()
    rule = FacilityRule.get_current()
    expired_count = expire_unpaid_reservations(current)
    auto_checkout_count = auto_checkout_checked_in_reservations(rule=rule, now=current)
    return {"expired_count": expired_count, "auto_checkout_count": auto_checkout_count}
