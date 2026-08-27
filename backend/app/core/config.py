from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    SUPABASE_URL: str
    SUPABASE_KEY: str

    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    AI_API_KEY: str | None = None
    MAX_RESUME_SIZE_BYTES: int = 5_000_000

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()