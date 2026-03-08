from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.dogs.models import Dog
from apps.reservations.models import FacilityRule, Reservation


class ReservationCreateApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="member",
            password="password123",
            display_name="テスト会員",
        )
        self.client.force_authenticate(self.user)

        FacilityRule.objects.create(
            name="default",
            open_time=time(9, 0),
            close_time=time(12, 0),
            slot_minutes=60,
            max_total_dogs_per_slot=30,
            max_large_dogs_per_slot=10,
            max_small_dogs_per_slot=20,
            max_dogs_per_owner=3,
            base_fee_per_dog=Decimal("200.00"),
        )

        self.dog = Dog.objects.create(
            owner=self.user,
            name="ポチ",
            breed_raw="柴犬",
            weight_kg=Decimal("8.5"),
            size_category=Dog.SizeCategory.SMALL,
            vaccine_expires_on=date.today() + timedelta(days=90),
            vaccine_approval_status=Dog.VaccineApprovalStatus.APPROVED,
        )

    def test_create_reservation_ignores_invalid_end_time_and_uses_slot_window(self):
        target_date = date.today() + timedelta(days=1)

        response = self.client.post(
            "/api/v1/reservations/",
            {
                "date": target_date.isoformat(),
                "start_time": "09:00",
                "end_time": "09:xx",
                "party_size": 1,
                "dog_ids": [self.dog.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["start_time"], "09:00:00")
        self.assertEqual(response.data["end_time"], "10:00:00")

        reservation = Reservation.objects.get()
        self.assertEqual(reservation.start_time, time(9, 0))
        self.assertEqual(reservation.end_time, time(10, 0))

    def test_create_reservation_rejects_unknown_slot_start_time(self):
        target_date = date.today() + timedelta(days=1)

        response = self.client.post(
            "/api/v1/reservations/",
            {
                "date": target_date.isoformat(),
                "start_time": "09:30",
                "party_size": 1,
                "dog_ids": [self.dog.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("選択した時間帯は予約できません。", str(response.data))
