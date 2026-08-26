from fastapi import APIRouter, HTTPException
from app.services.scoring import calculate_score
from datetime import datetime, timezone

from app.db.database import supabase
from app.schemas.attempts import (
    CreateAttemptRequest,
    SaveResponseRequest,
)

router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


@router.post("")
def create_attempt(
    assessment_id: str,
    request: CreateAttemptRequest,
):
    assessment = (
        supabase
        .table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .single()
        .execute()
    )

    if not assessment.data:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    attempt = (
        supabase
        .table("assessment_attempts")
        .insert({
            "candidate_id": request.candidate_id,
            "assessment_id": assessment_id,
            "assessment_version": assessment.data["version"],
            "status": "in_progress",
        })
        .execute()
    )

    return attempt.data[0]


@router.get("/{attempt_id}")
def get_attempt(attempt_id: str):
    result = (
        supabase
        .table("assessment_attempts")
        .select("*")
        .eq("id", attempt_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found",
        )

    return result.data


@router.put("/{attempt_id}/responses/{question_id}")
def save_response(
    attempt_id: str,
    question_id: str,
    request: SaveResponseRequest,
):
    attempt = (
        supabase
        .table("assessment_attempts")
        .select("id,status")
        .eq("id", attempt_id)
        .single()
        .execute()
    )

    if not attempt.data:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found",
        )

    if attempt.data["status"] != "in_progress":
        raise HTTPException(
            status_code=400,
            detail="Assessment is already submitted",
        )

    result = (
        supabase
        .table("responses")
        .upsert({
            "attempt_id": attempt_id,
            "question_id": question_id,
            "answer": request.answer,
        })
        .execute()
    )

    return {
        "saved": True,
        "response": result.data[0] if result.data else None,
    }


@router.get("/{attempt_id}/responses")
def get_responses(attempt_id: str):
    result = (
        supabase
        .table("responses")
        .select("*")
        .eq("attempt_id", attempt_id)
        .execute()
    )

    return result.data

@router.post("/{attempt_id}/submit")
def submit_attempt(attempt_id: str):

    attempt = (
        supabase
        .table("assessment_attempts")
        .select("*")
        .eq("id", attempt_id)
        .single()
        .execute()
    )

    if not attempt.data:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found",
        )

    if attempt.data["status"] == "completed":
        raise HTTPException(
            status_code=400,
            detail="Assessment already submitted",
        )

    # Calculate score
    try:
        score = calculate_score(attempt_id)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    # Save score
    score_result = (
        supabase
        .table("scores")
        .insert({
            "attempt_id": attempt_id,
            "cci": score["overall_score"],
            "competency_scores": score["competency_scores"],
            "strengths": score["strengths"],
            "development_gaps": score["development_gaps"],
        })
        .execute()
    )

    # Mark attempt completed
    attempt_result = (
        supabase
        .table("assessment_attempts")
        .update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        })
        .eq("id", attempt_id)
        .execute()
    )

    return {
        "message": "Assessment submitted successfully",
        "score": score,
        "attempt": (
            attempt_result.data[0]
            if attempt_result.data
            else None
        ),
        "score_record": (
            score_result.data[0]
            if score_result.data
            else None
        ),
    }


