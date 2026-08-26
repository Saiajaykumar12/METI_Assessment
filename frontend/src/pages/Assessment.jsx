import { useEffect, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import ProgressBar from "../components/ProgressBar";
import {
  createAttempt,
  getQuestions,
  saveResponse,
  submitAssessment,
} from "../services/api";

export default function Assessment({
  candidate,
  assessment,
  onComplete,
}) {
    if (!candidate || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Preparing assessment...</p>
      </div>
    );
  }
  
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  

  useEffect(() => {
    async function start() {
      try {
        const [questionData, attemptData] =
          await Promise.all([
            getQuestions(assessment.id),
            createAttempt(assessment.id, candidate?.id),
          ]);

        setQuestions(questionData);
        setAttempt(attemptData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    start();
  }, [assessment.id, candidate.id]);

  async function handleAnswer(answer) {
    const question = questions[current];

    setAnswers((prev) => ({
      ...prev,
      [question.id]: answer,
    }));

    try {
      await saveResponse(
        attempt.id,
        question.id,
        answer
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function nextQuestion() {
    if (!answers[questions[current].id]) {
      setError("Please select an answer.");
      return;
    }

    setError("");

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }

    setSaving(true);

    try {
      const result = await submitAssessment(attempt.id);
      onComplete(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading assessment...</p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const question = questions[current];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {assessment.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Answer all questions carefully.
          </p>
        </div>

        <ProgressBar
          current={current}
          total={questions.length}
        />

        <QuestionCard
          question={question}
          answer={answers[question.id]}
          onAnswer={handleAnswer}
        />

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-8 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving
              ? "Submitting..."
              : current === questions.length - 1
              ? "Submit Assessment"
              : "Next Question"}
          </button>
        </div>
      </div>
    </main>
  );
}