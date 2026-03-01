from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    line_user_id = models.CharField(max_length=100, unique=True, null=True, blank=True, db_index=True)
    display_name = models.CharField(max_length=120, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    no_show_count = models.PositiveIntegerField(default=0)
    suspended_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.display_name or self.username

    @property
    def is_suspended(self) -> bool:
        return bool(self.suspended_until and self.suspended_until > timezone.now())


class Membership(models.Model):
    class Tier(models.TextChoices):
        REGULAR = "regular", "Regular"
        PREMIUM = "premium", "Premium"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="membership")
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.REGULAR)
    joined_at = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.tier}"
