from pydantic import BaseModel
from typing import Any


class CreateAttemptRequest(BaseModel):
    candidate_id: str


class SaveResponseRequest(BaseModel):
    answer: Any