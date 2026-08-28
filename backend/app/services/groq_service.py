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

{resume_text[:12000]}

-------------------------
"""

        messages = [
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
        ]

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            temperature=0.2,
            max_completion_tokens=5000,
            response_format={"type": "json_object"},
            messages=messages,
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

        try:
            data = json.loads(response_text)
        except json.JSONDecodeError:
            retry_response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                temperature=0.1,
                max_completion_tokens=5000,
                response_format={"type": "json_object"},
                messages=messages,
            )
            retry_text = (
                retry_response.choices[0]
                .message.content
                or ""
            ).strip()
            retry_text = re.sub(
                r"^```(?:json)?\s*|\s*```$",
                "",
                retry_text,
                flags=re.IGNORECASE,
            ).strip()
            data = json.loads(retry_text)

        try:
            normalize_assessment_data(data)
            validate_assessment_data(data)
        except ValueError:
            retry_messages = messages + [
                {
                    "role": "user",
                    "content": (
                        "Regenerate the assessment. Every section must be an "
                        "object with title, description, and exactly four "
                        "question objects. Return exactly three sections and "
                        "twelve questions as valid JSON."
                    ),
                }
            ]
            retry_response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                temperature=0.1,
                max_completion_tokens=5000,
                response_format={"type": "json_object"},
                messages=retry_messages,
            )
            retry_text = (
                retry_response.choices[0]
                .message.content
                or ""
            ).strip()
            retry_text = re.sub(
                r"^```(?:json)?\s*|\s*```$",
                "",
                retry_text,
                flags=re.IGNORECASE,
            ).strip()
            data = json.loads(retry_text)
            normalize_assessment_data(data)
            validate_assessment_data(data)

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


def normalize_assessment_data(data: dict):
    if not isinstance(data, dict):
        return

    sections = data.get("sections", [])
    if not isinstance(sections, list):
        return

    for section in sections:
        if not isinstance(section, dict):
            continue

        questions = section.get("questions", [])
        if not isinstance(questions, list):
            continue

        for question in questions:
            if not isinstance(question, dict):
                continue

            if question.get("question_type") != "mcq":
                continue

            options = question.get("options", [])
            correct_answer = str(
                question.get("correct_answer", "")
            ).strip()

            for option in options:
                if str(option).strip().casefold() == correct_answer.casefold():
                    question["correct_answer"] = option
                    break
            else:
                answer_match = re.match(
                    r"^(?:option\s*)?([A-D])(?:[.):\s]|$)",
                    correct_answer,
                    flags=re.IGNORECASE,
                )
                if answer_match:
                    option_index = ord(
                        answer_match.group(1).upper()
                    ) - ord("A")
                    if option_index < len(options):
                        question["correct_answer"] = options[option_index]


def validate_assessment_data(data: dict):
    if not isinstance(data, dict):
        raise ValueError("Assessment response must be a JSON object")

    sections = data.get("sections")

    if not isinstance(sections, list) or len(sections) != 3:
        raise ValueError("Assessment must contain exactly 3 sections")

    question_count = 0

    for section in sections:
        if not isinstance(section, dict):
            raise ValueError("Assessment sections must be objects")

        if not isinstance(section.get("title"), str) or not section["title"].strip():
            raise ValueError("Every section must have a title")

        questions = section.get("questions")
        if not isinstance(questions, list) or len(questions) != 4:
            raise ValueError("Every section must contain exactly 4 questions")

        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Assessment questions must be objects")

            question_type = question.get("question_type")
            if question_type not in {"mcq", "text", "coding"}:
                raise ValueError("Assessment contains an invalid question type")

            question_text = question.get("question_text")
            if not isinstance(question_text, str) or not question_text.strip():
                raise ValueError("Every question must have question text")

            options = question.get("options")
            if question_type == "mcq":
                if not isinstance(options, list) or len(options) != 4:
                    raise ValueError("MCQ questions must contain exactly 4 options")
                if question.get("correct_answer") not in options:
                    raise ValueError("MCQ correct answer must match an option")
            elif options != []:
                raise ValueError("Text and coding questions cannot contain options")

            question_count += 1

    if question_count != 12:
        raise ValueError("Assessment must contain exactly 12 questions")