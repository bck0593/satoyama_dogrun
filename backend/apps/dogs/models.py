from datetime import date

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.validators import validate_image_extension, validate_image_size


class RestrictedBreed(models.Model):
    breed_name = models.CharField(max_length=120, unique=True)
    note = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["breed_name"]

    def __str__(self) -> str:
        return self.breed_name


class Dog(models.Model):
    class SizeCategory(models.TextChoices):
        SMALL = "small", "小型"
        MEDIUM = "medium", "中型"
        LARGE = "large", "大型"

    class Gender(models.TextChoices):
        MALE = "male", "オス"
        FEMALE = "female", "メス"
        UNKNOWN = "unknown", "不明"

    class VaccineApprovalStatus(models.TextChoices):
        PENDING = "pending", "確認待ち"
        APPROVED = "approved", "承認済み"
        REJECTED = "rejected", "差し戻し"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dogs")
    name = models.CharField(max_length=80)
    breed = models.CharField(max_length=120)
    breed_group = models.CharField(max_length=50, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.1)])
    size_category = models.CharField(max_length=10, choices=SizeCategory.choices)
    gender = models.CharField(max_length=10, choices=Gender.choices, null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    vaccine_expires_on = models.DateField()
    vaccine_proof_image = models.ImageField(
        upload_to="dogs/vaccine-proof/",
        validators=[validate_image_extension, validate_image_size],
        null=True,
        blank=True,
    )
    vaccine_approval_status = models.CharField(
        max_length=20,
        choices=VaccineApprovalStatus.choices,
        default=VaccineApprovalStatus.PENDING,
    )
    vaccine_review_note = models.TextField(blank=True)
    vaccine_reviewed_at = models.DateTimeField(null=True, blank=True)
    vaccine_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_vaccine_dogs",
    )
    is_restricted_breed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.breed})"

    @property
    def age_years(self) -> int | None:
        if not self.birth_date:
            return None
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    def is_vaccine_valid(self, use_date: date | None = None) -> bool:
        target_date = use_date or date.today()
        return self.vaccine_expires_on >= target_date

    def save(self, *args, **kwargs):
        self.breed = self.breed.strip()
        if self.breed_group:
            self.breed_group = self.breed_group.strip()
        self.is_restricted_breed = RestrictedBreed.objects.filter(
            breed_name__iexact=self.breed.strip(),
            is_active=True,
        ).exists()
        super().save(*args, **kwargs)
