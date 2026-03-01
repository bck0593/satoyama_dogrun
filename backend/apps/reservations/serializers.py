from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.checkins.models import CheckinLog
from apps.dogs.models import Dog
from apps.reservations.models import FacilityRule, NoShowRecord, Reservation, ReservationDog


class ReservationDogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationDog
        fields = ("dog", "dog_name", "breed", "size_category", "weight_kg")


class ReservationSerializer(serializers.ModelSerializer):
    reservation_dogs = ReservationDogSerializer(many=True, read_only=True)
    actual_checked_out_at = serializers.SerializerMethodField()
    actual_duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = (
            "id",
            "user",
            "date",
            "start_time",
            "end_time",
            "party_size",
            "status",
            "payment_status",
            "total_amount",
            "qr_token",
            "qr_expires_at",
            "note",
            "paid_at",
            "checked_in_at",
            "actual_checked_out_at",
            "actual_duration_minutes",
            "cancelled_at",
            "created_at",
            "reservation_dogs",
        )
        read_only_fields = (
            "id",
            "user",
            "status",
            "payment_status",
            "total_amount",
            "qr_token",
            "qr_expires_at",
            "paid_at",
            "checked_in_at",
            "actual_checked_out_at",
            "actual_duration_minutes",
            "cancelled_at",
            "created_at",
            "reservation_dogs",
        )

    def _get_latest_checkout_log(self, reservation: Reservation) -> CheckinLog | None:
        prefetched = getattr(reservation, "_prefetched_objects_cache", {})
        if "checkin_logs" in prefetched:
            checkout_logs = [log for log in prefetched["checkin_logs"] if log.action == CheckinLog.Action.CHECK_OUT]
            if not checkout_logs:
                return None
            return max(checkout_logs, key=lambda log: log.scanned_at)
        return reservation.checkin_logs.filter(action=CheckinLog.Action.CHECK_OUT).order_by("-scanned_at").first()

    def get_actual_checked_out_at(self, reservation: Reservation):
        checkout_log = self._get_latest_checkout_log(reservation)
        if checkout_log:
            return checkout_log.scanned_at
        return None

    def get_actual_duration_minutes(self, reservation: Reservation):
        checkout_log = self._get_latest_checkout_log(reservation)
        if not checkout_log:
            return None
        if checkout_log.duration_minutes is not None:
            return checkout_log.duration_minutes
        if reservation.checked_in_at:
            elapsed = checkout_log.scanned_at - reservation.checked_in_at
            return max(int(elapsed.total_seconds() // 60), 0)
        return None


class ReservationCreateSerializer(serializers.Serializer):
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    party_size = serializers.IntegerField(min_value=1, default=1)
    dog_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        rule = FacilityRule.get_current()

        if user.is_suspended:
            raise serializers.ValidationError("no-showペナルティ中は予約できません。")

        if rule.rain_closure_enabled:
            raise serializers.ValidationError("雨天のため本日の予約受付を停止しています。")

        target_date = attrs["date"]
        start_time = attrs["start_time"]
        end_time = attrs["end_time"]

        if target_date < date.today():
            raise serializers.ValidationError("過去日の予約はできません。")

        if datetime.combine(target_date, start_time) >= datetime.combine(target_date, end_time):
            raise serializers.ValidationError("終了時刻は開始時刻より後にしてください。")

        dog_ids = list(dict.fromkeys(attrs["dog_ids"]))
        dogs = list(Dog.objects.filter(id__in=dog_ids, owner=user, is_active=True))
        if len(dogs) != len(dog_ids):
            raise serializers.ValidationError("指定した犬情報が存在しないか、利用できません。")

        if len(dogs) > rule.max_dogs_per_owner:
            raise serializers.ValidationError(f"1予約あたりの犬は最大{rule.max_dogs_per_owner}頭です。")

        for dog in dogs:
            if not dog.is_vaccine_valid(target_date):
                raise serializers.ValidationError(f"{dog.name} のワクチン期限が予約日まで有効ではありません。")
            if dog.vaccine_approval_status != Dog.VaccineApprovalStatus.APPROVED:
                if dog.vaccine_approval_status == Dog.VaccineApprovalStatus.REJECTED:
                    detail = f"{dog.name} のワクチン証明は差し戻しです。再提出してスタッフ承認を受けてください。"
                    if dog.vaccine_review_note:
                        detail = f"{detail} ({dog.vaccine_review_note})"
                    raise serializers.ValidationError(detail)
                raise serializers.ValidationError(f"{dog.name} のワクチン証明はスタッフ確認待ちです。承認後に予約できます。")
            if dog.is_restricted_breed and not rule.allow_restricted_breeds:
                raise serializers.ValidationError(f"{dog.name} は危険犬種管理対象のため予約できません。")

        attrs["dogs"] = dogs
        attrs["rule"] = rule
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        rule: FacilityRule = validated_data["rule"]
        dogs = validated_data["dogs"]

        target_date = validated_data["date"]
        start_time = validated_data["start_time"]
        end_time = validated_data["end_time"]
        requested_dog_ids = sorted(dog.id for dog in dogs)

        with transaction.atomic():
            # Prevent duplicate pending reservations for the same user/slot/dogs.
            pending_candidates = list(
                Reservation.objects.select_for_update()
                .filter(
                    user=user,
                    date=target_date,
                    start_time=start_time,
                    end_time=end_time,
                    status=Reservation.Status.PENDING_PAYMENT,
                )
                .prefetch_related("reservation_dogs")
            )
            for candidate in pending_candidates:
                candidate_dog_ids = sorted(candidate.reservation_dogs.values_list("dog_id", flat=True))
                if candidate_dog_ids == requested_dog_ids:
                    return candidate

            locked_qs = Reservation.objects.select_for_update().filter(
                date=target_date,
                start_time=start_time,
                status__in=Reservation.active_statuses(),
            )
            list(locked_qs.values_list("id", flat=True))

            slot_links = ReservationDog.objects.filter(
                reservation__date=target_date,
                reservation__start_time=start_time,
                reservation__status__in=Reservation.active_statuses(),
            )
            existing_total = slot_links.count()
            existing_large = slot_links.filter(size_category=Dog.SizeCategory.LARGE).count()
            existing_small = slot_links.filter(size_category=Dog.SizeCategory.SMALL).count()

            requested_total = len(dogs)
            requested_large = sum(1 for dog in dogs if dog.size_category == Dog.SizeCategory.LARGE)
            requested_small = sum(1 for dog in dogs if dog.size_category == Dog.SizeCategory.SMALL)

            if existing_total + requested_total > rule.max_total_dogs_per_slot:
                raise serializers.ValidationError("最大頭数を超えるため予約できません。")

            if existing_large + requested_large > rule.max_large_dogs_per_slot:
                raise serializers.ValidationError("大型犬の受入上限を超えるため予約できません。")

            if existing_small + requested_small > rule.max_small_dogs_per_slot:
                raise serializers.ValidationError("小型犬の受入上限を超えるため予約できません。")

            total_amount = Decimal(rule.base_fee_per_dog) * requested_total
            slot_start = timezone.make_aware(datetime.combine(target_date, validated_data["start_time"]))
            slot_end = timezone.make_aware(datetime.combine(target_date, validated_data["end_time"]))
            checkin_close = slot_start + timedelta(minutes=rule.checkin_close_minutes_after_start)
            qr_expires_at = min(checkin_close, slot_end)

            reservation = Reservation.objects.create(
                user=user,
                date=validated_data["date"],
                start_time=validated_data["start_time"],
                end_time=validated_data["end_time"],
                party_size=validated_data["party_size"],
                total_amount=total_amount,
                qr_expires_at=qr_expires_at,
                note=validated_data.get("note", ""),
            )

            ReservationDog.objects.bulk_create(
                [
                    ReservationDog(
                        reservation=reservation,
                        dog=dog,
                        dog_name=dog.name,
                        breed=dog.breed_normalized,
                        size_category=dog.size_category,
                        weight_kg=dog.weight_kg,
                    )
                    for dog in dogs
                ]
            )

        return reservation


class ReservationCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class ReservationNoShowSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

    def mark_no_show(self, reservation: Reservation):
        if reservation.status == Reservation.Status.NO_SHOW:
            return reservation

        rule = FacilityRule.get_current()
        reservation.status = Reservation.Status.NO_SHOW
        reservation.no_show_marked_at = timezone.now()
        reservation.save(update_fields=["status", "no_show_marked_at", "updated_at"])

        NoShowRecord.objects.get_or_create(
            user=reservation.user,
            reservation=reservation,
            defaults={"reason": self.validated_data.get("reason", "")},
        )

        reservation.user.no_show_count += 1
        if reservation.user.no_show_count >= rule.max_no_show_before_suspension:
            reservation.user.suspended_until = timezone.now() + timedelta(days=rule.suspension_days)
        reservation.user.save(update_fields=["no_show_count", "suspended_until", "updated_at"])

        return reservation


class ReservationAvailabilitySerializer(serializers.Serializer):
    date = serializers.DateField()
    slots = serializers.ListField()
