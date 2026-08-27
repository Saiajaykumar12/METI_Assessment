from app.services.gemini_service import generate_questions


result = generate_questions(
    "Generate 3 interview questions for a Python developer."
)

print(result)