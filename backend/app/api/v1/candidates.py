from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.schemas.candidate import CandidateCreate


router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"],
)


@router.post("")
def create_candidate(request: CandidateCreate):

    candidate_data = {
        "full_name": request.full_name,
        "country": request.country,
        "city": request.city,
        "education": request.education,
        "experience_years": request.experience_years,
        "job_title": request.job_title,
        "career_goal": request.career_goal,
    }

    try:
        result = (
            supabase
            .table("candidates")
            .insert(candidate_data)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Could not create candidate",
            )

        return result.data[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create candidate: {str(e)}",
        )