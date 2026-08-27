import json
import re
from typing import Any

from groq import Groq

from app.core.config import settings


# =========================================================
# GROQ CLIENT
# =========================================================

client = Groq(
    api_key=settings.AI_API_KEY
)


# =========================================================
# CONSTANTS
# =========================================================

MODEL_NAME = "openai/gpt-oss-120b"

QUESTION_COUNT = 10


# =========================================================
# JSON CLEANER
# =========================================================

def clean_json_response(content: str) -> str:
    """
    Removes accidental Markdown code fences.

    Structured Outputs should already return valid JSON,
    but this keeps the application defensive.
    """

    if not content:
        raise ValueError(
            "Groq returned an empty response"
        )

    content = content.strip()

    # Handle:
    #
    # ```json
    # {...}
    # ```
    #
    if content.startswith("```"):
        content = re.sub(
            r"^```(?:json)?\s*",
            "",
            content,
            flags=re.IGNORECASE,
        )

        content = re.sub(
            r"\s*```$",
            "",
            content,
        )

    return content.strip()


# =========================================================
# QUESTION SCHEMA
# =========================================================

QUESTION_SCHEMA = {
    "type": "object",

    "properties": {
        "questions": {
            "type": "array",

            "items": {
                "type": "object",

                "properties": {
                    "question_code": {
                        "type": "string"
                    },

                    "question_type": {
                        "type": "string",
                        "enum": [
                            "single_choice"
                        ]
                    },

                    "question_text": {
                        "type": "string"
                    },

                    "options": {
                        "type": "array",

                        "items": {
                            "type": "string"
                        },

                        "minItems": 4,
                        "maxItems": 4
                    },

                    "correct_answer": {
                        "type": "string"
                    },

                    "competency": {
                        "type": "string"
                    }
                },

                "required": [
                    "question_code",
                    "question_type",
                    "question_text",
                    "options",
                    "correct_answer",
                    "competency"
                ],

                "additionalProperties": False
            },

            "minItems": QUESTION_COUNT,
            "maxItems": QUESTION_COUNT
        }
    },

    "required": [
        "questions"
    ],

    "additionalProperties": False
}


# =========================================================
# VALIDATE GENERATED QUESTIONS
# =========================================================

def validate_questions(
    data: Any,
):
    """
    Performs application-level validation after Groq
    Structured Outputs validation.

    Returns:

    {
        "questions": [...]
    }
    """

    if not isinstance(data, dict):
        raise ValueError(
            "Groq response must be a JSON object"
        )

    questions = data.get(
        "questions"
    )

    if not isinstance(
        questions,
        list,
    ):
        raise ValueError(
            "Groq response does not contain a valid questions array"
        )

    if len(questions) != QUESTION_COUNT:
        raise ValueError(
            f"Expected exactly {QUESTION_COUNT} questions, "
            f"but Groq returned {len(questions)}"
        )

    validated = []

    seen_codes = set()

    for index, question in enumerate(
        questions,
        start=1,
    ):

        if not isinstance(
            question,
            dict,
        ):
            raise ValueError(
                f"Question {index} is not a JSON object"
            )

        # -------------------------------------------------
        # Question code
        # -------------------------------------------------

        question_code = (
            question.get(
                "question_code"
            )
            or f"Q{index}"
        )

        if question_code in seen_codes:
            raise ValueError(
                f"Duplicate question_code: {question_code}"
            )

        seen_codes.add(
            question_code
        )

        # -------------------------------------------------
        # Question type
        # -------------------------------------------------

        question_type = (
            question.get(
                "question_type"
            )
        )

        if question_type != "single_choice":
            raise ValueError(
                f"Question {index} must be single_choice"
            )

        # -------------------------------------------------
        # Question text
        # -------------------------------------------------

        question_text = (
            question.get(
                "question_text"
            )
        )

        if not isinstance(
            question_text,
            str,
        ) or not question_text.strip():

            raise ValueError(
                f"Question {index} is missing question_text"
            )

        # -------------------------------------------------
        # Options
        # -------------------------------------------------

        options = question.get(
            "options"
        )

        if not isinstance(
            options,
            list,
        ):
            raise ValueError(
                f"Question {index} has invalid options"
            )

        if len(options) != 4:
            raise ValueError(
                f"Question {index} must have exactly 4 options"
            )

        options = [
            str(option).strip()
            for option in options
        ]

        if any(
            not option
            for option in options
        ):
            raise ValueError(
                f"Question {index} contains an empty option"
            )

        if len(set(options)) != 4:
            raise ValueError(
                f"Question {index} contains duplicate options"
            )

        # -------------------------------------------------
        # Correct answer
        # -------------------------------------------------

        correct_answer = (
            question.get(
                "correct_answer"
            )
        )

        if not isinstance(
            correct_answer,
            str,
        ):
            raise ValueError(
                f"Question {index} has invalid correct_answer"
            )

        correct_answer = (
            correct_answer.strip()
        )

        if correct_answer not in options:
            raise ValueError(
                f"Question {index} has a correct_answer "
                "that does not match any option"
            )

        # -------------------------------------------------
        # Competency
        # -------------------------------------------------

        competency = (
            question.get(
                "competency"
            )
        )

        if not isinstance(
            competency,
            str,
        ) or not competency.strip():

            competency = "General"

        # -------------------------------------------------
        # Final question
        # -------------------------------------------------

        validated.append(
            {
                "question_code":
                    question_code,

                "question_type":
                    "single_choice",

                "question_text":
                    question_text.strip(),

                "options":
                    options,

                "correct_answer":
                    correct_answer,

                "competency":
                    competency.strip(),
            }
        )

    return {
        "questions": validated
    }


