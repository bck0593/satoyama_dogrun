from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.serializers import AdminMemberSerializer, LineLoginSerializer, UserProfileSerializer

User = get_user_model()


class LineLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth_line"

    def post(self, request, *args, **kwargs):
        serializer = LineLoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user, created = serializer.get_or_create_user()

        if user.is_suspended:
            return Response(
                {
                    "detail": "no-showペナルティにより利用停止中です。",
                    "suspended_until": user.suspended_until,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
                "is_new_user": created,
            }
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminMemberViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminMemberSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.annotate(dog_count=Count("dogs")).order_by("-created_at")
