import json
from decimal import Decimal
from uuid import uuid4

import stripe
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import PaymentRecord
from apps.payments.serializers import CreateCheckoutSessionSerializer, PaymentHistorySerializer
from apps.reservations.models import Reservation


stripe.api_key = settings.STRIPE_SECRET_KEY


def _unit_price_from_reservation(reservation: Reservation) -> Decimal:
    dog_count = reservation.reservation_dogs.count() or 1
    return (reservation.total_amount / dog_count).quantize(Decimal("0.01"))


def _mark_reservation_paid(
    reservation: Reservation,
    checkout_session_id: str,
    payment_intent_id: str,
) -> None:
    reservation.status = Reservation.Status.CONFIRMED
    reservation.payment_status = Reservation.PaymentStatus.PAID
    reservation.paid_at = timezone.now()
    reservation.stripe_checkout_session_id = checkout_session_id
    reservation.stripe_payment_intent_id = payment_intent_id
    reservation.save(
        update_fields=[
            "status",
            "payment_status",
            "paid_at",
            "stripe_checkout_session_id",
            "stripe_payment_intent_id",
            "updated_at",
        ]
    )


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reservation = Reservation.objects.get(id=serializer.validated_data["reservation_id"])
        except Reservation.DoesNotExist:
            return Response({"detail": "予約が見つかりません。"}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and reservation.user_id != request.user.id:
            return Response({"detail": "この予約は決済できません。"}, status=status.HTTP_403_FORBIDDEN)

        if reservation.payment_status == Reservation.PaymentStatus.PAID:
            return Response({"detail": "この予約はすでに決済済みです。"}, status=status.HTTP_400_BAD_REQUEST)

        if reservation.status in [
            Reservation.Status.CANCELLED,
            Reservation.Status.COMPLETED,
            Reservation.Status.NO_SHOW,
            Reservation.Status.EXPIRED,
        ]:
            return Response({"detail": "この予約は決済できない状態です。"}, status=status.HTTP_400_BAD_REQUEST)

        idempotency_key = f"checkout-{reservation.id}-{uuid4().hex}"
        unit_price = _unit_price_from_reservation(reservation)

        if not settings.STRIPE_SECRET_KEY:
            if settings.STRIPE_MOCK:
                mock_session_id = f"mock_cs_{uuid4().hex[:24]}"
                mock_payment_intent_id = f"mock_pi_{uuid4().hex[:24]}"

                _mark_reservation_paid(
                    reservation=reservation,
                    checkout_session_id=mock_session_id,
                    payment_intent_id=mock_payment_intent_id,
                )

                PaymentRecord.objects.create(
                    reservation=reservation,
                    provider="stripe",
                    checkout_session_id=mock_session_id,
                    payment_intent_id=mock_payment_intent_id,
                    amount=reservation.total_amount,
                    unit_price=unit_price,
                    tax=Decimal("0.00"),
                    status=PaymentRecord.Status.PAID,
                    idempotency_key=idempotency_key,
                    payload={"mock": True, "reason": "stripe_secret_not_configured"},
                )

                return Response(
                    {
                        "checkout_url": serializer.validated_data["success_url"],
                        "session_id": mock_session_id,
                        "mock": True,
                    }
                )

            return Response(
                {"detail": "Stripeキーが未設定です。管理者にお問い合わせください。"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        checkout_session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "jpy",
                        "unit_amount": int(reservation.total_amount),
                        "product_data": {"name": f"ドッグラン予約 #{reservation.id}"},
                    },
                    "quantity": 1,
                }
            ],
            success_url=serializer.validated_data["success_url"],
            cancel_url=serializer.validated_data["cancel_url"],
            metadata={"reservation_id": str(reservation.id)},
            idempotency_key=idempotency_key,
        )

        reservation.stripe_checkout_session_id = checkout_session.id
        reservation.save(update_fields=["stripe_checkout_session_id", "updated_at"])

        PaymentRecord.objects.create(
            reservation=reservation,
            checkout_session_id=checkout_session.id,
            amount=reservation.total_amount,
            unit_price=unit_price,
            tax=Decimal("0.00"),
            status=PaymentRecord.Status.CREATED,
            idempotency_key=idempotency_key,
            payload={"checkout_session_id": checkout_session.id, "idempotency_key": idempotency_key},
        )

        return Response({"checkout_url": checkout_session.url, "session_id": checkout_session.id, "mock": False})


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            if settings.STRIPE_WEBHOOK_SECRET:
                event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=settings.STRIPE_WEBHOOK_SECRET)
            else:
                event = json.loads(payload.decode("utf-8"))
        except Exception:
            return Response({"detail": "invalid webhook"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get("type", "")
        data_obj = event.get("data", {}).get("object", {})

        if event_type == "checkout.session.completed":
            self._mark_paid(data_obj)
        elif event_type == "payment_intent.payment_failed":
            self._mark_failed(data_obj)
        elif event_type in {"charge.refunded", "payment_intent.succeeded"}:
            # payment_intent.succeeded is informative; refund event updates refunded status.
            if event_type == "charge.refunded":
                self._mark_refunded(data_obj)

        return Response({"status": "ok"})

    def _mark_paid(self, session_payload: dict):
        reservation_id = int(session_payload.get("metadata", {}).get("reservation_id", 0))
        if not reservation_id:
            return

        reservation = Reservation.objects.filter(id=reservation_id).first()
        if not reservation:
            return

        _mark_reservation_paid(
            reservation=reservation,
            checkout_session_id=session_payload.get("id", ""),
            payment_intent_id=session_payload.get("payment_intent", ""),
        )

        payment, _ = PaymentRecord.objects.get_or_create(
            reservation=reservation,
            checkout_session_id=session_payload.get("id", ""),
            defaults={
                "amount": reservation.total_amount,
                "unit_price": _unit_price_from_reservation(reservation),
                "tax": Decimal("0.00"),
            },
        )
        payment.status = PaymentRecord.Status.PAID
        payment.payment_intent_id = session_payload.get("payment_intent", "")
        payment.payload = session_payload
        payment.webhook_payload = session_payload
        payment.save(update_fields=["status", "payment_intent_id", "payload", "webhook_payload", "updated_at"])

    def _mark_failed(self, payment_intent_payload: dict):
        payment_intent_id = payment_intent_payload.get("id", "")
        payment = PaymentRecord.objects.filter(payment_intent_id=payment_intent_id).first()
        if not payment:
            return

        payment.status = PaymentRecord.Status.FAILED
        payment.payload = payment_intent_payload
        payment.webhook_payload = payment_intent_payload
        payment.save(update_fields=["status", "payload", "webhook_payload", "updated_at"])

        payment.reservation.payment_status = Reservation.PaymentStatus.FAILED
        payment.reservation.save(update_fields=["payment_status", "updated_at"])

    def _mark_refunded(self, charge_payload: dict):
        payment_intent_id = charge_payload.get("payment_intent", "")
        payment = PaymentRecord.objects.filter(payment_intent_id=payment_intent_id).first()
        if not payment:
            return

        refunded = Decimal(charge_payload.get("amount_refunded", 0)) / Decimal("100")
        payment.status = PaymentRecord.Status.REFUNDED
        payment.refunded_amount = refunded
        payment.payload = charge_payload
        payment.webhook_payload = charge_payload
        payment.save(update_fields=["status", "refunded_amount", "payload", "webhook_payload", "updated_at"])

        payment.reservation.payment_status = Reservation.PaymentStatus.REFUNDED
        payment.reservation.status = Reservation.Status.CANCELLED
        payment.reservation.save(update_fields=["payment_status", "status", "updated_at"])


class AdminSalesView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        sales = (
            PaymentRecord.objects.filter(status=PaymentRecord.Status.PAID)
            .values("currency")
            .annotate(total_amount=Sum("amount"))
            .order_by("currency")
        )
        return Response(list(sales))


class PaymentHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queryset = (
            PaymentRecord.objects.select_related("reservation")
            .filter(reservation__user=request.user)
            .order_by("-created_at")
        )
        return Response(PaymentHistorySerializer(queryset, many=True).data)
