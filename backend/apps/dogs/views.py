from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.dogs.models import Dog, RestrictedBreed
from apps.dogs.serializers import DogSerializer, DogVaccineReviewSerializer, RestrictedBreedSerializer
from apps.reservations.models import Reservation, ReservationDog


class DogViewSet(viewsets.ModelViewSet):
    serializer_class = DogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Dog.objects.select_related("owner", "vaccine_reviewed_by").all()
        return Dog.objects.select_related("owner", "vaccine_reviewed_by").filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        dog = self.get_object()
        active_reservation_exists = ReservationDog.objects.filter(
            dog=dog,
            reservation__status__in=Reservation.active_statuses(),
        ).exists()
        if active_reservation_exists:
            return Response(
                {"detail": "有効な予約に紐づく犬は削除できません。予約をキャンセルしてから再度お試しください。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if dog.is_active:
            dog.is_active = False
            dog.save(update_fields=["is_active", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DogSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Dog.objects.select_related("owner", "vaccine_reviewed_by").all()

    @action(detail=True, methods=["post"])
    def review_vaccine(self, request, pk=None):
        dog = self.get_object()
        serializer = DogVaccineReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dog.vaccine_approval_status = serializer.validated_data["vaccine_approval_status"]
        dog.vaccine_review_note = serializer.validated_data.get("vaccine_review_note", "")
        dog.vaccine_reviewed_at = timezone.now()
        dog.vaccine_reviewed_by = request.user
        dog.save(
            update_fields=[
                "vaccine_approval_status",
                "vaccine_review_note",
                "vaccine_reviewed_at",
                "vaccine_reviewed_by",
                "updated_at",
            ]
        )

        return Response(DogSerializer(dog).data, status=status.HTTP_200_OK)


class RestrictedBreedViewSet(viewsets.ModelViewSet):
    serializer_class = RestrictedBreedSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = RestrictedBreed.objects.all()
