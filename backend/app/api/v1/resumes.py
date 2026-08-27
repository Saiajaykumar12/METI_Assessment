import io
import json
import re
import uuid

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
)

from app.core.auth import get_current_user
from app.db.database import supabase
from app.core.config import settings


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


def extract_pdf_text(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(
            io.BytesIO(file_bytes)
        )

        pages = []

        for page in reader.pages:
            text = page.extract_text()

            if text:
                pages.append(text)

        return "\n".join(pages).strip()

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read PDF: {str(e)}",
        )


def generate_questions_with_gemini(
    resume_text: str,
):
    try:
        from google import genai

        client = genai.Client(
            api_key=settings.AI_API_KEY
        )

        prompt = f"""
You are an AI technical assessment generator.

Analyze the candidate resume and create a technical
assessment ONLY from technologies and skills actually
present in the resume.

Generate exactly:
- 3 sections
- 4 questions per section
- 12 questions total

Use mainly MCQ questions.

Every MCQ must contain:
- question_code
- question_type
- question_text
- options
- correct_answer
- competency
- required

Allowed question_type:
mcq
text
coding

For text and coding:
options must be [].
correct_answer can be "".

Return ONLY valid JSON.

Format:

{{
  "sections": [
    {{
      "title": "Python",
      "description": "Python technical knowledge",
      "questions": [
        {{
          "question_code": "Q1",
          "question_type": "mcq",
          "question_text": "Question",
          "options": [
            "A",
            "B",
            "C",
            "D"
          ],
          "correct_answer": "A",
          "competency": "Python",
          "required": true
        }}
      ]
    }}
  ]
}}

Candidate resume:
-------------------------
{resume_text[:30000]}
-------------------------
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        response_text = (
            response.text or ""
        ).strip()

        response_text = re.sub(
            r"^```json\s*",
            "",
            response_text,
            flags=re.IGNORECASE,
        )

        response_text = re.sub(
            r"^```\s*",
            "",
            response_text,
        )

        response_text = re.sub(
            r"\s*```$",
            "",
            response_text,
        )

        data = json.loads(response_text)

        if "sections" not in data:
            raise ValueError(
                "Gemini response does not contain sections"
            )

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini returned invalid JSON: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini question generation failed: "
                f"{str(e)}"
            ),
        )


def create_assessment(
    candidate_id: str,
    resume_id: str,
    ai_data: dict,
):
    assessment_id = str(uuid.uuid4())

    assessment_data = {
        "id": assessment_id,
        "code": (
            f"RESUME-{assessment_id[:8].upper()}"
        ),
        "name": "AI Generated Assessment",
        "description": (
            "Assessment generated from candidate resume"
        ),
        "version": 1,
        "status": "active",
        "candidate_id": candidate_id,
        "source": "resume",
    }

    assessment_result = (
        supabase
        .table("assessments")
        .insert(assessment_data)
        .execute()
    )

    if not assessment_result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create assessment",
        )

    sections = ai_data.get(
        "sections",
        [],
    )

    if not sections:
        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini did not generate assessment sections"
            ),
        )

    total_questions = 0

    for section_index, section in enumerate(
        sections
    ):
        section_id = str(uuid.uuid4())

        section_data = {
            "id": section_id,
            "assessment_id": assessment_id,
            "title": section.get(
                "title",
                f"Section {section_index + 1}",
            ),
            "description": section.get(
                "description",
                "",
            ),
            "display_order": section_index + 1,
        }

        section_result = (
            supabase
            .table("assessment_sections")
            .insert(section_data)
            .execute()
        )

        if not section_result.data:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Failed to create section "
                    f"{section_index + 1}"
                ),
            )

        questions = section.get(
            "questions",
            [],
        )

        for question_index, question in enumerate(
            questions
        ):
            correct_answer = question.get(
                "correct_answer",
                "",
            )

            competency = question.get(
                "competency",
                section.get(
                    "title",
                    "General",
                ),
            )

            question_data = {
                "id": str(uuid.uuid4()),
                "section_id": section_id,
                "question_code": question.get(
                    "question_code",
                    f"Q{question_index + 1}",
                ),
                "question_type": question.get(
                    "question_type",
                    "mcq",
                ),
                "question_text": question.get(
                    "question_text",
                    "",
                ),
                "options": question.get(
                    "options",
                    [],
                ),
                "scoring_config": {
                    "correct": correct_answer,
                    "competency": competency,
                    "score": 1,
                },
                "required": question.get(
                    "required",
                    True,
                ),
                "display_order": (
                    question_index + 1
                ),
            }

            question_result = (
                supabase
                .table("questions")
                .insert(question_data)
                .execute()
            )

            if not question_result.data:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Failed to create question "
                        f"{question_index + 1}"
                    ),
                )

            total_questions += 1

    return {
        "assessment_id": assessment_id,
        "resume_id": resume_id,
        "candidate_id": candidate_id,
        "sections": len(sections),
        "questions": total_questions,
    }


@router.post("/upload")
async def upload_resume(
    candidate_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    try:
        uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate_id",
        )

    user_id = str(user.id)

    candidate = (
        supabase
        .table("candidates")
        .select("id,user_id")
        .eq("id", candidate_id)
        .limit(1)
        .execute()
    )

    if not candidate.data:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    if candidate.data[0]["user_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="Candidate does not belong to current user",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    resume_text = extract_pdf_text(
        file_bytes
    )

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract text from the resume. "
                "Please upload a text-based PDF."
            ),
        )

    resume_id = str(uuid.uuid4())

    resume_data = {
        "id": resume_id,
        "candidate_id": candidate_id,
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_path": (
            f"resumes/{candidate_id}/"
            f"{resume_id}.pdf"
        ),
    }

    try:
        result = (
            supabase
            .table("resumes")
            .insert(resume_data)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save resume",
            )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save resume: {str(e)}"
            ),
        )

    ai_data = generate_questions_with_gemini(
        resume_text
    )

    assessment_result = create_assessment(
        candidate_id=candidate_id,
        resume_id=resume_id,
        ai_data=ai_data,
    )

    return {
        "message": (
            "Resume uploaded and assessment "
            "generated successfully"
        ),
        "resume": {
            "id": resume_id,
            "file_name": file.filename,
        },
        "assessment": assessment_result,
    }