export default function QuestionCard({
  question,
  answer,
  onAnswer,
}) {
  const options = Array.isArray(
    question?.options
  )
    ? question.options
    : [];

  if (!question) {
    return null;
  }

  const isMcq =
    question.question_type === "mcq";

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">

      {/* Question */}
      <p className="mb-6 text-lg font-semibold text-slate-900">
        {question.question_text}
      </p>

      {/* MCQ */}
      {isMcq ? (
        <div className="space-y-3">
          {options.map(
            (option, index) => {
              const value =
                typeof option === "string"
                  ? option
                  : option?.value ??
                    option?.id ??
                    option?.label;

              const label =
                typeof option === "string"
                  ? option
                  : option?.label ??
                    option?.text ??
                    option?.value;

              const selected =
                answer === value;

              return (
                <button
                  key={
                    option?.id ??
                    option?.value ??
                    index
                  }
                  type="button"
                  onClick={() =>
                    onAnswer(value)
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    {/* Radio indicator */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-slate-900"
                          : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                      )}
                    </span>

                    <span className="font-medium text-slate-800">
                      {label}
                    </span>

                  </div>
                </button>
              );
            }
          )}
        </div>
      ) : (
        /*
         * Text answer
         */
        <div>
          <textarea
            value={answer ?? ""}
            onChange={(event) =>
              onAnswer(
                event.target.value
              )
            }
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Enter your answer..."
          />

          <p className="mt-2 text-xs text-slate-400">
            Your answer is automatically saved
            while you type.
          </p>
        </div>
      )}

    </div>
  );
}