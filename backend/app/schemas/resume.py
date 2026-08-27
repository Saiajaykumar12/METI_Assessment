from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: str
    file_name: str
    status: str


class GenerateQuestionsRequest(BaseModel):
    candidate_id: str