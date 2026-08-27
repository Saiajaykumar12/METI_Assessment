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
            .in_("status", ["active", "published"])
            .order("created_at", desc=True)
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
            .limit(1)
            .execute()
        )

        if not assessment.data:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found",
            )

        sections_result = (
            supabase
            .table("assessment_sections")
            .select("id, display_order")
            .eq("assessment_id", assessment_id)
            .order("display_order")
            .execute()
        )

        sections = sections_result.data or []

        if not sections:
            return []

        section_ids = [
            section["id"]
            for section in sections
        ]

        questions_result = (
            supabase
            .table("questions")
            .select("*")
            .in_("section_id", section_ids)
            .order("display_order")
            .execute()
        )

        return questions_result.data or []

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch questions: {str(e)}",
        )