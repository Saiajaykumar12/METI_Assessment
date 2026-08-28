from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.db.database import admin_supabase
from app.schemas.candidate import CandidateCreate


router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"],
)


@router.post("")
def create_candidate(
    request: CandidateCreate,
    user=Depends(get_current_user),
):
    user_id = str(user.id)

    candidate_data = {
        "user_id": user_id,
        "full_name": request.full_name,
        "country": request.country,
        "city": request.city,
        "education": request.education,
        "experience_years": request.experience_years,
        "job_title": request.job_title,
        "career_goal": request.career_goal,
    }

    try:
        existing = (
            admin_supabase
            .table("candidates")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            candidate_id = existing.data[0]["id"]

            result = (
                admin_supabase
                .table("candidates")
                .update(candidate_data)
                .eq("id", candidate_id)
                .execute()
            )

            if not result.data:
                raise HTTPException(
                    status_code=400,
                    detail="Could not update candidate",
                )

            return result.data[0]

        result = (
            admin_supabase
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