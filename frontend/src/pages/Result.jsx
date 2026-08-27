export default function Result({
  result,
  onBack,
}) {
  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-slate-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            No Result Available
          </h1>

          <p className="mt-3 text-slate-500">
            Assessment result could not be loaded.
          </p>
        </div>
      </main>
    );
  }

  /*
   * --------------------------------------------------
   * Result data
   * --------------------------------------------------
   */

  const score = result.score || result;

  // Try to use CPI first, fall back to overall_score
  const overallScore = Math.min(
    Math.max(
      Number(score.cpi ?? score.overall_score ?? 0),
      0
    ),
    100
  );

  const competencyScores =
    score.competency_scores || {};

  const strengths = Array.isArray(
    score.strengths
  )
    ? score.strengths
    : [];

  const developmentGaps =
    Array.isArray(score.development_gaps)
      ? score.development_gaps
      : [];

  /*
   * --------------------------------------------------
   * Performance message
   * --------------------------------------------------
   */

  let performance;

  if (overallScore >= 80) {
    performance = {
      title: "Excellent Performance!",
      subtitle:
        "Congratulations! You have demonstrated an excellent level of performance across the assessment.",
      icon: "🎉",
      badge: "Excellent",
      badgeClass:
        "bg-emerald-100 text-emerald-700",
      circleClass:
        "bg-emerald-50 text-emerald-600 ring-emerald-100",
      scoreClass:
        "text-emerald-600",
      barClass:
        "bg-emerald-500",
    };
  } else if (overallScore >= 60) {
    performance = {
      title: "Good Job!",
      subtitle:
        "You have demonstrated a good level of performance. Keep building on your strengths.",
      icon: "👏",
      badge: "Good",
      badgeClass:
        "bg-blue-100 text-blue-700",
      circleClass:
        "bg-blue-50 text-blue-600 ring-blue-100",
      scoreClass:
        "text-blue-600",
      barClass:
        "bg-blue-500",
    };
  } else if (overallScore >= 40) {
    performance = {
      title: "Fair Performance",
      subtitle:
        "You have a good foundation, with some areas that can be developed further.",
      icon: "👍",
      badge: "Fair",
      badgeClass:
        "bg-amber-100 text-amber-700",
      circleClass:
        "bg-amber-50 text-amber-600 ring-amber-100",
      scoreClass:
        "text-amber-600",
      barClass:
        "bg-amber-500",
    };
  } else {
    performance = {
      title: "Keep Improving!",
      subtitle:
        "Don't be discouraged. Review your development areas and continue strengthening your skills.",
      icon: "💪",
      badge: "Needs Improvement",
      badgeClass:
        "bg-red-100 text-red-700",
      circleClass:
        "bg-red-50 text-red-600 ring-red-100",
      scoreClass:
        "text-red-600",
      barClass:
        "bg-red-500",
    };
  }

  /*
   * --------------------------------------------------
   * Main UI
   * --------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* ==========================================
            Header
        ========================================== */}

        <div className="mb-8 text-center sm:mb-10">

          <div className="mb-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm">
            Assessment Completed
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Your Assessment Results
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Your assessment has been completed successfully.
            Here's a summary of your performance.
          </p>

        </div>

        {/* ==========================================
            Main Result Card
        ========================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-10">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-slate-100 opacity-70" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-slate-100 opacity-50" />

          <div className="relative">

            {/* Performance */}
            <div className="text-center">

              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-sm ring-8 ${performance.circleClass}`}
              >
                {performance.icon}
              </div>

              <div
                className={`mx-auto mt-5 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${performance.badgeClass}`}
              >
                {performance.badge}
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {performance.title}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                {performance.subtitle}
              </p>

            </div>

            {/* Score */}
            <div className="mt-10 text-center">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Overall Score
              </p>

              <div
                className={`mt-2 text-6xl font-black tracking-tight sm:text-8xl ${performance.scoreClass}`}
              >
                {overallScore}%
              </div>

            </div>

            {/* Score progress */}
            <div className="mx-auto mt-8 max-w-2xl">

              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">
                  Performance
                </span>

                <span className="font-bold text-slate-700">
                  {overallScore} / 100
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-slate-100">

                <div
                  className={`h-full rounded-full transition-all duration-1000 ${performance.barClass}`}
                  style={{
                    width: `${overallScore}%`,
                  }}
                />

              </div>

            </div>

          </div>
        </section>

        {/* ==========================================
            Quick Stats
        ========================================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Overall Score
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {overallScore}%
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Competencies Evaluated
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {Object.keys(
                competencyScores
              ).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Development Areas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {developmentGaps.length}
            </p>
          </div>

        </div>

        {/* ==========================================
            Competency Scores
        ========================================== */}

        {Object.keys(
          competencyScores
        ).length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Competency Scores
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your performance across the assessed competencies.
                </p>
              </div>

            </div>

            <div className="mt-7 space-y-6">

              {Object.entries(
                competencyScores
              ).map(
                ([name, value]) => {

                  const numericScore =
                    Math.min(
                      Math.max(
                        Number(value ?? 0),
                        0
                      ),
                      100
                    );

                  let barClass =
                    "bg-red-500";

                  if (
                    numericScore >= 80
                  ) {
                    barClass =
                      "bg-emerald-500";
                  } else if (
                    numericScore >= 60
                  ) {
                    barClass =
                      "bg-blue-500";
                  } else if (
                    numericScore >= 40
                  ) {
                    barClass =
                      "bg-amber-500";
                  }

                  return (
                    <div key={name}>

                      <div className="mb-2 flex items-center justify-between gap-4">

                        <span className="font-semibold text-slate-700">
                          {name}
                        </span>

                        <span className="text-sm font-bold text-slate-600">
                          {numericScore}%
                        </span>

                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                          style={{
                            width: `${numericScore}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>
        )}

        {/* ==========================================
            Strengths
        ========================================== */}

        {strengths.length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                ✓
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Your Strengths
                </h2>

                <p className="text-sm text-slate-500">
                  Areas where you performed well.
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              {strengths.map(
                (strength, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">

                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        ✓
                      </span>

                      <p className="text-sm leading-6 text-slate-700">
                        {strength}
                      </p>

                    </div>
                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ==========================================
            Development Areas
        ========================================== */}

        {developmentGaps.length > 0 && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                💡
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Areas for Development
                </h2>

                <p className="text-sm text-slate-500">
                  Areas where further development may help.
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              {developmentGaps.map(
                (gap, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-amber-100 bg-amber-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">

                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                        !
                      </span>

                      <p className="text-sm leading-6 text-slate-700">
                        {gap}
                      </p>

                    </div>
                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ==========================================
            Assessment Information
        ========================================== */}

        {result.attempt && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

            <h2 className="text-xl font-bold text-slate-900">
              Assessment Information
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Attempt ID
                </p>

                <p className="mt-2 break-all text-sm font-medium text-slate-700">
                  {result.attempt.id}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <div className="mt-2">

                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold capitalize text-emerald-700">
                    {result.attempt.status}
                  </span>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* ==========================================
            Bottom message
        ========================================== */}

        <div className="mt-8 rounded-3xl bg-slate-900 px-6 py-8 text-center text-white shadow-xl sm:px-10">

          <div className="text-3xl">
            🎯
          </div>

          <h2 className="mt-3 text-xl font-bold">
            Assessment Successfully Completed
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Thank you for completing the assessment.
            Your responses and results have been recorded successfully.
          </p>

          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 rounded-lg bg-white px-6 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Back to Dashboard
            </button>
          )}

        </div>

      </div>
    </main>
  );
}