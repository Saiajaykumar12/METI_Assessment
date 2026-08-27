from fastapi import Header, HTTPException

from app.db.database import supabase


def get_current_user(
    authorization: str | None = Header(default=None),
):
    """
    Validate the Supabase access token sent by the frontend.

    Expected header:

        Authorization: Bearer <access_token>
    """

    # ---------------------------------------------------------
    # 1. Check Authorization header
    # ---------------------------------------------------------

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required",
        )

    # ---------------------------------------------------------
    # 2. Check Bearer format
    # ---------------------------------------------------------

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    # ---------------------------------------------------------
    # 3. Extract token
    # ---------------------------------------------------------

    token = authorization.split(
        " ",
        1,
    )[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    # ---------------------------------------------------------
    # 4. Validate token with Supabase
    # ---------------------------------------------------------

    try:

        response = supabase.auth.get_user(
            token
        )

        # -----------------------------------------------------
        # Check Supabase response
        # -----------------------------------------------------

        if not response:

            raise HTTPException(
                status_code=401,
                detail="Supabase returned an empty response",
            )

        if not response.user:

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired Supabase token",
            )

        # -----------------------------------------------------
        # Authentication successful
        # -----------------------------------------------------

        return response.user

    except HTTPException:
        raise

    except Exception as e:

        # IMPORTANT:
        # Print the real error in the backend terminal.
        # This will help us identify whether the problem is
        # DNS, Supabase URL, token expiration, network, etc.

        print(
            "\n"
            + "=" * 70
        )

        print(
            "SUPABASE AUTHENTICATION ERROR"
        )

        print(
            f"Error type: {type(e).__name__}"
        )

        print(
            f"Error: {str(e)}"
        )

        print(
            "=" * 70
            + "\n"
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired token: "
                f"{str(e)}"
            ),
        )