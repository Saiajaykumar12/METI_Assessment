import {
  useEffect,
  useState,
} from "react";

import QuestionCard from "../components/QuestionCard";
import ProgressBar from "../components/Progressbar";

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
  const [questions, setQuestions] =
    useState([]);

  const [attempt, setAttempt] =
    useState(null);

  const [current, setCurrent] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const assessmentId =
    assessment?.id ||
    assessment?.assessment_id;

  const candidateId =
    candidate?.id ||
    localStorage.getItem(
      "candidate_id"
    );


  useEffect(() => {
    if (
      !candidateId ||
      !assessmentId
    ) {
      setLoading(false);
      setError(
        "Candidate or assessment information is missing."
      );
      return;
    }


    async function startAssessment() {
      try {
        setLoading(true);
        setError("");


        const [
          questionData,
          attemptData,
        ] = await Promise.all([
          getQuestions(
            assessmentId
          ),

          createAttempt(
            assessmentId,
            candidateId
          ),
        ]);


        if (
          !Array.isArray(questionData) ||
          questionData.length === 0
        ) {
          throw new Error(
            "No questions are available for this assessment."
          );
        }


        setQuestions(
          questionData
        );

        setAttempt(
          attemptData
        );


      } catch (err) {
        console.error(
          "Assessment start error:",
          err
        );

        setError(
          err.message ||
          "Failed to start assessment"
        );

      } finally {
        setLoading(false);
      }
    }


    startAssessment();

  }, [
    assessmentId,
    candidateId,
  ]);


  async function handleAnswer(
    answer
  ) {
    if (!attempt?.id) {
      setError(
        "Assessment attempt is not ready."
      );
      return;
    }


    const question =
      questions[current];

    if (!question) {
      return;
    }


    setAnswers(
      (previous) => ({
        ...previous,
        [question.id]: answer,
      })
    );


    try {
      await saveResponse(
        attempt.id,
        question.id,
        answer
      );

      setError("");

    } catch (err) {
      setError(
        err.message ||
        "Failed to save answer"
      );
    }
  }


  async function nextQuestion() {
    const question =
      questions[current];

    if (!question) {
      return;
    }


    const answer =
      answers[question.id];


    if (
      answer === undefined ||
      answer === null ||
      answer === ""
    ) {
      setError(
        "Please select an answer."
      );
      return;
    }


    setError("");


    if (
      current <
      questions.length - 1
    ) {
      setCurrent(
        (previous) =>
          previous + 1
      );
      return;
    }


    if (!attempt?.id) {
      setError(
        "Assessment attempt is not ready."
      );
      return;
    }


    setSaving(true);


    try {
      const result =
        await submitAssessment(
          attempt.id
        );

      onComplete(result);

    } catch (err) {
      setError(
        err.message ||
        "Failed to submit assessment"
      );

    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>
          Generating your assessment...
        </p>
      </div>
    );
  }


  if (error && !questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">

        <div className="rounded-lg bg-red-50 p-6 text-red-600">
          {error}
        </div>

      </div>
    );
  }


  if (!questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>
          No questions available.
        </p>
      </div>
    );
  }


  const question =
    questions[current];


  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">

      <div className="mx-auto max-w-3xl">

        <div className="mb-8">

          <h1 className="text-2xl font-bold">
            {assessment.name ||
              "AI Generated Assessment"}
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
          answer={
            answers[question.id]
          }
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
              : current ===
                  questions.length - 1
                ? "Submit Assessment"
                : "Next Question"}
          </button>

        </div>

      </div>

    </main>
  );
}