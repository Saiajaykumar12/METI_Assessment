from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    SUPABASE_URL: str
    SUPABASE_KEY: str

    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    AI_API_KEY: str | None = None
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,"
        "https://futureskillpredictor.vercel.app"
    )
    MAX_RESUME_SIZE_BYTES: int = 5_000_000

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        extra="ignore",
    )


settings = Settings()