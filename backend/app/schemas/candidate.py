from pydantic import BaseModel, Field


class CandidateCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)
    education: str | None = Field(default=None, max_length=200)
    experience_years: float | None = Field(default=None, ge=0, le=80)
    job_title: str | None = Field(default=None, max_length=160)
    career_goal: str | None = Field(default=None, max_length=2000)