from pydantic import BaseModel


class CandidateCreate(BaseModel):
    full_name: str
    country: str | None = None
    city: str | None = None
    education: str | None = None
    experience_years: float | None = None
    job_title: str | None = None
    career_goal: str | None = None