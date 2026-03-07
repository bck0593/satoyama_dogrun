from __future__ import annotations

from base64 import b64decode
from datetime import timedelta
from decimal import Decimal
from uuid import UUID

from django.contrib.admin.models import ADDITION, LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from apps.accounts.models import Membership
from apps.checkins.models import CheckinLog, Entry
from apps.dogs.models import Dog, RestrictedBreed
from apps.payments.models import PaymentRecord
from apps.reservations.models import FacilityRule, NoShowRecord, Reservation, ReservationDog
from apps.stats.models import BreedDailyStats, HomeHeroSlide

PNG_1X1 = b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0kOcQAAAAASUVORK5CYII=")


class Command(BaseCommand):
    help = "Seed dummy data for local development."

    def handle(self, *args, **options):
        with transaction.atomic():
            self.seed()
        self.stdout.write(self.style.SUCCESS("Dummy data seeded."))
        self.stdout.write(self.render_table_counts())

    def seed(self) -> None:
        now = timezone.now()
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        tomorrow = today + timedelta(days=1)
        User = get_user_model()

        admin_user = self.upsert_user(
            User,
            username="dummy_admin",
            password="dummy-pass-123",
            email="dummy.admin@example.com",
            display_name="運営管理者",
            line_user_id="dummy-line-admin",
            phone_number="09000000001",
            is_staff=True,
            is_superuser=True,
            is_active=True,
            no_show_count=0,
            suspended_until=None,
        )
        member_user = self.upsert_user(
            User,
            username="dummy_member",
            password="dummy-pass-123",
            email="dummy.member@example.com",
            display_name="山田 花子",
            line_user_id="dummy-line-member",
            phone_number="09000000002",
            is_staff=False,
            is_superuser=False,
            is_active=True,
            no_show_count=0,
            suspended_until=None,
        )
        no_show_user = self.upsert_user(
            User,
            username="dummy_no_show",
            password="dummy-pass-123",
            email="dummy.noshow@example.com",
            display_name="佐藤 健一",
            line_user_id="dummy-line-noshow",
            phone_number="09000000003",
            is_staff=False,
            is_superuser=False,
            is_active=True,
            no_show_count=1,
            suspended_until=now + timedelta(days=3),
        )

        RestrictedBreed.objects.filter(breed_name="American Pit Bull Terrier").update(
            breed_name="アメリカン・ピット・ブル・テリア",
            note="危険犬種チェック用のサンプルです。",
            is_active=True,
        )
        Dog.objects.filter(owner=member_user, name="Dummy Maru").update(name="まる")
        Dog.objects.filter(owner=member_user, name="Dummy Yuzu").update(name="ゆず")
        Dog.objects.filter(owner=no_show_user, name="Dummy Boss").update(name="ボス")
        FacilityRule.objects.filter(name="default").update(name="既定ルール")
        FacilityRule.objects.filter(name="Dummy Facility Rule").update(name="通常営業ルール")
        Group.objects.filter(name="Dummy Operators").update(name="運営スタッフ")
        BreedDailyStats.objects.filter(breed="American Pit Bull Terrier").delete()

        Membership.objects.update_or_create(
            user=admin_user,
            defaults={"tier": Membership.Tier.REGULAR, "joined_at": two_days_ago},
        )
        Membership.objects.update_or_create(
            user=member_user,
            defaults={"tier": Membership.Tier.PREMIUM, "joined_at": yesterday},
        )
        Membership.objects.update_or_create(
            user=no_show_user,
            defaults={"tier": Membership.Tier.REGULAR, "joined_at": today},
        )

        restricted_breed, _ = RestrictedBreed.objects.update_or_create(
            breed_name="アメリカン・ピット・ブル・テリア",
            defaults={"note": "危険犬種チェック用のサンプルです。", "is_active": True},
        )

        maru, _ = Dog.objects.update_or_create(
            owner=member_user,
            name="まる",
            defaults={
                "breed_raw": "柴犬",
                "breed_group": "和犬",
                "weight_kg": Decimal("8.40"),
                "size_category": Dog.SizeCategory.SMALL,
                "gender": Dog.Gender.MALE,
                "birth_date": today - timedelta(days=365 * 3),
                "vaccine_expires_on": today + timedelta(days=180),
                "vaccine_approval_status": Dog.VaccineApprovalStatus.APPROVED,
                "vaccine_review_note": "ワクチン証明を確認済みです。",
                "vaccine_reviewed_at": now - timedelta(days=1),
                "vaccine_reviewed_by": admin_user,
                "is_active": True,
                "notes": "人懐っこい小型犬のサンプルです。",
            },
        )
        yuzu, _ = Dog.objects.update_or_create(
            owner=member_user,
            name="ゆず",
            defaults={
                "breed_raw": "ゴールデンレトリバー",
                "breed_group": "レトリーバー",
                "weight_kg": Decimal("26.20"),
                "size_category": Dog.SizeCategory.LARGE,
                "gender": Dog.Gender.FEMALE,
                "birth_date": today - timedelta(days=365 * 5),
                "vaccine_expires_on": today + timedelta(days=120),
                "vaccine_approval_status": Dog.VaccineApprovalStatus.PENDING,
                "vaccine_review_note": "",
                "vaccine_reviewed_at": None,
                "vaccine_reviewed_by": None,
                "is_active": True,
                "notes": "大型犬予約確認用のサンプルです。",
            },
        )
        boss, _ = Dog.objects.update_or_create(
            owner=no_show_user,
            name="ボス",
            defaults={
                "breed_raw": restricted_breed.breed_name,
                "breed_group": "テリア",
                "weight_kg": Decimal("24.00"),
                "size_category": Dog.SizeCategory.LARGE,
                "gender": Dog.Gender.MALE,
                "birth_date": today - timedelta(days=365 * 4),
                "vaccine_expires_on": today + timedelta(days=90),
                "vaccine_approval_status": Dog.VaccineApprovalStatus.REJECTED,
                "vaccine_review_note": "証明画像が不鮮明なため再提出待ちです。",
                "vaccine_reviewed_at": now - timedelta(days=2),
                "vaccine_reviewed_by": admin_user,
                "is_active": True,
                "notes": "危険犬種フラグ確認用のサンプルです。",
            },
        )
        maru.save()
        yuzu.save()
        boss.save()

        FacilityRule.objects.update_or_create(
            name="通常営業ルール",
            defaults={
                "open_time": "09:00",
                "close_time": "18:00",
                "slot_minutes": 60,
                "max_total_dogs_per_slot": 20,
                "max_large_dogs_per_slot": 8,
                "max_small_dogs_per_slot": 12,
                "max_dogs_per_owner": 3,
                "allow_restricted_breeds": False,
                "checkin_open_minutes_before": 30,
                "checkin_close_minutes_after_start": 15,
                "auto_checkout_grace_minutes": 20,
                "cancellation_refund_hours": 24,
                "max_no_show_before_suspension": 2,
                "suspension_days": 14,
                "rain_closure_enabled": False,
                "base_fee_per_dog": Decimal("200.00"),
            },
        )

        completed_reservation, _ = Reservation.objects.update_or_create(
            qr_token=UUID("00000000-0000-0000-0000-000000000101"),
            defaults={
                "user": member_user,
                "date": yesterday,
                "start_time": "10:00",
                "end_time": "11:00",
                "party_size": 2,
                "status": Reservation.Status.COMPLETED,
                "payment_status": Reservation.PaymentStatus.PAID,
                "total_amount": Decimal("400.00"),
                "qr_expires_at": now + timedelta(days=30),
                "stripe_checkout_session_id": "seed_checkout_completed",
                "stripe_payment_intent_id": "seed_intent_completed",
                "note": "家族2名で小型犬と大型犬を利用した完了済み予約です。",
                "paid_at": now - timedelta(days=1, hours=2),
                "checked_in_at": now - timedelta(days=1, hours=1, minutes=50),
                "cancelled_at": None,
                "no_show_marked_at": None,
            },
        )
        no_show_reservation, _ = Reservation.objects.update_or_create(
            qr_token=UUID("00000000-0000-0000-0000-000000000102"),
            defaults={
                "user": no_show_user,
                "date": two_days_ago,
                "start_time": "14:00",
                "end_time": "15:00",
                "party_size": 1,
                "status": Reservation.Status.NO_SHOW,
                "payment_status": Reservation.PaymentStatus.FAILED,
                "total_amount": Decimal("200.00"),
                "qr_expires_at": now - timedelta(days=1),
                "stripe_checkout_session_id": "seed_checkout_noshow",
                "stripe_payment_intent_id": "seed_intent_noshow",
                "note": "連絡なし未来場のケース確認用予約です。",
                "paid_at": None,
                "checked_in_at": None,
                "cancelled_at": None,
                "no_show_marked_at": now - timedelta(days=2, hours=1),
            },
        )
        future_reservation, _ = Reservation.objects.update_or_create(
            qr_token=UUID("00000000-0000-0000-0000-000000000103"),
            defaults={
                "user": member_user,
                "date": tomorrow,
                "start_time": "09:00",
                "end_time": "10:00",
                "party_size": 1,
                "status": Reservation.Status.CONFIRMED,
                "payment_status": Reservation.PaymentStatus.PAID,
                "total_amount": Decimal("200.00"),
                "qr_expires_at": now + timedelta(days=1),
                "stripe_checkout_session_id": "seed_checkout_future",
                "stripe_payment_intent_id": "seed_intent_future",
                "note": "明日の朝いち利用を想定した予約です。",
                "paid_at": now - timedelta(hours=4),
                "checked_in_at": None,
                "cancelled_at": None,
                "no_show_marked_at": None,
            },
        )

        self.upsert_reservation_dog(completed_reservation, maru)
        self.upsert_reservation_dog(completed_reservation, yuzu)
        self.upsert_reservation_dog(no_show_reservation, boss)
        self.upsert_reservation_dog(future_reservation, yuzu)

        NoShowRecord.objects.update_or_create(
            reservation=no_show_reservation,
            defaults={"user": no_show_user, "reason": "連絡なしで来場がなかったため no-show 登録。"},
        )

        PaymentRecord.objects.update_or_create(
            idempotency_key="seed-payment-completed",
            defaults={
                "reservation": completed_reservation,
                "provider": "stripe",
                "checkout_session_id": "seed_checkout_completed",
                "payment_intent_id": "seed_payment_completed",
                "amount": Decimal("400.00"),
                "unit_price": Decimal("200.00"),
                "tax": Decimal("40.00"),
                "currency": "jpy",
                "status": PaymentRecord.Status.PAID,
                "refunded_amount": Decimal("0.00"),
                "payload": {"seed": True, "kind": "completed"},
                "webhook_payload": {"seed": True, "event": "checkout.session.completed"},
            },
        )
        PaymentRecord.objects.update_or_create(
            idempotency_key="seed-payment-failed",
            defaults={
                "reservation": no_show_reservation,
                "provider": "stripe",
                "checkout_session_id": "seed_checkout_failed",
                "payment_intent_id": "seed_payment_failed",
                "amount": Decimal("200.00"),
                "unit_price": Decimal("200.00"),
                "tax": Decimal("20.00"),
                "currency": "jpy",
                "status": PaymentRecord.Status.FAILED,
                "refunded_amount": Decimal("0.00"),
                "payload": {"seed": True, "kind": "failed"},
                "webhook_payload": {"seed": True, "event": "payment_intent.payment_failed"},
            },
        )

        check_in_log, _ = CheckinLog.objects.update_or_create(
            reservation=completed_reservation,
            action=CheckinLog.Action.CHECK_IN,
            source="seed",
            defaults={
                "scanned_by": admin_user,
                "duration_minutes": None,
                "metadata": {"seed": True, "step": "check_in"},
            },
        )
        check_out_log, _ = CheckinLog.objects.update_or_create(
            reservation=completed_reservation,
            action=CheckinLog.Action.CHECK_OUT,
            source="seed",
            defaults={
                "scanned_by": admin_user,
                "duration_minutes": 60,
                "metadata": {"seed": True, "step": "check_out"},
            },
        )
        CheckinLog.objects.filter(pk=check_in_log.pk).update(scanned_at=now - timedelta(days=1, hours=1, minutes=50))
        CheckinLog.objects.filter(pk=check_out_log.pk).update(scanned_at=now - timedelta(days=1, hours=1))

        Entry.objects.update_or_create(
            reservation=completed_reservation,
            dog=maru,
            defaults={
                "user": member_user,
                "dog_name_snapshot": maru.name,
                "breed_snapshot": maru.breed_normalized,
                "size_category_snapshot": maru.size_category,
                "weight_kg_snapshot": maru.weight_kg,
                "checked_in_at": now - timedelta(days=1, hours=1, minutes=50),
                "checked_out_at": now - timedelta(days=1, hours=1),
                "status": Entry.Status.OUT,
                "source": "seed",
                "metadata": {"seed": True},
            },
        )
        BreedDailyStats.objects.update_or_create(
            date=yesterday,
            breed=maru.breed_normalized,
            defaults={
                "total_checkins": 1,
                "unique_dogs": 1,
                "total_duration_minutes": 60,
            },
        )
        BreedDailyStats.objects.update_or_create(
            date=two_days_ago,
            breed=boss.breed_normalized,
            defaults={
                "total_checkins": 0,
                "unique_dogs": 1,
                "total_duration_minutes": 0,
            },
        )

        slide = HomeHeroSlide.objects.filter(display_order=900).first()
        if slide is None:
            slide = HomeHeroSlide(
                display_order=900,
                title="週末ドッグランのご案内",
                description="家族と愛犬で楽しめる里山ドッグランのサンプル告知です。",
                alt_text="週末ドッグラン案内バナー",
                is_active=True,
            )
            slide.image.save("seed-home-hero.png", ContentFile(PNG_1X1), save=True)
        else:
            slide.title = "週末ドッグランのご案内"
            slide.description = "家族と愛犬で楽しめる里山ドッグランのサンプル告知です。"
            slide.alt_text = "週末ドッグラン案内バナー"
            slide.is_active = True
            slide.save(update_fields=["title", "description", "alt_text", "is_active", "updated_at"])
            if not slide.image:
                slide.image.save("seed-home-hero.png", ContentFile(PNG_1X1), save=True)

        operator_group, _ = Group.objects.update_or_create(name="運営スタッフ")
        group_permissions = Permission.objects.filter(
            codename__in={"view_reservation", "change_reservation", "view_paymentrecord"}
        )
        operator_group.permissions.set(group_permissions)
        admin_user.groups.add(operator_group)
        member_user.groups.add(operator_group)

        direct_permissions = Permission.objects.filter(codename__in={"view_dog", "view_homeheroslide"})
        member_user.user_permissions.set(direct_permissions)

        session = Session.objects.filter(session_key="dummy-session-seed").first()
        session_data = self.build_session_payload(admin_user)
        if session:
            session.session_data = session_data
            session.expire_date = now + timedelta(days=14)
            session.save(update_fields=["session_data", "expire_date"])
        else:
            Session.objects.create(
                session_key="dummy-session-seed",
                session_data=session_data,
                expire_date=now + timedelta(days=14),
            )

        slide_content_type = ContentType.objects.get_for_model(HomeHeroSlide)
        LogEntry.objects.update_or_create(
            user=admin_user,
            content_type=slide_content_type,
            object_id=str(slide.pk),
            action_flag=ADDITION,
            defaults={
                "object_repr": str(slide),
                "change_message": "ダミーのヒーロースライドを登録しました。",
                "action_time": now,
            },
        )

    def upsert_user(self, user_model, username: str, password: str, **defaults):
        user, _ = user_model.objects.update_or_create(username=username, defaults=defaults)
        if not user.check_password(password):
            user.set_password(password)
            user.save(update_fields=["password"])
        return user

    def upsert_reservation_dog(self, reservation: Reservation, dog: Dog) -> ReservationDog:
        reservation_dog, _ = ReservationDog.objects.update_or_create(
            reservation=reservation,
            dog=dog,
            defaults={
                "dog_name": dog.name,
                "breed": dog.breed_normalized,
                "size_category": dog.size_category,
                "weight_kg": dog.weight_kg,
            },
        )
        return reservation_dog

    def build_session_payload(self, user) -> str:
        session_store = Session.get_session_store_class()()
        return session_store.encode(
            {
                "_auth_user_id": str(user.pk),
                "_auth_user_backend": "django.contrib.auth.backends.ModelBackend",
                "_auth_user_hash": user.get_session_auth_hash(),
                "seed": True,
            }
        )

    def render_table_counts(self) -> str:
        lines = ["Table counts:"]
        with connection.cursor() as cursor:
            for table_name in sorted(connection.introspection.table_names()):
                quoted_name = connection.ops.quote_name(table_name)
                cursor.execute(f"SELECT COUNT(*) FROM {quoted_name}")
                count = cursor.fetchone()[0]
                lines.append(f"  {table_name}: {count}")
        return "\n".join(lines)
