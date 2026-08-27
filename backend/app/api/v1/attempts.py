from app.db.database import admin_supabase as supabase
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client

from app.core.auth import (
    get_current_user,
    get_owned_assessment,
    get_owned_attempt,
    get_owned_candidate,
)
from app.db.database import admin_supabase as supabase
from app.core.config import settings
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
    user=Depends(get_current_user),
):
    try:
        # -------------------------------------------------
        # Check assessment
        # -------------------------------------------------

        assessment_data = get_owned_assessment(assessment_id, user)

        # -------------------------------------------------
        # Check candidate
        # -------------------------------------------------

        get_owned_candidate(candidate_id, user)

        if assessment_data.get("candidate_id") != candidate_id:
            raise HTTPException(
                status_code=400,
                detail="Candidate does not match assessment",
            )

        # -------------------------------------------------
        # Reuse existing in-progress attempt
        # -------------------------------------------------

        existing = (
            supabase
            .table("assessment_attempts")
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
            .table("assessment_attempts")
            .insert({
                "assessment_id": assessment_id,
                "candidate_id": candidate_id,
                "assessment_version": assessment_data.get("version", 1),
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
def get_attempt(
    attempt_id: str,
    user=Depends(get_current_user),
):
    try:
        return get_owned_attempt(attempt_id, user)

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
    user=Depends(get_current_user),
):
    try:
        # -------------------------------------------------
        # Verify attempt
        # -------------------------------------------------

        attempt_data = get_owned_attempt(attempt_id, user)

        if (
            attempt_data["status"]
            != "in_progress"
        ):
            raise HTTPException(
                status_code=400,
                detail="Assessment is already submitted",
            )

        question = (
            supabase
            .table("questions")
            .select("id,section_id")
            .eq("id", question_id)
            .limit(1)
            .execute()
        )

        if not question.data:
            raise HTTPException(
                status_code=404,
                detail="Question not found",
            )

        section = (
            supabase
            .table("assessment_sections")
            .select("id")
            .eq("id", question.data[0]["section_id"])
            .eq("assessment_id", attempt_data["assessment_id"])
            .limit(1)
            .execute()
        )

        if not section.data:
            raise HTTPException(
                status_code=400,
                detail="Question does not belong to this assessment",
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

        response_data = {
            "attempt_id": attempt_id,
            "question_id": question_id,
            "answer": request.answer,
            "submitted_at": now,
        }

        response_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )

        try:
            result = (
                response_client
                .table("responses")
                .upsert(
                    response_data,
                    on_conflict="attempt_id,question_id",
                )
                .execute()
            )
        except Exception:
            fresh_supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY,
            )
            result = (
                fresh_supabase
                .table("responses")
                .upsert(
                    response_data,
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
def get_responses(
    attempt_id: str,
    user=Depends(get_current_user),
):
    try:
        # -------------------------------------------------
        # Verify attempt
        # -------------------------------------------------

        get_owned_attempt(attempt_id, user)

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
def submit_attempt(
    attempt_id: str,
    user=Depends(get_current_user),
):
    try:
        # -------------------------------------------------
        # Get attempt
        # -------------------------------------------------

        attempt_data = get_owned_attempt(attempt_id, user)

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
        # SAVE SCORE
        #
        # Calculate CCI (Competency Confidence Index)
        # and CPI (Competency Performance Index)
        # -------------------------------------------------

        competency_scores = score.get(
            "competency_scores",
            {}
        )

        competency_values = list(
            competency_scores.values()
        )

        cci = (
            round(
                sum(competency_values) /
                len(competency_values),
                2
            )
            if competency_values
            else 0
        )

        cpi = score.get(
            "overall_score",
            0
        )

        evidence_confidence = 0.85

        result_data = {
            "attempt_id": attempt_id,
            "cci": cci,
            "cpi": cpi,
            "evidence_confidence": (
                evidence_confidence
            ),
            "competency_scores": (
                competency_scores
            ),
            "strengths": score.get(
                "strengths",
                []
            ),
            "development_gaps": score.get(
                "development_gaps",
                []
            ),
            "created_at": completed_at,
        }

        saved_result = (
            supabase
            .table("scores")
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
            .table("assessment_attempts")
            .update({
                "status": "completed",
                "completed_at": completed_at,
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
    candidate_id: str,
    user=Depends(get_current_user),
):
    try:
        # -------------------------------------------------
        # Verify candidate
        # -------------------------------------------------

        candidate_data = get_owned_candidate(candidate_id, user)

        # -------------------------------------------------
        # Get candidate attempts
        # -------------------------------------------------

        attempts = (
            supabase
            .table("assessment_attempts")
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
                .table("scores")
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
                    "score": result.data[0],
                })

        # -------------------------------------------------
        # Return dashboard data
        # -------------------------------------------------

        return {
            "candidate_id": candidate_id,

            "candidate": candidate_data,

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