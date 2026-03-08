from decimal import Decimal
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.dogs.models import Dog


class AdminMemberApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            username="admin",
            password="password123",
            display_name="管理者",
            is_staff=True,
        )
        self.member = user_model.objects.create_user(
            username="member",
            password="password123",
            display_name="一般会員",
        )
        Dog.objects.create(
            owner=self.member,
            name="さくら",
            breed_raw="柴犬",
            weight_kg=Decimal("8.5"),
            size_category=Dog.SizeCategory.SMALL,
            vaccine_expires_on=date.today() + timedelta(days=30),
            vaccine_approval_status=Dog.VaccineApprovalStatus.APPROVED,
        )

        self.client.force_authenticate(self.admin)

    def test_admin_members_response_includes_is_staff_flag(self):
        response = self.client.get("/api/v1/admin/members/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

        admin_member = next(item for item in response.data["results"] if item["username"] == self.admin.username)
        regular_member = next(item for item in response.data["results"] if item["username"] == self.member.username)

        self.assertIs(admin_member["is_staff"], True)
        self.assertIs(regular_member["is_staff"], False)
        self.assertEqual(regular_member["dog_count"], 1)
