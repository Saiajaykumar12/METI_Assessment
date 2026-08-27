import { useEffect, useState } from "react";

import Header from "./components/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import Dashboard from "./pages/Dashboard";

import { supabase } from "./services/supabase";

const STORAGE_KEY = "meti_assessment_state";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [assessmentState, setAssessmentState] = useState(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return {
        screen: "home",
        candidate: null,
        assessment: null,
        attemptId: null,
        result: null,
      };
    }

    try {
      const parsed = JSON.parse(savedState);

      return {
        screen: parsed.screen || "home",
        candidate: parsed.candidate || null,
        assessment: parsed.assessment || null,
        attemptId: parsed.attemptId || null,
        result: parsed.result || null,
      };
    } catch (error) {
      console.error("Failed to restore assessment state:", error);
      localStorage.removeItem(STORAGE_KEY);

      return {
        screen: "home",
        candidate: null,
        assessment: null,
        attemptId: null,
        result: null,
      };
    }
  });

  const {
    screen,
    candidate,
    assessment,
    attemptId,
    result,
  } = assessmentState;

  const setScreen = (value) =>
    setAssessmentState((previous) => ({
      ...previous,
      screen: value,
    }));

  const setCandidate = (value) =>
    setAssessmentState((previous) => ({
      ...previous,
      candidate: value,
    }));

  const setAssessment = (value) =>
    setAssessmentState((previous) => ({
      ...previous,
      assessment: value,
    }));

  const setAttemptId = (value) =>
    setAssessmentState((previous) => ({
      ...previous,
      attemptId: value,
    }));

  const setResult = (value) =>
    setAssessmentState((previous) => ({
      ...previous,
      result: value,
    }));


  /*
   * Save assessment state whenever it changes
   */
  useEffect(() => {
    /*
     * Don't save the default empty state
     */
    if (
      screen === "home" &&
      !candidate &&
      !assessment &&
      !attemptId &&
      !result
    ) {
      return;
    }

    const state = {
      screen,
      candidate,
      assessment,
      attemptId,
      result,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  }, [
    screen,
    candidate,
    assessment,
    attemptId,
    result,
  ]);

  /*
   * Supabase authentication
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Logout
   */
  async function logout() {
    await supabase.auth.signOut();

    setCandidate(null);
    setAssessment(null);
    setAttemptId(null);
    setResult(null);
    setScreen("home");

    /*
     * Clear saved assessment state
     */
    localStorage.removeItem(STORAGE_KEY);
  }

  /*
   * Start assessment
   */
  function startAssessment(
    candidateData,
    assessmentData
  ) {
    setCandidate(candidateData);
    setAssessment(assessmentData);
    setAttemptId(null);
    setResult(null);
    setScreen("assessment");
  }

  /*
   * Assessment completed
   */
  function finishAssessment(resultData) {
    setResult(resultData);
    setScreen("result");
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  /*
   * Not logged in
   */
  if (!session) {
    return <Login />;
  }

  return (
    <>
      <Header />

      <div className="mx-auto flex max-w-7xl justify-end px-6 pt-4">
        <div className="flex items-center gap-4">
          {candidate && (
            <button
              onClick={() => setScreen("dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </button>
          )}

          <span className="text-sm text-slate-500">
            {session.user.email}
          </span>

          <button
            onClick={logout}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {screen === "home" && (
        <Home onStart={startAssessment} />
      )}

      {screen === "dashboard" && (
        <Dashboard
          candidate={candidate}
          onViewResult={(resultData) => {
            setResult(resultData);
            setScreen("result");
          }}
        />
      )}

      {screen === "assessment" && (
        <Assessment
          candidate={candidate}
          assessment={assessment}
          onComplete={finishAssessment}
        />
      )}

      {screen === "result" && (
        <Result
          result={result}
          onBack={() => setScreen("dashboard")}
        />
      )}
    </>
  );
}

export default App;