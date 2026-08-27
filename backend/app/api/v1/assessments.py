from fastapi import APIRouter, HTTPException

from app.db.database import supabase


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get("")
def get_assessments():

    try:
        result = (
            supabase
            .table("assessments")
            .select("*")
            .eq("status", "published")
            .execute()
        )

        return result.data or []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch assessments: {str(e)}",
        )


@router.get("/{assessment_id}/questions")
def get_questions(assessment_id: str):

    try:
        assessment = (
            supabase
            .table("assessments")
            .select("id")
            .eq("id", assessment_id)
            .single()
            .execute()
        )

        if not assessment.data:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found",
            )

        result = (
            supabase
            .table("questions")
            .select("*")
            .eq("assessment_id", assessment_id)
            .order("order_index")
            .execute()
        )

        return result.data or []

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch questions: {str(e)}",
        )