from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import Membership
from apps.accounts.services import verify_line_id_token

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "email",
            "phone_number",
            "line_user_id",
            "is_staff",
            "no_show_count",
            "suspended_until",
            "created_at",
        )
        read_only_fields = (
            "id",
            "line_user_id",
            "is_staff",
            "no_show_count",
            "suspended_until",
            "created_at",
        )


class LineLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=False, allow_blank=True)
    line_user_id = serializers.CharField(required=False, allow_blank=True)
    display_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs):
        id_token = attrs.get("id_token", "")
        if id_token:
            try:
                profile = verify_line_id_token(id_token=id_token)
            except Exception as exc:
                raise serializers.ValidationError("LINEトークン検証に失敗しました。") from exc
            attrs["profile"] = profile
            return attrs

        if not settings.LINE_LOGIN_MOCK:
            raise serializers.ValidationError("id_tokenは必須です。")

        if not attrs.get("line_user_id"):
            raise serializers.ValidationError("LINEモックログインではline_user_idが必要です。")

        return attrs

    def get_or_create_user(self) -> tuple[User, bool]:
        data = self.validated_data

        if "profile" in data:
            line_user_id = data["profile"].line_user_id
            defaults = {
                "display_name": data["profile"].display_name,
                "email": data["profile"].email,
            }
        else:
            line_user_id = data["line_user_id"]
            defaults = {
                "display_name": data.get("display_name", "LINE User"),
                "email": data.get("email", ""),
            }

        user, created = User.objects.get_or_create(
            line_user_id=line_user_id,
            defaults={
                "username": f"line_{line_user_id}",
                **defaults,
            },
        )

        if not created:
            updated = False
            if defaults.get("display_name") and user.display_name != defaults["display_name"]:
                user.display_name = defaults["display_name"]
                updated = True
            if defaults.get("email") and user.email != defaults["email"]:
                user.email = defaults["email"]
                updated = True
            if updated:
                user.save(update_fields=["display_name", "email", "updated_at"])

        Membership.objects.get_or_create(user=user, defaults={"tier": Membership.Tier.REGULAR})
        return user, created


class AdminMemberSerializer(serializers.ModelSerializer):
    dog_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "display_name",
            "email",
            "phone_number",
            "line_user_id",
            "is_staff",
            "dog_count",
            "no_show_count",
            "suspended_until",
            "created_at",
        )
        read_only_fields = fields
