from datetime import date

from rest_framework import serializers

from apps.dogs.models import Dog, RestrictedBreed


class DogSerializer(serializers.ModelSerializer):
    age_years = serializers.IntegerField(read_only=True)
    breed = serializers.CharField(source="breed_raw")

    class Meta:
        model = Dog
        fields = (
            "id",
            "owner",
            "name",
            "breed",
            "breed_raw",
            "breed_normalized",
            "breed_group",
            "weight_kg",
            "size_category",
            "gender",
            "birth_date",
            "age_years",
            "vaccine_expires_on",
            "vaccine_proof_image",
            "vaccine_approval_status",
            "vaccine_review_note",
            "vaccine_reviewed_at",
            "vaccine_reviewed_by",
            "is_restricted_breed",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "breed_raw",
            "breed_normalized",
            "vaccine_approval_status",
            "vaccine_review_note",
            "vaccine_reviewed_at",
            "vaccine_reviewed_by",
            "is_restricted_breed",
            "is_active",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        if self.instance is None and not attrs.get("vaccine_proof_image"):
            raise serializers.ValidationError({"vaccine_proof_image": "ワクチン証明画像は必須です。"})
        return attrs

    def validate_breed(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("犬種は必須です。")
        return value

    def validate_breed_group(self, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    def validate_vaccine_expires_on(self, value):
        if value < date.today():
            raise serializers.ValidationError("ワクチン期限が切れています。")
        return value

    def _set_pending_review_if_needed(self, validated_data):
        request = self.context.get("request")
        is_staff = bool(request and request.user and request.user.is_staff)
        if is_staff:
            return

        vaccine_related_fields = {"vaccine_expires_on", "vaccine_proof_image"}
        should_mark_pending = self.instance is None or any(field in validated_data for field in vaccine_related_fields)
        if not should_mark_pending:
            return

        validated_data["vaccine_approval_status"] = Dog.VaccineApprovalStatus.PENDING
        validated_data["vaccine_review_note"] = ""
        validated_data["vaccine_reviewed_at"] = None
        validated_data["vaccine_reviewed_by"] = None

    def create(self, validated_data):
        self._set_pending_review_if_needed(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._set_pending_review_if_needed(validated_data)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["breed"] = instance.breed_normalized
        return data


class DogVaccineReviewSerializer(serializers.Serializer):
    vaccine_approval_status = serializers.ChoiceField(
        choices=[Dog.VaccineApprovalStatus.APPROVED, Dog.VaccineApprovalStatus.REJECTED]
    )
    vaccine_review_note = serializers.CharField(required=False, allow_blank=True)


class RestrictedBreedSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestrictedBreed
        fields = ("id", "breed_name", "note", "is_active", "created_at")
        read_only_fields = ("id", "created_at")