# =========================================================
# GENERATE QUESTIONS
# =========================================================

def generate_questions(
    resume_text: str,
    job_title: str | None = None,
    career_goal: str | None = None,
):
    """
    Generate exactly 10 assessment questions using Groq.

    Uses Groq Structured Outputs so that the response
    follows a strict JSON schema.
    """

    # -----------------------------------------------------
    # Clean resume
    # -----------------------------------------------------

    resume_text = (
        resume_text or ""
    ).strip()

    if not resume_text:
        raise ValueError(
            "Resume text is empty"
        )

    # Limit prompt size.
    if len(resume_text) > 12000:
        resume_text = resume_text[:12000]

    # -----------------------------------------------------
    # Prompt
    # -----------------------------------------------------

    prompt = f"""
You are an expert professional technical assessment
question generator.

Create exactly {QUESTION_COUNT} multiple-choice assessment
questions for the candidate.

Candidate job title:
{job_title or "Not provided"}

Career goal:
{career_goal or "Not provided"}

Candidate resume:
-------------------------
{resume_text}
-------------------------

IMPORTANT RULES:

1. Generate exactly {QUESTION_COUNT} questions.

2. Every question must be a single-choice MCQ.

3. Every question must contain exactly 4 options.

4. The correct_answer must be exactly equal to one
   of the four options.

5. Every question must contain a competency.

6. Questions must be relevant to the candidate's
   resume and experience.

7. Do not invent technologies or skills that are not
   reasonably supported by the resume.

8. Questions should test practical understanding,
   problem solving, technical knowledge, and application.

9. Avoid duplicate questions.

10. Keep options concise and clearly different.

11. Do not include explanations.

12. Do not include Markdown.

13. Do not include comments.

14. Return only the structured JSON requested
    by the response schema.

Make the assessment professional and suitable for
a real technical hiring assessment.
"""

    # -----------------------------------------------------
    # Print generation information
    # -----------------------------------------------------

    print(
        "\n"
        + "=" * 70
    )

    print(
        "GENERATING ASSESSMENT WITH GROQ"
    )

    print(
        f"Model: {MODEL_NAME}"
    )

    print(
        f"Expected questions: {QUESTION_COUNT}"
    )

    print(
        "=" * 70
    )

    # -----------------------------------------------------
    # Groq request
    # -----------------------------------------------------

    try:

        response = client.chat.completions.create(

            model=MODEL_NAME,

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional technical "
                        "assessment generator. "
                        "Follow the provided JSON schema exactly."
                    ),
                },

                {
                    "role": "user",
                    "content": prompt,
                },
            ],

            temperature=0.1,

            max_tokens=5000,

            response_format={
                "type": "json_schema",

                "json_schema": {
                    "name": "assessment_questions",

                    "strict": True,

                    "schema": QUESTION_SCHEMA,
                },
            },

            # GPT-OSS supports reasoning controls.
            # Keep reasoning low so more output tokens
            # are available for the actual assessment.
            reasoning_effort="low",
        )

    except Exception as e:

        print(
            "\n"
            + "=" * 70
        )

        print(
            "GROQ API ERROR"
        )

        print(
            str(e)
        )

        print(
            "=" * 70
            + "\n"
        )

        raise RuntimeError(
            f"Groq question generation failed: {str(e)}"
        )

    # -----------------------------------------------------
    # Check response
    # -----------------------------------------------------

    if not response.choices:

        raise RuntimeError(
            "Groq returned no choices"
        )

    choice = (
        response.choices[0]
    )

    message = (
        choice.message
    )

    if not message:

        raise RuntimeError(
            "Groq returned an empty message"
        )

    # -----------------------------------------------------
    # Check finish reason
    # -----------------------------------------------------

    finish_reason = getattr(
        choice,
        "finish_reason",
        None,
    )

    print(
        f"Groq finish reason: {finish_reason}"
    )

    # If Groq stopped because it reached the output
    # limit, the response may be incomplete.
    if finish_reason == "length":

        raise RuntimeError(
            "Groq stopped because the response reached "
            "the maximum output token limit. "
            "Please retry the assessment."
        )

    # -----------------------------------------------------
    # Extract content
    # -----------------------------------------------------

    content = (
        message.content
        or ""
    ).strip()

    if not content:

        raise RuntimeError(
            "Groq returned an empty response"
        )

    # -----------------------------------------------------
    # Log raw response
    # -----------------------------------------------------

    print(
        "\n"
        + "=" * 70
    )

    print(
        "GROQ RAW RESPONSE"
    )

    print(
        content
    )

    print(
        "=" * 70
        + "\n"
    )

    # -----------------------------------------------------
    # Clean JSON
    # -----------------------------------------------------

    content = clean_json_response(
        content
    )

    # -----------------------------------------------------
    # Parse JSON
    # -----------------------------------------------------

    try:

        data = json.loads(
            content
        )

    except json.JSONDecodeError as e:

        print(
            "\n"
            + "=" * 70
        )

        print(
            "GROQ JSON PARSING ERROR"
        )

        print(
            f"Error: {str(e)}"
        )

        print(
            f"Line: {e.lineno}"
        )

        print(
            f"Column: {e.colno}"
        )

        print(
            f"Character position: {e.pos}"
        )

        print(
            "\nRaw response:"
        )

        print(
            content
        )

        print(
            "=" * 70
            + "\n"
        )

        raise ValueError(
            "Groq returned invalid JSON: "
            f"{str(e)}"
        )

    # -----------------------------------------------------
    # Validate
    # -----------------------------------------------------

    try:

        validated = validate_questions(
            data
        )

    except Exception as e:

        print(
            "\n"
            + "=" * 70
        )

        print(
            "GROQ QUESTION VALIDATION ERROR"
        )

        print(
            str(e)
        )

        print(
            "=" * 70
            + "\n"
        )

        raise ValueError(
            "Groq returned invalid question structure: "
            f"{str(e)}"
        )

    # -----------------------------------------------------
    # Success
    # -----------------------------------------------------

    print(
        "\n"
        + "=" * 70
    )

    print(
        f"SUCCESS: Generated "
        f"{len(validated['questions'])} questions"
    )

    print(
        "=" * 70
        + "\n"
    )

    return validated