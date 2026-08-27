from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.assessments import (
    router as assessments_router,
)
from app.api.v1.attempts import (
    router as attempts_router,
)
from app.api.v1.candidates import (
    router as candidates_router,
)
from app.api.v1.resumes import (
    router as resumes_router,
)

from app.db.database import supabase


app = FastAPI(
    title="METI Assessment API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    candidates_router,
    prefix="/api/v1",
)

app.include_router(
    assessments_router,
    prefix="/api/v1",
)

app.include_router(
    attempts_router,
    prefix="/api/v1",
)

app.include_router(
    resumes_router,
    prefix="/api/v1",
)


@app.get("/health")
def health_check():
    try:
        supabase.table(
            "assessments"
        ).select(
            "id"
        ).limit(1).execute()

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "connection_failed",
            "detail": str(e),
        }