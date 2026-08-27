import json
import re

from fastapi import HTTPException
from groq import Groq

from app.core.config import settings


client = Groq(
    api_key=settings.GROQ_API_KEY
)


def generate_questions_with_groq(
    resume_text: str,
):
    try:
        prompt = f"""
You are an AI technical assessment generator.

Analyze the candidate resume and create a technical
assessment ONLY from technologies and skills actually
present in the resume.

Generate exactly:

- 3 sections
- 4 questions per section
- 12 questions total

Use a mixture of:
- MCQ questions
- Text questions
- Coding questions

Every question must contain:

- question_code
- question_type
- question_text
- options
- correct_answer
- competency
- required

Allowed question_type values:

- mcq
- text
- coding

For MCQ questions:

- options must contain exactly 4 options
- correct_answer must contain the correct option
- competency must identify the relevant skill

For text and coding questions:

- options must be []
- correct_answer can be ""

Important requirements:

1. Questions must be based only on technologies,
   skills and experience actually present in the resume.

2. Do not invent technologies that are not present
   in the resume.

3. Questions should test practical understanding,
   not just definitions.

4. Make the questions suitable for a professional
   technical assessment.

5. Return ONLY valid JSON.

Return exactly this structure:

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

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            temperature=0.3,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical assessment "
                        "generator. Return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        response_text = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        if not response_text:
            raise ValueError(
                "Groq returned an empty response"
            )

        # Remove Markdown code fences if the model
        # accidentally returns them.
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

        response_text = response_text.strip()

        data = json.loads(response_text)

        if "sections" not in data:
            raise ValueError(
                "Groq response does not contain sections"
            )

        if not isinstance(
            data["sections"],
            list,
        ):
            raise ValueError(
                "Groq sections must be a list"
            )

        if not data["sections"]:
            raise ValueError(
                "Groq returned no assessment sections"
            )

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Groq returned invalid JSON: "
                f"{str(e)}"
            ),
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Groq question generation failed: "
                f"{str(e)}"
            ),
        )