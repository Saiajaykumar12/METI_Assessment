import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Result from "./pages/Result";

function App() {
  const [screen, setScreen] = useState("home");
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [result, setResult] = useState(null);

  function startAssessment(candidateData, assessmentData) {
    setCandidate(candidateData);
    setAssessment(assessmentData);
    setScreen("assessment");
  }

  function finishAssessment(resultData) {
    setResult(resultData);
    setScreen("result");
  }

  return (
    <>
      <Header />

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