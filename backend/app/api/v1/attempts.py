from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.schemas.attempts import (
    CreateAttemptRequest,
    SaveResponseRequest,
)
from app.services.scoring import calculate_score


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


@router.post("")
def create_attempt(
    assessment_id: str,
    request: CreateAttemptRequest,
):

    try:
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

        if not attempt.data:
            raise HTTPException(
                status_code=400,
                detail="Could not create attempt",
            )

        return attempt.data[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create attempt: {str(e)}",
        )


@router.get("/{attempt_id}")
def get_attempt(attempt_id: str):

    try:
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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get attempt: {str(e)}",
        )


@router.put("/{attempt_id}/responses/{question_id}")
def save_response(
    attempt_id: str,
    question_id: str,
    request: SaveResponseRequest,
):

    try:
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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save response: {str(e)}",
        )


@router.get("/{attempt_id}/responses")
def get_responses(attempt_id: str):

    try:
        result = (
            supabase
            .table("responses")
            .select("*")
            .eq("attempt_id", attempt_id)
            .execute()
        )

        return result.data or []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get responses: {str(e)}",
        )


@router.post("/{attempt_id}/submit")
def submit_attempt(attempt_id: str):

    try:
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

        score = calculate_score(attempt_id)

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

        attempt_result = (
            supabase
            .table("assessment_attempts")
            .update({
                "status": "completed",
                "completed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
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

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit assessment: {str(e)}",
        )