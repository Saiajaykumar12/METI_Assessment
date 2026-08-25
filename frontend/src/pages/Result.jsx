export default function Result({ result }) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Assessment Completed
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Your Results
          </h1>

          <div className="my-8">
            <p className="text-6xl font-bold text-slate-900">
              {result?.overall_score ?? 0}%
            </p>

            <p className="mt-2 text-slate-500">
              Overall Score
            </p>
          </div>
        </div>

        {result?.competency_scores && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Competency Scores
            </h2>

            <div className="space-y-4">
              {Object.entries(result.competency_scores).map(
                ([name, score]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-medium">
                        {name}
                      </span>

                      <span className="text-sm text-slate-500">
                        {score}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {result?.strengths?.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">
              Strengths
            </h2>

            <ul className="list-disc space-y-2 pl-5 text-slate-600">
              {result.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.development_gaps?.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">
              Development Areas
            </h2>

            <ul className="list-disc space-y-2 pl-5 text-slate-600">
              {result.development_gaps.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </main>
  );
}