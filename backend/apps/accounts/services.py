from __future__ import annotations

from dataclasses import dataclass

import requests
from django.conf import settings


LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify"


@dataclass
class LineProfile:
    line_user_id: str
    display_name: str
    email: str


def verify_line_id_token(id_token: str) -> LineProfile:
    if not settings.LINE_CHANNEL_ID:
        raise ValueError("LINE_CHANNEL_ID is not configured.")

    response = requests.post(
        LINE_VERIFY_URL,
        data={"id_token": id_token, "client_id": settings.LINE_CHANNEL_ID},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()

    return LineProfile(
        line_user_id=payload["sub"],
        display_name=payload.get("name", "LINE User"),
        email=payload.get("email", ""),
    )
