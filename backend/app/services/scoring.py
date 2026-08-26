from collections import defaultdict

from app.db.database import supabase


def calculate_score(attempt_id: str):
    # Get attempt
    attempt_result = (
        supabase
        .table("assessment_attempts")
        .select("id, assessment_id, assessment_version")
        .eq("id", attempt_id)
        .single()
        .execute()
    )

    if not attempt_result.data:
        raise ValueError("Attempt not found")

    # Get all responses
    responses_result = (
        supabase
        .table("responses")
        .select("question_id, answer")
        .eq("attempt_id", attempt_id)
        .execute()
    )

    responses = responses_result.data or []

    # Get questions
    question_ids = [r["question_id"] for r in responses]

    if not question_ids:
        raise ValueError("No responses found")

    questions_result = (
        supabase
        .table("questions")
        .select(
            "id, question_code, question_type, scoring_config"
        )
        .in_("id", question_ids)
        .execute()
    )

    questions = {
        q["id"]: q
        for q in (questions_result.data or [])
    }

    competency_scores = defaultdict(list)

    total_score = 0
    max_score = 0

    for response in responses:
        question = questions.get(response["question_id"])

        if not question:
            continue

        config = question.get("scoring_config") or {}

        competency = config.get(
            "competency",
            "general"
        )

        answer = response["answer"]

        # Single choice scoring
        if question["question_type"] == "single_choice":
            correct = config.get("correct")

            if answer == correct:
                score = config.get("score", 4)
            else:
                score = 0

            max_question_score = config.get("score", 4)

        # Likert scoring
        elif question["question_type"] == "likert":
            try:
                score = int(answer)
            except (TypeError, ValueError):
                score = 0

            max_question_score = config.get(
                "scale_max",
                5
            )

        else:
            score = 0
            max_question_score = 0

        total_score += score
        max_score += max_question_score

        competency_scores[competency].append(score)

    # Overall percentage
    overall_score = (
        round((total_score / max_score) * 100, 2)
        if max_score
        else 0
    )

    # Competency percentages
    competency_result = {}

    for competency, scores in competency_scores.items():
        average = sum(scores) / len(scores)

        max_competency_score = 4

        competency_result[competency] = round(
            (average / max_competency_score) * 100,
            2
        )

    # MVP interpretation
    strengths = [
        competency
        for competency, score in competency_result.items()
        if score >= 70
    ]

    development_gaps = [
        competency
        for competency, score in competency_result.items()
        if score < 50
    ]

    return {
        "overall_score": overall_score,
        "competency_scores": competency_result,
        "strengths": strengths,
        "development_gaps": development_gaps,
        "total_score": total_score,
        "max_score": max_score,
    }