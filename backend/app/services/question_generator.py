import json
from openai import OpenAI

from app.core.config import settings


client = OpenAI(
    api_key=settings.AI_API_KEY
)


def generate_questions(
    resume_text: str,
    job_title: str | None = None,
    career_goal: str | None = None,
):
    prompt = f"""
You are an assessment question generator.

Generate 10 assessment questions based on the candidate's
resume.

Candidate job title:
{job_title or "Not provided"}

Career goal:
{career_goal or "Not provided"}

Resume:
{resume_text}

Requirements:

1. Questions must be relevant to the candidate's actual skills.
2. Mix technical and behavioral questions.
3. Do not ask questions about information not present in the resume.
4. Use single-choice questions.
5. Each question must have exactly 4 options.
6. Include the correct answer.
7. Include a competency.
8. Return ONLY valid JSON.

Return this structure:

{{
  "questions": [
    {{
      "question_code": "Q1",
      "question_type": "single_choice",
      "question_text": "...",
      "options": [
        "A",
        "B",
        "C",
        "D"
      ],
      "correct_answer": "A",
      "competency": "..."
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": "You generate structured assessment questions."
            },
            {
                "role": "user",
                "content": prompt
            },
        ],
    )

    content = response.choices[0].message.content

    return json.loads(content)