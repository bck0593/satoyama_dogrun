from django.contrib import admin

from apps.reservations.models import FacilityRule, NoShowRecord, Reservation, ReservationDog


@admin.register(FacilityRule)
class FacilityRuleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "open_time",
        "close_time",
        "max_total_dogs_per_slot",
        "max_large_dogs_per_slot",
        "updated_at",
    )


class ReservationDogInline(admin.TabularInline):
    model = ReservationDog
    extra = 0
    readonly_fields = ("dog_name", "breed", "size_category", "weight_kg")


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "date",
        "start_time",
        "end_time",
        "status",
        "payment_status",
        "total_amount",
        "created_at",
    )
    list_filter = ("status", "payment_status", "date")
    search_fields = ("user__username", "user__display_name", "id")
    inlines = [ReservationDogInline]


@admin.register(NoShowRecord)
class NoShowRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "reservation", "created_at")
    search_fields = ("user__username", "user__display_name")
