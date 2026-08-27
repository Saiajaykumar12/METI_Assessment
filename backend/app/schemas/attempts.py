from typing import Any

from pydantic import BaseModel


class CreateAttemptRequest(BaseModel):
    candidate_id: str


class SaveResponseRequest(BaseModel):
    answer: Any