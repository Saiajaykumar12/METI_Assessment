export default function ProgressBar({ current, total }) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-between text-sm text-slate-500">
        <span>
          Question {current + 1} of {total}
        </span>

        <span>{Math.round(percentage)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}