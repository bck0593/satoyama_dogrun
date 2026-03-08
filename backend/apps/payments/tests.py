from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.reservations.models import Reservation


class CreateCheckoutSessionApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="owner",
            password="password123",
            display_name="予約者",
        )
        self.staff_user = user_model.objects.create_user(
            username="staff",
            password="password123",
            display_name="運営者",
            is_staff=True,
        )

        target_date = date.today() + timedelta(days=1)
        self.reservation = Reservation.objects.create(
            user=self.owner,
            date=target_date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            party_size=1,
            total_amount=Decimal("200.00"),
            qr_expires_at=timezone.now() + timedelta(days=1),
        )

    def test_staff_cannot_create_checkout_session_for_other_users_reservation(self):
        self.client.force_authenticate(self.staff_user)

        response = self.client.post(
            "/api/v1/payments/checkout-session",
            {
                "reservation_id": self.reservation.id,
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "この予約は決済できません。")
