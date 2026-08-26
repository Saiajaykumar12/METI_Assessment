import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";
import { getAssessments } from "./services/api";

function App() {
  const [page, setPage] = useState("home");
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleCandidateCreated(candidateData) {
    try {
      setError("");

      // Save candidate
      setCandidate(candidateData);

      // Get available assessments
      const assessments = await getAssessments();

      if (!assessments || assessments.length === 0) {
        setError("No assessments are available.");
        return;
      }

      // Select the first published assessment
      setAssessment(assessments[0]);

      // Move to assessment page
      setPage("assessment");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleComplete(resultData) {
    setResult(resultData);
    setPage("result");
  }

  return (
    <>
      <Header />

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