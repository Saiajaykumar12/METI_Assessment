from google import genai
from app.core.config import settings

client = genai.Client(
    api_key=settings.AI_API_KEY
)


def generate_questions(resume_text: str):

    prompt = f"""
You are an AI assessment generator.

Analyze the following candidate resume and create
10 multiple-choice assessment questions.

Requirements:
- 4 technical questions
- 2 project-based questions
- 2 experience-based questions
- 2 behavioral/career questions
- Questions must be based on the candidate's resume.
- Each question must have exactly 4 options.
- Include the correct answer.
- Do not create duplicate questions.

Return ONLY valid JSON in this format:

{{
    "questions": [
        {{
            "question_code": "Q1",
            "question_text": "Question here",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_answer": "Option A",
            "competency": "Python"
        }}
    ]
}}

Candidate Resume:
{resume_text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text