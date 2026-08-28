import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

export default function Dashboard({
  candidate,
  onViewResult,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const candidateId = candidate?.id;

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboard(candidateId);

        if (cancelled) {
          return;
        }

        setDashboard(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load dashboard:", err);
        setError(
          err?.message ||
            "Failed to load dashboard."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (!candidateId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-lg bg-red-50 p-6 text-red-600">
          <p>Candidate information is missing.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">
          Loading dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-lg bg-red-50 p-6 text-red-600">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  const candidateData = dashboard?.candidate || candidate;
  const assessments = dashboard?.results || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Your Assessment Dashboard
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Track your assessment progress and results
          </p>
        </div>

        {/* Candidate Info Card */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-slate-100 opacity-50" />

            <div className="relative">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Full Name
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {candidateData?.full_name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Job Title
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {candidateData?.job_title || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Experience
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {candidateData?.experience_years || 0} years
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Career Goal
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {candidateData?.career_goal || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assessments Section */}
        {assessments.length === 0 ? (
          <section className="overflow-hidden rounded-3xl bg-white p-10 shadow-lg ring-1 ring-slate-200">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                📋
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                No Assessments Yet
              </h2>

              <p className="mt-2 text-slate-500">
                You haven't completed any assessments yet.
                Start an assessment to see your results here.
              </p>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Assessments
              </h2>

              <p className="mt-1 text-slate-500">
                Completed assessments and scores
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {assessments.map(
                ({ attempt, score }) => {
                  const cpi = score?.cpi || 0;
                  const cci = score?.cci || 0;

                  let performanceClass =
                    "bg-red-50 text-red-700 ring-red-100";
                  let badgeClass =
                    "bg-red-100 text-red-700";

                  if (cpi >= 80) {
                    performanceClass =
                      "bg-emerald-50 text-emerald-700 ring-emerald-100";
                    badgeClass =
                      "bg-emerald-100 text-emerald-700";
                  } else if (cpi >= 60) {
                    performanceClass =
                      "bg-blue-50 text-blue-700 ring-blue-100";
                    badgeClass =
                      "bg-blue-100 text-blue-700";
                  } else if (cpi >= 40) {
                    performanceClass =
                      "bg-amber-50 text-amber-700 ring-amber-100";
                    badgeClass =
                      "bg-amber-100 text-amber-700";
                  }

                  const formattedDate = new Date(
                    attempt?.completed_at ||
                      attempt?.submitted_at ||
                      attempt?.created_at
                  ).toLocaleDateString();

                  return (
                    <div
                      key={attempt?.id}
                      className={`rounded-2xl p-6 shadow-md ring-1 ${performanceClass}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide opacity-75">
                            Assessment
                          </p>

                          <h3 className="mt-2 text-xl font-bold">
                            {attempt?.assessment_id
                              ?.substring(
                                0,
                                8
                              )
                              .toUpperCase() ||
                              "Assessment"}
                          </h3>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
                        >
                          {cpi >= 80
                            ? "Excellent"
                            : cpi >= 60
                              ? "Good"
                              : cpi >= 40
                                ? "Fair"
                                : "Needs Work"}
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div>
                          <p className="text-sm opacity-75">
                            Performance Score
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            {Math.round(cpi)}%
                          </p>
                        </div>

                        <div>
                          <p className="text-sm opacity-75">
                            Competency Index
                          </p>

                          <p className="mt-1 text-lg font-bold">
                            {cci.toFixed(1)}/100
                          </p>
                        </div>

                        <div>
                          <p className="text-sm opacity-75">
                            Completed
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formattedDate}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onViewResult?.({
                            score,
                            attempt,
                          })
                        }
                        className="mt-6 w-full rounded-lg bg-white px-4 py-2 font-semibold transition hover:bg-slate-100 active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
