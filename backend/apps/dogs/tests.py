from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.dogs.models import Dog


class DogApiAccessTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username="staff",
            password="password123",
            display_name="運営者",
            is_staff=True,
        )
        self.other_user = user_model.objects.create_user(
            username="member",
            password="password123",
            display_name="一般会員",
        )

        Dog.objects.create(
            owner=self.staff_user,
            name="スタッフ犬",
            breed_raw="トイプードル",
            weight_kg=Decimal("4.2"),
            size_category=Dog.SizeCategory.SMALL,
            vaccine_expires_on=date.today() + timedelta(days=30),
            vaccine_approval_status=Dog.VaccineApprovalStatus.APPROVED,
        )
        Dog.objects.create(
            owner=self.other_user,
            name="会員犬",
            breed_raw="柴犬",
            weight_kg=Decimal("9.0"),
            size_category=Dog.SizeCategory.SMALL,
            vaccine_expires_on=date.today() + timedelta(days=30),
            vaccine_approval_status=Dog.VaccineApprovalStatus.APPROVED,
        )

        self.client.force_authenticate(self.staff_user)

    def test_member_dog_endpoint_is_limited_to_authenticated_owner_even_for_staff(self):
        response = self.client.get("/api/v1/dogs/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "スタッフ犬")
