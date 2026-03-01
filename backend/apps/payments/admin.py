from django.contrib import admin

from apps.payments.models import PaymentRecord


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "reservation", "provider", "amount", "currency", "status", "created_at")
    list_filter = ("status", "provider", "currency")
    search_fields = ("reservation__id", "checkout_session_id", "payment_intent_id")
