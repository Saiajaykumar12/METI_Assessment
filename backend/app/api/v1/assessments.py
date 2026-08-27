from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user, get_owned_assessment
from app.db.database import admin_supabase


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get("")
def get_assessments(user=Depends(get_current_user)):
    try:
        candidates = (
            admin_supabase
            .table("candidates")
            .select("id")
            .eq("user_id", str(user.id))
            .execute()
        )
        candidate_ids = [item["id"] for item in (candidates.data or [])]

        if not candidate_ids:
            return []

        result = (
            admin_supabase
            .table("assessments")
            .select("*")
            .in_("candidate_id", candidate_ids)
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
def get_questions(
    assessment_id: str,
    user=Depends(get_current_user),
):
    try:
        get_owned_assessment(assessment_id, user)

        sections_result = (
            admin_supabase
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
            admin_supabase
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