from collections import defaultdict

from app.db.database import admin_supabase as supabase


def calculate_score(attempt_id: str):
    responses_result = (
        supabase
        .table("responses")
        .select("question_id, answer")
        .eq("attempt_id", attempt_id)
        .execute()
    )

    responses = responses_result.data or []

    if not responses:
        raise ValueError("No responses found")

    question_ids = [
        response["question_id"]
        for response in responses
    ]

    questions_result = (
        supabase
        .table("questions")
        .select(
            "id, question_type, scoring_config"
        )
        .in_("id", question_ids)
        .execute()
    )

    questions = {
        question["id"]: question
        for question in (
            questions_result.data or []
        )
    }

    competency_scores = defaultdict(list)

    total_score = 0
    max_score = 0

    for response in responses:
        question = questions.get(
            response["question_id"]
        )

        if not question:
            continue

        config = (
            question.get("scoring_config")
            or {}
        )

        competency = config.get(
            "competency",
            "General",
        )

        correct_answer = config.get(
            "correct"
        )

        score_value = int(
            config.get("score", 1)
        )

        answer = response.get("answer")

        if (
            question["question_type"]
            in ["mcq", "single_choice"]
        ):
            score = (
                score_value
                if answer == correct_answer
                else 0
            )

            max_question_score = score_value

        elif question["question_type"] == "text":
            # For text questions, give credit if answer is provided and has meaningful length
            answer_str = str(answer or "").strip()
            score = (
                score_value
                if len(answer_str) >= 10
                else int(score_value * 0.25)
            )
            max_question_score = score_value

        elif question["question_type"] == "coding":
            # For coding questions, give credit if answer is provided and has meaningful length
            answer_str = str(answer or "").strip()
            score = (
                int(score_value * 0.75)
                if len(answer_str) >= 20
                else int(score_value * 0.25)
                if len(answer_str) >= 5
                else 0
            )
            max_question_score = score_value

        else:
            score = 0
            max_question_score = score_value

        total_score += score
        max_score += max_question_score

        competency_scores[competency].append(
            (score, max_question_score)
        )

    overall_score = (
        round(
            (total_score / max_score) * 100,
            2,
        )
        if max_score
        else 0
    )

    competency_result = {}

    for competency, values in competency_scores.items():
        earned = sum(
            value[0]
            for value in values
        )

        possible = sum(
            value[1]
            for value in values
        )

        competency_result[competency] = (
            round(
                (earned / possible) * 100,
                2,
            )
            if possible
            else 0
        )

    strengths = [
        competency
        for competency, score
        in competency_result.items()
        if score >= 70
    ]

    development_gaps = [
        competency
        for competency, score
        in competency_result.items()
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