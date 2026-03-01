from rest_framework import serializers

from apps.stats.models import HomeHeroSlide


class HomeHeroSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomeHeroSlide
        fields = (
            "id",
            "title",
            "description",
            "image",
            "image_url",
            "alt_text",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "image_url", "created_at", "updated_at")

    def get_image_url(self, obj: HomeHeroSlide) -> str:
        if not obj.image:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def validate_title(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("タイトルは必須です。")
        return normalized

    def validate_alt_text(self, value: str) -> str:
        return value.strip()

    def validate_description(self, value: str) -> str:
        return value.strip()
