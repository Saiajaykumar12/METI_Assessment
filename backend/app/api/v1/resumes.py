import io
import json
import re
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.db.database import supabase
from app.core.config import settings


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


# ---------------------------------------------------------
# PDF TEXT EXTRACTION
# ---------------------------------------------------------

def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Extract text from a PDF resume.
    """

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))

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


# ---------------------------------------------------------
# GEMINI
# ---------------------------------------------------------

def generate_questions_with_gemini(resume_text: str):
    """
    Generate assessment sections and questions from the resume.
    """

    try:
        from google import genai

        client = genai.Client(
            api_key=settings.AI_API_KEY
        )

        prompt = f"""
You are an AI technical assessment generator.

Analyze the candidate resume below and create a technical assessment
based on the candidate's actual skills, technologies, education and
experience.

IMPORTANT:
- Do not create questions about technologies that are not present
  in the resume.
- Questions should match the candidate's experience level.
- Generate practical technical questions.
- Generate multiple-choice questions where possible.
- Generate coding/programming questions where appropriate.
- Generate 3 sections.
- Generate 4 questions per section.

Return ONLY valid JSON.

Required JSON structure:

{{
  "sections": [
    {{
      "title": "Section title",
      "description": "Short description",
      "questions": [
        {{
          "question_code": "Q1",
          "question_type": "mcq",
          "question_text": "Question text",
          "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          "required": true
        }}
      ]
    }}
  ]
}}

Allowed question_type values:

- mcq
- text
- coding

For coding/text questions, options must be [].

Candidate resume:

-------------------------
{resume_text[:30000]}
-------------------------
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        response_text = response.text.strip()

        # Remove markdown code fences if Gemini returns them
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
            raise ValueError("Gemini response does not contain sections")

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini returned invalid JSON: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini question generation failed: {str(e)}",
        )


# ---------------------------------------------------------
# CREATE ASSESSMENT
# ---------------------------------------------------------

def create_assessment(candidate_id: str, resume_id: str, ai_data: dict):

    assessment_id = str(uuid.uuid4())

    # -----------------------------------------------------
    # 1. CREATE ASSESSMENT
    # -----------------------------------------------------

    assessment_data = {
        "id": assessment_id,
        "code": f"RESUME-{assessment_id[:8].upper()}",
        "name": "AI Generated Assessment",
        "description": "Assessment generated from candidate resume",
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

    # -----------------------------------------------------
    # 2. CREATE SECTIONS
    # -----------------------------------------------------

    sections = ai_data.get("sections", [])

    if not sections:
        raise HTTPException(
            status_code=500,
            detail="Gemini did not generate assessment sections",
        )

    total_questions = 0

    for section_index, section in enumerate(sections):

        section_id = str(uuid.uuid4())

        section_data = {
            "id": section_id,

            # IMPORTANT:
            # Your Supabase column is assessment_id,
            # NOT assessmentId.
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
                detail=f"Failed to create section {section_index + 1}",
            )

        # -------------------------------------------------
        # 3. CREATE QUESTIONS
        # -------------------------------------------------

        questions = section.get("questions", [])

        for question_index, question in enumerate(questions):

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

                "scoring_config": {},

                "required": question.get(
                    "required",
                    True,
                ),

                "display_order": question_index + 1,
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


# ---------------------------------------------------------
# UPLOAD RESUME
# ---------------------------------------------------------

@router.post("/upload")
async def upload_resume(
    candidate_id: str,
    file: UploadFile = File(...),
):
    """
    Upload candidate resume, extract its text,
    generate assessment using Gemini and save
    the assessment/questions in Supabase.
    """

    # -----------------------------------------------------
    # VALIDATE CANDIDATE ID
    # -----------------------------------------------------

    try:
        uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate_id",
        )

    # -----------------------------------------------------
    # VALIDATE FILE
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    allowed_types = {
        "application/pdf",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported",
        )

    # -----------------------------------------------------
    # READ FILE
    # -----------------------------------------------------

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    # -----------------------------------------------------
    # EXTRACT RESUME TEXT
    # -----------------------------------------------------

    resume_text = extract_pdf_text(file_bytes)

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract text from the resume. "
                "Please upload a text-based PDF."
            ),
        )

    # -----------------------------------------------------
    # SAVE RESUME RECORD
    # -----------------------------------------------------

    resume_id = str(uuid.uuid4())

    resume_data = {
        "id": resume_id,
        "candidate_id": candidate_id,
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_path": f"resumes/{candidate_id}/{resume_id}.pdf",
    }

    try:

        resume_result = (
            supabase
            .table("resumes")
            .insert(resume_data)
            .execute()
        )

        if not resume_result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save resume",
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save resume: {str(e)}",
        )

    # -----------------------------------------------------
    # GENERATE QUESTIONS USING GEMINI
    # -----------------------------------------------------

    ai_data = generate_questions_with_gemini(
        resume_text
    )

    # -----------------------------------------------------
    # CREATE ASSESSMENT
    # -----------------------------------------------------

    assessment_result = create_assessment(
        candidate_id=candidate_id,
        resume_id=resume_id,
        ai_data=ai_data,
    )

    # -----------------------------------------------------
    # RETURN RESPONSE
    # -----------------------------------------------------

    return {
        "message": "Resume uploaded and assessment generated successfully",

        "resume": {
            "id": resume_id,
            "file_name": file.filename,
        },

        "assessment": assessment_result,
    }