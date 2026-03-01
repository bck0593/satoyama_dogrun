from collections import defaultdict
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from apps.checkins.models import Entry
from apps.stats.models import BreedDailyStats


def rebuild_for_date(target_date: date) -> int:
    entries = Entry.objects.filter(checked_in_at__date=target_date).exclude(status=Entry.Status.INVALID)

    breed_rows = list(
        entries.values("breed_snapshot")
        .annotate(total_checkins=Count("id"), unique_dogs=Count("dog_id", distinct=True))
        .order_by()
    )

    duration_by_breed: dict[str, int] = defaultdict(int)
    duration_rows = entries.filter(checked_out_at__isnull=False).values(
        "breed_snapshot",
        "checked_in_at",
        "checked_out_at",
    )
    for row in duration_rows:
        elapsed = row["checked_out_at"] - row["checked_in_at"]
        minutes = max(int(elapsed.total_seconds() // 60), 0)
        duration_by_breed[row["breed_snapshot"]] += minutes

    with transaction.atomic():
        BreedDailyStats.objects.filter(date=target_date).delete()
        BreedDailyStats.objects.bulk_create(
            [
                BreedDailyStats(
                    date=target_date,
                    breed=row["breed_snapshot"],
                    total_checkins=row["total_checkins"],
                    unique_dogs=row["unique_dogs"],
                    total_duration_minutes=duration_by_breed.get(row["breed_snapshot"], 0),
                )
                for row in breed_rows
            ]
        )

    return len(breed_rows)


class Command(BaseCommand):
    help = "Rebuild BreedDailyStats from Entry records."

    def add_arguments(self, parser):
        parser.add_argument("--date", type=str, default=None, help="Target date (YYYY-MM-DD). Defaults to today.")
        parser.add_argument(
            "--days",
            type=int,
            default=1,
            help="How many days to rebuild from target date backward. Defaults to 1.",
        )

    def handle(self, *args, **options):
        date_str = options["date"]
        days = options["days"]
        if days < 1:
            raise CommandError("--days は1以上で指定してください。")

        if date_str:
            try:
                anchor = date.fromisoformat(date_str)
            except ValueError as exc:
                raise CommandError("--date はYYYY-MM-DD形式で指定してください。") from exc
        else:
            anchor = timezone.localdate()

        total_rows = 0
        for offset in range(days):
            target = anchor - timedelta(days=offset)
            count = rebuild_for_date(target)
            total_rows += count
            self.stdout.write(self.style.SUCCESS(f"{target}: {count} breeds rebuilt"))

        self.stdout.write(self.style.SUCCESS(f"Done. total_breeds={total_rows}"))
