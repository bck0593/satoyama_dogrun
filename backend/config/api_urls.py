from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import AdminMemberViewSet, LineLoginView, MeView
from apps.checkins.views import AdminUsageReportView, CheckinLogViewSet, CheckoutView, QrCheckinPreviewView, QrCheckinView
from apps.dogs.views import AdminDogViewSet, DogViewSet, RestrictedBreedViewSet
from apps.payments.views import (
    AdminSalesView,
    CreateCheckoutSessionView,
    PaymentHistoryView,
    StripeWebhookView,
)
from apps.reservations.views import (
    AdminReservationViewSet,
    ReservationAvailabilityView,
    ReservationViewSet,
)
from apps.stats.views import (
    AdminDashboardView,
    AdminHomeHeroSlideViewSet,
    BreedDailyStatsView,
    BreedMonthlyStatsView,
    BreedRealtimeStatsView,
    BreedStatsView,
    CurrentStatsView,
    HomeHeroSlideView,
)

router = DefaultRouter()
router.register("dogs", DogViewSet, basename="dogs")
router.register("reservations", ReservationViewSet, basename="reservations")
router.register("admin/members", AdminMemberViewSet, basename="admin-members")
router.register("admin/dogs", AdminDogViewSet, basename="admin-dogs")
router.register("admin/reservations", AdminReservationViewSet, basename="admin-reservations")
router.register("admin/checkins", CheckinLogViewSet, basename="admin-checkins")
router.register("admin/restricted-breeds", RestrictedBreedViewSet, basename="admin-restricted-breeds")
router.register("admin/home-hero-slides", AdminHomeHeroSlideViewSet, basename="admin-home-hero-slides")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/line", LineLoginView.as_view(), name="line-login"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("content/home-hero-slides", HomeHeroSlideView.as_view(), name="content-home-hero-slides"),
    path("reservations/availability", ReservationAvailabilityView.as_view(), name="reservation-availability"),
    path("payments/checkout-session", CreateCheckoutSessionView.as_view(), name="payments-checkout"),
    path("payments/history", PaymentHistoryView.as_view(), name="payments-history"),
    path("payments/stripe/webhook", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("checkins/qr/<uuid:qr_token>/preview", QrCheckinPreviewView.as_view(), name="qr-checkin-preview"),
    path("checkins/qr", QrCheckinView.as_view(), name="qr-checkin"),
    path("checkins/checkout", CheckoutView.as_view(), name="checkout"),
    path("admin/usage-report", AdminUsageReportView.as_view(), name="admin-usage-report"),
    path("stats/current", CurrentStatsView.as_view(), name="stats-current"),
    path("stats/breeds", BreedStatsView.as_view(), name="stats-breeds"),
    path("stats/breeds/realtime", BreedRealtimeStatsView.as_view(), name="stats-breeds-realtime"),
    path("stats/breeds/daily", BreedDailyStatsView.as_view(), name="stats-breeds-daily"),
    path("stats/breeds/monthly", BreedMonthlyStatsView.as_view(), name="stats-breeds-monthly"),
    path("admin/dashboard", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/sales", AdminSalesView.as_view(), name="admin-sales"),
]
