from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import Membership, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "display_name",
        "email",
        "line_user_id",
        "no_show_count",
        "suspended_until",
        "is_staff",
    )
    search_fields = ("username", "display_name", "email", "line_user_id")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Dogrun",
            {
                "fields": (
                    "line_user_id",
                    "display_name",
                    "phone_number",
                    "no_show_count",
                    "suspended_until",
                )
            },
        ),
    )


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tier", "joined_at", "created_at")
    list_filter = ("tier", "joined_at")
    search_fields = ("user__username", "user__display_name", "user__line_user_id")
