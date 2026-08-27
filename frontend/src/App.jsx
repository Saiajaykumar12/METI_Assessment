import { useEffect, useState } from "react";

import Header from "./components/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";

import { supabase } from "./services/supabase";

const STORAGE_KEY = "meti_assessment_state";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [screen, setScreen] = useState("home");
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [result, setResult] = useState(null);

  /*
   * Restore assessment state when the application loads
   */
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);

        setScreen(parsed.screen || "home");
        setCandidate(parsed.candidate || null);
        setAssessment(parsed.assessment || null);
        setAttemptId(parsed.attemptId || null);
        setResult(parsed.result || null);
      } catch (error) {
        console.error(
          "Failed to restore assessment state:",
          error
        );

        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

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

      {screen === "assessment" && (
        <Assessment
          candidate={candidate}
          assessment={assessment}
          attemptId={attemptId}
          setAttemptId={setAttemptId}
          onComplete={finishAssessment}
        />
      )}

      {screen === "result" && (
        <Result result={result} />
      )}
    </>
  );
}

export default App;