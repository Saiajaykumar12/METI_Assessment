import { useEffect, useState } from "react";
import CandidateForm from "../components/CandidateForm";
import { getAssessments } from "../services/api";

export default function Home({ onStart }) {
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAssessments()
      .then(setAssessments)
      .catch((err) => setError(err.message));
  }, []);

  function handleCandidate(candidate) {
    if (!selected) {
      setError("Please select an assessment.");
      return;
    }

    onStart(candidate, selected);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Assessment Platform
          </h2>

          <p className="mt-3 text-slate-500">
            Complete your assessment and discover your strengths.
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">
            Select Assessment
          </h3>

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {assessments.map((assessment) => (
              <button
                key={assessment.id}
                onClick={() => setSelected(assessment)}
                className={`rounded-xl border p-5 text-left transition ${
                  selected?.id === assessment.id
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <h4 className="font-semibold text-slate-900">
                  {assessment.name}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {assessment.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <CandidateForm onCreated={handleCandidate} />
      </div>
    </main>
  );
}