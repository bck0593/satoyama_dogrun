from django.contrib import admin
from django.utils import timezone

from apps.dogs.models import Dog, RestrictedBreed


@admin.register(Dog)
class DogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "breed",
        "size_category",
        "owner",
        "vaccine_expires_on",
        "vaccine_approval_status",
        "vaccine_reviewed_by",
        "vaccine_reviewed_at",
        "is_restricted_breed",
        "is_active",
    )
    list_filter = ("size_category", "vaccine_approval_status", "is_restricted_breed", "is_active")
    search_fields = ("name", "breed", "owner__display_name", "owner__username")
    actions = ("approve_vaccine", "reject_vaccine")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "owner",
                    "name",
                    "breed",
                    "breed_group",
                    "size_category",
                    "gender",
                    "weight_kg",
                    "birth_date",
                    "notes",
                )
            },
        ),
        (
            "ワクチン",
            {
                "fields": (
                    "vaccine_expires_on",
                    "vaccine_proof_image",
                    "vaccine_approval_status",
                    "vaccine_review_note",
                    "vaccine_reviewed_by",
                    "vaccine_reviewed_at",
                )
            },
        ),
        (
            "運用",
            {
                "fields": (
                    "is_restricted_breed",
                    "is_active",
                )
            },
        ),
    )

    readonly_fields = ("is_restricted_breed", "vaccine_reviewed_at")

    @admin.action(description="選択した犬のワクチン証明を承認")
    def approve_vaccine(self, request, queryset):
        now = timezone.now()
        for dog in queryset:
            dog.vaccine_approval_status = Dog.VaccineApprovalStatus.APPROVED
            dog.vaccine_review_note = ""
            dog.vaccine_reviewed_by = request.user
            dog.vaccine_reviewed_at = now
            dog.save(
                update_fields=[
                    "vaccine_approval_status",
                    "vaccine_review_note",
                    "vaccine_reviewed_by",
                    "vaccine_reviewed_at",
                    "updated_at",
                ]
            )

    @admin.action(description="選択した犬のワクチン証明を差し戻し")
    def reject_vaccine(self, request, queryset):
        now = timezone.now()
        for dog in queryset:
            dog.vaccine_approval_status = Dog.VaccineApprovalStatus.REJECTED
            if not dog.vaccine_review_note:
                dog.vaccine_review_note = "ワクチン証明画像の再提出をお願いします。"
            dog.vaccine_reviewed_by = request.user
            dog.vaccine_reviewed_at = now
            dog.save(
                update_fields=[
                    "vaccine_approval_status",
                    "vaccine_review_note",
                    "vaccine_reviewed_by",
                    "vaccine_reviewed_at",
                    "updated_at",
                ]
            )


@admin.register(RestrictedBreed)
class RestrictedBreedAdmin(admin.ModelAdmin):
    list_display = ("id", "breed_name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("breed_name",)
