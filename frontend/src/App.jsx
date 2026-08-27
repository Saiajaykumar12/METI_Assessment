import { useEffect, useState } from "react";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";

import { supabase } from "./services/supabase";
import { getAssessments } from "./services/api";


function App() {
  const [session, setSession] = useState(null);

  const [page, setPage] = useState("loading");

  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [result, setResult] = useState(null);

  const [error, setError] = useState("");


  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(session);
      setPage(session ? "home" : "login");
    }

    loadSession();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setPage(session ? "home" : "login");
      }
    );


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  async function handleCandidateCreated(candidateData) {
    try {
      setError("");

      setCandidate(candidateData);

      const assessments = await getAssessments();

      if (!assessments?.length) {
        setError(
          "No published assessments are available."
        );
        return;
      }

      setAssessment(assessments[0]);
      setPage("assessment");

    } catch (err) {
      setError(
        err.message ||
        "Failed to load assessment"
      );
    }
  }


  function handleComplete(resultData) {
    setResult(resultData);
    setPage("result");
  }


  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setCandidate(null);
    setAssessment(null);
    setResult(null);
    setPage("login");
  }


  if (page === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
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
        <button
          onClick={logout}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Sign Out
        </button>
      </div>


      {error && (
        <div className="mx-auto mt-4 max-w-2xl rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}


      {page === "home" && (
        <Home
          onCandidateCreated={handleCandidateCreated}
        />
      )}


      {page === "assessment" &&
        candidate &&
        assessment && (
          <Assessment
            candidate={candidate}
            assessment={assessment}
            onComplete={handleComplete}
          />
        )}


      {page === "result" && result && (
        <Result result={result} />
      )}
    </>
  );
}


export default App;