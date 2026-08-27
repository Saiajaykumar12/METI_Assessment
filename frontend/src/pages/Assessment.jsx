import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import QuestionCard from "../components/QuestionCard";
import ProgressBar from "../components/ProgressBar";

import {
  createAttempt,
  getQuestions,
  saveResponse,
  submitAssessment,
} from "../services/api";

const STORAGE_KEY = "meti_assessment_progress";

export default function Assessment({
  candidate,
  assessment,
  onComplete,
}) {
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveTimers = useRef({});
  const saveQueue = useRef(Promise.resolve());

  const assessmentId =
    assessment?.id ||
    assessment?.assessment_id;

  const candidateId =
    candidate?.id ||
    localStorage.getItem("candidate_id");

  /*
   * --------------------------------------------------
   * Restore saved progress
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!candidateId || !assessmentId) {
      return;
    }

    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (
        parsed.candidateId !== candidateId ||
        parsed.assessmentId !== assessmentId
      ) {
        return;
      }

      if (
        typeof parsed.current === "number"
      ) {
        setCurrent(parsed.current);
      }

      if (
        parsed.answers &&
        typeof parsed.answers === "object"
      ) {
        setAnswers(parsed.answers);
      }

      if (parsed.attemptId) {
        setAttempt({
          id: parsed.attemptId,
        });
      }
    } catch (err) {
      console.error(
        "Failed to restore assessment progress:",
        err
      );
    }
  }, [candidateId, assessmentId]);

  /*
   * --------------------------------------------------
   * Load questions and create/reuse attempt
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!candidateId || !assessmentId) {
      setLoading(false);
      setError(
        "Candidate or assessment information is missing."
      );
      return;
    }

    let cancelled = false;

    async function startAssessment() {
      try {
        setLoading(true);
        setError("");

        const questionData =
          await getQuestions(assessmentId);

        if (
          !Array.isArray(questionData) ||
          questionData.length === 0
        ) {
          throw new Error(
            "No questions are available for this assessment."
          );
        }

        if (cancelled) {
          return;
        }

        setQuestions(questionData);

        /*
         * Try to reuse an existing attempt.
         */

        let currentAttempt = null;

        try {
          const saved =
            localStorage.getItem(STORAGE_KEY);

          if (saved) {
            const parsed = JSON.parse(saved);

            if (
              parsed.candidateId === candidateId &&
              parsed.assessmentId === assessmentId &&
              parsed.attemptId
            ) {
              currentAttempt = {
                id: parsed.attemptId,
              };
            }
          }
        } catch (err) {
          console.error(
            "Failed to read saved attempt:",
            err
          );
        }

        /*
         * Create attempt if no saved attempt exists.
         */

        if (!currentAttempt) {
          currentAttempt =
            await createAttempt(
              assessmentId,
              candidateId
            );
        }

        if (!currentAttempt?.id) {
          throw new Error(
            "Failed to create or restore assessment attempt."
          );
        }

        if (cancelled) {
          return;
        }

        setAttempt(currentAttempt);

        /*
         * Save progress.
         */

        const savedProgress = {
          candidateId,
          assessmentId,
          attemptId: currentAttempt.id,
          current: 0,
          answers: {},
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(savedProgress)
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Assessment start error:",
          err
        );

        setError(
          err?.message ||
            "Failed to start assessment."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    startAssessment();

    return () => {
      cancelled = true;
    };
  }, [candidateId, assessmentId]);

  /*
   * --------------------------------------------------
   * Persist frontend progress
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !candidateId ||
      !assessmentId ||
      !attempt?.id ||
      !questions.length
    ) {
      return;
    }

    const progress = {
      candidateId,
      assessmentId,
      attemptId: attempt.id,
      current,
      answers,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  }, [
    candidateId,
    assessmentId,
    attempt,
    current,
    answers,
    questions.length,
  ]);

  /*
   * --------------------------------------------------
   * Cleanup timers
   * --------------------------------------------------
   */

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(
        (timer) => clearTimeout(timer)
      );

      saveTimers.current = {};
    };
  }, []);

  /*
   * --------------------------------------------------
   * Save answer to backend
   * --------------------------------------------------
   */

  const saveAnswerToBackend = useCallback(
    async (
      questionId,
      answer,
      attemptId
    ) => {
      if (!attemptId) {
        throw new Error(
          "Assessment attempt is not ready."
        );
      }

      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() =>
          saveResponse(
            attemptId,
            questionId,
            answer
          )
        );

      await saveQueue.current;
    },
    []
  );

  /*
   * --------------------------------------------------
   * Handle answer
   * --------------------------------------------------
   */

  function handleAnswer(answer) {
    const question = questions[current];

    if (!question) {
      return;
    }

    /*
     * Update UI immediately.
     */

    setAnswers((previous) => ({
      ...previous,
      [question.id]: answer,
    }));

    setError("");

    /*
     * Save answer.
     *
     * This is intentionally done immediately.
     * The backend should update the existing
     * response if the same question is answered
     * again.
     */

    if (!attempt?.id) {
      setError(
        "Assessment attempt is not ready."
      );
      return;
    }

    saveAnswerToBackend(
      question.id,
      answer,
      attempt.id
    ).catch((err) => {
      console.error(
        "Failed to save answer:",
        err
      );

      setError(
        err?.message ||
          "Failed to save answer."
      );
    });
  }

  /*
   * --------------------------------------------------
   * Flush current answer
   * --------------------------------------------------
   */

  async function flushCurrentAnswer() {
    const question =
      questions[current];

    if (!question || !attempt?.id) {
      return;
    }

    const answer =
      answers[question.id];

    if (
      answer === undefined ||
      answer === null ||
      answer === ""
    ) {
      return;
    }

    /*
     * Cancel pending timer.
     */

    if (
      saveTimers.current[question.id]
    ) {
      clearTimeout(
        saveTimers.current[question.id]
      );

      delete saveTimers.current[
        question.id
      ];
    }

    /*
     * Save latest answer.
     */

    await saveAnswerToBackend(
      question.id,
      answer,
      attempt.id
    );
  }

  /*
   * --------------------------------------------------
   * Previous question
   * --------------------------------------------------
   */

  async function previousQuestion() {
    if (saving) {
      return;
    }

    if (current <= 0) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await flushCurrentAnswer();

      setCurrent(
        (previous) => previous - 1
      );
    } catch (err) {
      console.error(
        "Failed to save answer before going back:",
        err
      );

      setError(
        err?.message ||
          "Failed to save your answer."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * Next question / submit
   * --------------------------------------------------
   */

  async function nextQuestion() {
    if (saving) {
      return;
    }

    const question =
      questions[current];

    if (!question) {
      return;
    }

    const answer =
      answers[question.id];

    /*
     * Require answer.
     */

    if (
      answer === undefined ||
      answer === null ||
      answer === ""
    ) {
      setError(
        "Please enter or select an answer."
      );
      return;
    }

    if (!attempt?.id) {
      setError(
        "Assessment attempt is not ready."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      /*
       * Save the latest answer before
       * moving forward.
       */

      await flushCurrentAnswer();

      /*
       * Next question.
       */

      if (
        current <
        questions.length - 1
      ) {
        setCurrent(
          (previous) => previous + 1
        );

        return;
      }

      /*
       * --------------------------------------------------
       * LAST QUESTION
       * --------------------------------------------------
       */

      const result =
        await submitAssessment(
          attempt.id
        );

      /*
       * Remove saved progress.
       */

      localStorage.removeItem(
        STORAGE_KEY
      );

      /*
       * Notify parent component.
       */

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      console.error(
        "Failed to save or submit assessment:",
        err
      );

      setError(
        err?.message ||
          "Failed to save or submit assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * Loading
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">
          Loading your assessment...
        </p>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Error before questions load
   * --------------------------------------------------
   */

  if (
    error &&
    !questions.length
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-lg bg-red-50 p-6 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * No questions
   * --------------------------------------------------
   */

  if (!questions.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">
          No questions available.
        </p>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Current question
   * --------------------------------------------------
   */

  const question =
    questions[current];

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">
          Question not found.
        </p>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Main UI
   * --------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {assessment?.name ||
              "AI Generated Assessment"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Answer all questions carefully.
          </p>
        </div>

        {/* Progress */}

        <ProgressBar
          current={current}
          total={questions.length}
        />

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {/* Question */}

            <QuestionCard
              question={question}
              answer={
                answers[question.id] ?? ""
              }
              onAnswer={handleAnswer}
            />

            {/* Error */}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Navigation */}

            <div className="mt-6 flex items-center justify-between gap-4">

              {/* Previous */}
              <button
                type="button"
                onClick={previousQuestion}
                disabled={
                  saving ||
                  current === 0
                }
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {/* Next / Submit */}

              <button
                type="button"
                onClick={nextQuestion}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-8 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : current ===
                      questions.length - 1
                    ? "Submit Assessment"
                    : "Next Question"}
              </button>
            </div>

            {/* Counter */}

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Question {current + 1} of{" "}
                {questions.length}
              </p>
            </div>
          </div>

          {/* Question Navigation Panel */}
          <div className="hidden lg:block">
            <div className="rounded-lg border border-slate-200 bg-white p-4 sticky top-4">
              <h3 className="mb-4 font-semibold text-slate-900">
                Questions
              </h3>

              <div className="space-y-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (!saving) {
                        setCurrent(index);
                      }
                    }}
                    disabled={saving}
                    className={`w-full rounded px-3 py-2 text-sm font-medium transition ${
                      index === current
                        ? "bg-slate-900 text-white"
                        : answers[q.id]
                          ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Q{index + 1}</span>
                      {answers[q.id] && (
                        <span>✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  {Object.keys(answers).length} of{" "}
                  {questions.length} answered
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}