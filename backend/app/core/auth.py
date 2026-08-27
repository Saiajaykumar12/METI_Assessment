from fastapi import Header, HTTPException

from app.db.database import admin_supabase, supabase


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    try:
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        return response.user

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}",
        )


def get_owned_candidate(candidate_id: str, user):
    result = (
        admin_supabase
        .table("candidates")
        .select("*")
        .eq("id", candidate_id)
        .eq("user_id", str(user.id))
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    return result.data[0]


def get_owned_attempt(attempt_id: str, user):
    result = (
        admin_supabase
        .table("assessment_attempts")
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

    attempt = result.data[0]
    get_owned_candidate(attempt["candidate_id"], user)
    return attempt


def get_owned_assessment(assessment_id: str, user):
    result = (
        admin_supabase
        .table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    assessment = result.data[0]
    get_owned_candidate(assessment["candidate_id"], user)
    return assessment