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
        .execute()
    )

    return result.data


@router.get("/{assessment_id}/questions")
def get_questions(assessment_id: str):

    result = (
        supabase
        .table("questions")
        .select("*")
        .eq("assessment_id", assessment_id)
        .execute()
    )

    return result.data