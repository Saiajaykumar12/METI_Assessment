from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.schemas.attempts import SaveResponseRequest
from app.services.scoring import calculate_score


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


# =========================================================
# CREATE ATTEMPT
# =========================================================

@router.post("")
def create_attempt(
    assessment_id: str,
    candidate_id: str,
):
    try:
        # -------------------------------------------------
        # Check assessment
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Check candidate
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Reuse existing in-progress attempt
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Create new attempt
        # -------------------------------------------------

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


# =========================================================
# GET ATTEMPT
# =========================================================

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


# =========================================================
# SAVE / UPDATE RESPONSE
# =========================================================

@router.put(
    "/{attempt_id}/responses/{question_id}"
)
def save_response(
    attempt_id: str,
    question_id: str,
    request: SaveResponseRequest,
):
    try:
        # -------------------------------------------------
        # Verify attempt
        # -------------------------------------------------

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

        if (
            attempt.data[0]["status"]
            != "in_progress"
        ):
            raise HTTPException(
                status_code=400,
                detail="Assessment is already submitted",
            )

        # -------------------------------------------------
        # UPSERT RESPONSE
        #
        # Unique constraint:
        # attempt_id + question_id
        #
        # First answer  -> INSERT
        # Changed answer -> UPDATE
        # -------------------------------------------------

        now = datetime.now(
            timezone.utc
        ).isoformat()

        result = (
            supabase
            .table("responses")
            .upsert(
                {
                    "attempt_id": attempt_id,
                    "question_id": question_id,
                    "answer": request.answer,
                    "submitted_at": now,
                },
                on_conflict="attempt_id,question_id",
            )
            .execute()
        )

        return {
            "saved": True,
            "action": "upserted",
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
            detail=(
                "Failed to save response: "
                f"{str(e)}"
            ),
        )


# =========================================================
# GET ALL RESPONSES FOR ATTEMPT
# =========================================================

@router.get(
    "/{attempt_id}/responses"
)
def get_responses(attempt_id: str):
    try:
        # -------------------------------------------------
        # Verify attempt
        # -------------------------------------------------

        attempt = (
            supabase
            .table("attempts")
            .select("id")
            .eq("id", attempt_id)
            .limit(1)
            .execute()
        )

        if not attempt.data:
            raise HTTPException(
                status_code=404,
                detail="Attempt not found",
            )

        # -------------------------------------------------
        # Get responses
        # -------------------------------------------------

        result = (
            supabase
            .table("responses")
            .select("*")
            .eq("attempt_id", attempt_id)
            .execute()
        )

        return result.data or []

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get responses: {str(e)}",
        )


# =========================================================
# SUBMIT ATTEMPT
# =========================================================

@router.post(
    "/{attempt_id}/submit"
)
def submit_attempt(attempt_id: str):
    try:
        # -------------------------------------------------
        # Get attempt
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Prevent duplicate submission
        # -------------------------------------------------

        if (
            attempt_data["status"]
            == "completed"
        ):
            raise HTTPException(
                status_code=400,
                detail="Assessment already submitted",
            )

        # -------------------------------------------------
        # Calculate score
        # -------------------------------------------------

        score = calculate_score(
            attempt_id
        )

        completed_at = datetime.now(
            timezone.utc
        ).isoformat()

        # -------------------------------------------------
        # SAVE RESULT
        #
        # This is the important new part.
        # -------------------------------------------------

        result_data = {
            "attempt_id": attempt_id,
            "overall_score": score[
                "overall_score"
            ],
            "competency_scores": score[
                "competency_scores"
            ],
            "strengths": score[
                "strengths"
            ],
            "development_gaps": score[
                "development_gaps"
            ],
            "total_score": score[
                "total_score"
            ],
            "max_score": score[
                "max_score"
            ],
            "updated_at": completed_at,
        }

        saved_result = (
            supabase
            .table("results")
            .upsert(
                result_data,
                on_conflict="attempt_id",
            )
            .execute()
        )

        if not saved_result.data:
            raise HTTPException(
                status_code=500,
                detail="Could not save assessment result",
            )

        # -------------------------------------------------
        # Mark attempt completed
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        return {
            "message":
                "Assessment submitted successfully",

            "score": score,

            "result": (
                saved_result.data[0]
                if saved_result.data
                else None
            ),

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
            detail=(
                "Failed to submit assessment: "
                f"{str(e)}"
            ),
        )


# =========================================================
# GET CANDIDATE DASHBOARD RESULTS
# =========================================================

@router.get(
    "/candidate/{candidate_id}/results"
)
def get_candidate_results(
    candidate_id: str
):
    try:
        # -------------------------------------------------
        # Verify candidate
        # -------------------------------------------------

        candidate = (
            supabase
            .table("candidates")
            .select("id,full_name")
            .eq("id", candidate_id)
            .limit(1)
            .execute()
        )

        if not candidate.data:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found",
            )

        # -------------------------------------------------
        # Get candidate attempts
        # -------------------------------------------------

        attempts = (
            supabase
            .table("attempts")
            .select("*")
            .eq(
                "candidate_id",
                candidate_id,
            )
            .order(
                "started_at",
                desc=True,
            )
            .execute()
        )

        results = []

        # -------------------------------------------------
        # Get stored results
        # -------------------------------------------------

        for attempt in (
            attempts.data or []
        ):

            if (
                attempt.get("status")
                != "completed"
            ):
                continue

            result = (
                supabase
                .table("results")
                .select("*")
                .eq(
                    "attempt_id",
                    attempt["id"],
                )
                .limit(1)
                .execute()
            )

            if result.data:
                results.append({
                    "attempt": attempt,
                    "result": result.data[0],
                })

        # -------------------------------------------------
        # Return dashboard data
        # -------------------------------------------------

        return {
            "candidate_id": candidate_id,

            "candidate": (
                candidate.data[0]
                if candidate.data
                else None
            ),

            "results": results,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load dashboard results: "
                f"{str(e)}"
            ),
        )