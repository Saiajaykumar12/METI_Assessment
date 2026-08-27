import { useEffect, useState } from "react";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";

import { supabase } from "./services/supabase";


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
      setPage(
        session
          ? "home"
          : "login"
      );
    }

    loadSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);

          if (session) {
            setPage("home");
          } else {
            setPage("login");
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  function handleStart(
    candidateData,
    assessmentData
  ) {
    setError("");

    setCandidate(candidateData);
    setAssessment(assessmentData);

    localStorage.setItem(
      "candidate_id",
      candidateData.id
    );

    localStorage.setItem(
      "assessment_id",
      assessmentData.id
    );

    setPage("assessment");
  }


  function handleComplete(resultData) {
    setResult(resultData);
    setPage("result");
  }


  async function logout() {
    await supabase.auth.signOut();

    localStorage.removeItem(
      "candidate_id"
    );

    localStorage.removeItem(
      "assessment_id"
    );

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
          onStart={handleStart}
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


      {page === "result" &&
        result && (
          <Result
            result={result}
          />
        )}
    </>
  );
}


export default App;