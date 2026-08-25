from pydantic import BaseModel
from typing import Any


class AssessmentResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str | None = None
    version: int
    status: str


class QuestionResponse(BaseModel):
    id: str
    question_code: str
    question_type: str
    question_text: str
    options: Any
    required: bool
    display_order: int