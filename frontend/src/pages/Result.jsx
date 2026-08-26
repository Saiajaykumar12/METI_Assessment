export default function Result({ result }) {
  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            No result available
          </h1>

          <p className="mt-2 text-slate-500">
            Assessment result could not be loaded.
          </p>
        </div>
      </main>
    );
  }

  const score = result.score || {};

  const overallScore = Number(score.overall_score ?? 0);

  const competencyScores = score.competency_scores || {};

  const strengths = Array.isArray(score.strengths)
    ? score.strengths
    : [];

  const developmentGaps = Array.isArray(score.development_gaps)
    ? score.development_gaps
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Assessment Completed
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Your Results
          </h1>

          {result.message && (
            <p className="mt-3 text-slate-500">
              {result.message}
            </p>
          )}
        </div>

        {/* Overall Score */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Overall Score
          </p>

          <div className="mt-4">
            <span className="text-6xl font-bold text-slate-900">
              {overallScore}%
            </span>
          </div>

          <p className="mt-3 text-slate-500">
            Thank you for completing the assessment.
          </p>
        </div>

        {/* Competency Scores */}
        {Object.keys(competencyScores).length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Competency Scores
            </h2>

            <div className="mt-6 space-y-5">
              {Object.entries(competencyScores).map(
                ([name, value]) => {
                  const numericScore = Number(value ?? 0);

                  return (
                    <div key={name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-slate-700">
                          {name}
                        </span>

                        <span className="text-sm font-semibold text-slate-600">
                          {numericScore}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(numericScore, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Strengths
            </h2>

            <ul className="mt-5 space-y-3">
              {strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-slate-600"
                >
                  <span className="mt-1 font-bold text-green-600">
                    ✓
                  </span>

                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Development Gaps */}
        {developmentGaps.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Development Areas
            </h2>

            <ul className="mt-5 space-y-3">
              {developmentGaps.map((gap, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-slate-600"
                >
                  <span className="mt-1 font-bold text-orange-500">
                    •
                  </span>

                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Assessment Information */}
        {result.attempt && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Assessment Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {result.attempt.id && (
                <div>
                  <p className="text-sm text-slate-500">
                    Attempt ID
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-800">
                    {result.attempt.id}
                  </p>
                </div>
              )}

              {result.attempt.status && (
                <div>
                  <p className="text-sm text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 font-medium capitalize text-slate-800">
                    {result.attempt.status}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finish */}
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">
            You have successfully completed the assessment.
          </p>
        </div>

      </div>
    </main>
  );
}