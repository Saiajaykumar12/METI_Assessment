from google import genai

from app.core.config import settings


client = genai.Client(
    api_key=settings.AI_API_KEY
)


def generate_questions(prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-3.7-flash",
        contents=prompt,
    )

    return response.text