import base64
import json

from supabase import create_client, Client

from app.core.config import settings


def _validate_service_role_key(key: str) -> None:
    if key.startswith("sb_secret_"):
        return

    try:
        payload = key.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        role = json.loads(
            base64.urlsafe_b64decode(payload)
        ).get("role")
    except (IndexError, ValueError, TypeError, json.JSONDecodeError):
        role = None

    if role != "service_role":
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY must be a service-role key"
        )


_validate_service_role_key(
    settings.SUPABASE_SERVICE_ROLE_KEY
)


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
)

admin_supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)
