import { useEffect, useState } from "react";

import Header from "./components/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";

import { supabase } from "./services/supabase";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [screen, setScreen] = useState("home");
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [result, setResult] = useState(null);

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

  async function logout() {
    await supabase.auth.signOut();

    setCandidate(null);
    setAssessment(null);
    setResult(null);
    setScreen("home");
  }

  function startAssessment(
    candidateData,
    assessmentData
  ) {
    setCandidate(candidateData);
    setAssessment(assessmentData);
    setScreen("assessment");
  }

  function finishAssessment(resultData) {
    setResult(resultData);
    setScreen("result");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

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