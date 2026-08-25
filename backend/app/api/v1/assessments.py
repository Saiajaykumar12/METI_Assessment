from fastapi import APIRouter, HTTPException

from app.db.database import supabase

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get("")
def get_assessments():
    result = (
        supabase
        .table("assessments")
        .select("*")
        .eq("status", "published")
        .execute()
    )

    return result.data


@router.get("/{assessment_id}")
def get_assessment(assessment_id: str):
    result = (
        supabase
        .table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    return result.data


@router.get("/{assessment_id}/questions")
def get_questions(assessment_id: str):
    result = (
        supabase
        .table("assessment_sections")
        .select(
            "id, title, description, display_order, "
            "questions(id, question_code, question_type, "
            "question_text, options, required, display_order)"
        )
        .eq("assessment_id", assessment_id)
        .order("display_order")
        .execute()
    )

    return result.data