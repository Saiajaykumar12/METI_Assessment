from supabase import create_client, Client

from app.core.config import settings


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
)

admin_supabase: Client | None = None

if settings.SUPABASE_SERVICE_ROLE_KEY:
    admin_supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
else:
    admin_supabase = supabase
