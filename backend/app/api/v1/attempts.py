from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.schemas.attempts import SaveResponseRequest
from app.services.scoring import calculate_score


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


@router.post("")
def create_attempt(
    assessment_id: str,
    candidate_id: str,
):
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

        candidate = (
            supabase
            .table("candidates")
            .select("id")
            .eq("id", candidate_id)
            .limit(1)
            .execute()
        )

        if not candidate.data:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found",
            )

        existing = (
            supabase
            .table("attempts")
            .select("*")
            .eq("assessment_id", assessment_id)
            .eq("candidate_id", candidate_id)
            .eq("status", "in_progress")
            .limit(1)
            .execute()
        )

        if existing.data:
            return existing.data[0]

        result = (
            supabase
            .table("attempts")
            .insert({
                "assessment_id": assessment_id,
                "candidate_id": candidate_id,
                "status": "in_progress",
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Could not create attempt",
            )

        return result.data[0]

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
            .table("attempts")
            .select("*")
            .eq("id", attempt_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Attempt not found",
            )

        return result.data[0]

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
            .table("attempts")
            .select("id,status")
            .eq("id", attempt_id)
            .limit(1)
            .execute()
        )

        if not attempt.data:
            raise HTTPException(
                status_code=404,
                detail="Attempt not found",
            )

        if attempt.data[0]["status"] != "in_progress":
            raise HTTPException(
                status_code=400,
                detail="Assessment is already submitted",
            )

        result = (
            supabase
            .table("responses")
            .upsert(
                {
                    "attempt_id": attempt_id,
                    "question_id": question_id,
                    "answer": request.answer,
                    "submitted_at": datetime.now(
                        timezone.utc
                    ).isoformat(),
                },
                on_conflict="attempt_id,question_id",
            )
            .execute()
        )

        return {
            "saved": True,
            "response": (
                result.data[0]
                if result.data
                else None
            ),
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
            .table("attempts")
            .select("*")
            .eq("id", attempt_id)
            .limit(1)
            .execute()
        )

        if not attempt.data:
            raise HTTPException(
                status_code=404,
                detail="Attempt not found",
            )

        attempt_data = attempt.data[0]

        if attempt_data["status"] == "completed":
            raise HTTPException(
                status_code=400,
                detail="Assessment already submitted",
            )

        score = calculate_score(attempt_id)

        completed_at = datetime.now(
            timezone.utc
        ).isoformat()

        updated = (
            supabase
            .table("attempts")
            .update({
                "status": "completed",
                "submitted_at": completed_at,
            })
            .eq("id", attempt_id)
            .execute()
        )

        return {
            "message": "Assessment submitted successfully",
            "score": score,
            "attempt": (
                updated.data[0]
                if updated.data
                else attempt_data
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