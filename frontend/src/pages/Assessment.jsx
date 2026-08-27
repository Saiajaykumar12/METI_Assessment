import {
  useCallback,
  useEffect,
  useRef,
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
  const mountedRef = useRef(false);

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

        setQuestions(questionData);

        /*
         * Try to reuse an existing attempt from
         * localStorage first.
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
         * If no saved attempt exists, ask backend
         * to create/reuse an in-progress attempt.
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

        setAttempt(currentAttempt);

        /*
         * Save the attempt immediately.
         */
        const savedProgress = {
          candidateId,
          assessmentId,
          attemptId: currentAttempt.id,
          current,
          answers,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(savedProgress)
        );
      } catch (err) {
        console.error(
          "Assessment start error:",
          err
        );

        setError(
          err?.message ||
            "Failed to start assessment."
        );
      } finally {
        setLoading(false);
      }
    }

    startAssessment();
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
   * Save one response
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

      await saveResponse(
        attemptId,
        questionId,
        answer
      );
    },
    []
  );

  /*
   * --------------------------------------------------
   * Handle answer
   * --------------------------------------------------
   *
   * MCQ:
   *     Save immediately.
   *
   * Text:
   *     Update UI immediately.
   *     Save 1 second after typing stops.
   */

  async function handleAnswer(answer) {
    const question =
      questions[current];

    if (!question) {
      return;
    }

    const attemptId =
      attempt?.id;

    if (!attemptId) {
      setError(
        "Assessment attempt is not ready."
      );
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
     * Clear previous debounce timer for
     * this specific question.
     */
    if (
      saveTimers.current[question.id]
    ) {
      clearTimeout(
        saveTimers.current[question.id]
      );
    }

    const isTextQuestion =
      question.question_type !== "mcq";

    /*
     * ----------------------------------------------
     * TEXT QUESTION
     * ----------------------------------------------
     */

    if (isTextQuestion) {
      saveTimers.current[question.id] =
        setTimeout(async () => {
          try {
            await saveAnswerToBackend(
              question.id,
              answer,
              attemptId
            );

            setError("");
          } catch (err) {
            console.error(
              "Failed to autosave text answer:",
              err
            );

            setError(
              err?.message ||
                "Failed to save response."
            );
          } finally {
            delete saveTimers.current[
              question.id
            ];
          }
        }, 1000);

      return;
    }

    /*
     * ----------------------------------------------
     * MCQ
     * ----------------------------------------------
     */

    try {
      await saveAnswerToBackend(
        question.id,
        answer,
        attemptId
      );

      setError("");
    } catch (err) {
      console.error(
        "Failed to save answer:",
        err
      );

      setError(
        err?.message ||
          "Failed to save answer."
      );
    }
  }

  /*
   * --------------------------------------------------
   * Flush pending text save
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
     * Cancel debounce timer.
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
     * Always save the latest answer before
     * navigation.
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
     * Empty answer check.
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
       * IMPORTANT:
       * Always save latest answer before
       * moving forward.
       */
      await flushCurrentAnswer();

      /*
       * Move to next question.
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
       * ----------------------------------------------
       * LAST QUESTION
       * ----------------------------------------------
       */

      const result =
        await submitAssessment(
          attempt.id
        );

      /*
       * Assessment completed.
       */
      localStorage.removeItem(
        STORAGE_KEY
      );

      onComplete(result);
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
        <p>
          Generating your assessment...
        </p>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Error
   * --------------------------------------------------
   */

  if (
    error &&
    !questions.length
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-lg bg-red-50 p-6 text-red-600">
          {error}
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
        <p>
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
        <p>
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
      <div className="mx-auto max-w-3xl">

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
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
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
    </main>
  );
}