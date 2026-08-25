export default function QuestionCard({
  question,
  answer,
  onAnswer,
}) {
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <p className="mb-6 text-lg font-semibold text-slate-900">
        {question.question_text}
      </p>

      <div className="space-y-3">
        {options.map((option, index) => {
          const value =
            typeof option === "string"
              ? option
              : option.value ?? option.id ?? option.label;

          const label =
            typeof option === "string"
              ? option
              : option.label ?? option.text ?? option.value;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onAnswer(value)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                answer === value
                  ? "border-slate-900 bg-slate-100"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}