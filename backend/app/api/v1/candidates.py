from fastapi import APIRouter, HTTPException, Depends

from app.db.database import supabase
from app.schemas.candidate import CandidateCreate
from app.core.auth import get_current_user


router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"],
)


@router.post("")
def create_candidate(
    request: CandidateCreate,
    user=Depends(get_current_user)
):

    candidate_data = {
        "user_id": user.id,
        "full_name": request.full_name,
        "country": request.country,
        "city": request.city,
        "education": request.education,
        "experience_years": request.experience_years,
        "job_title": request.job_title,
        "career_goal": request.career_goal,
    }

    result = (
        supabase
        .table("candidates")
        .insert(candidate_data)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=400,
            detail="Could not create candidate"
        )

    return result.data[0]