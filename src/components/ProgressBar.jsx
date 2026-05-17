export default function ProgressBar({
  idx,
  total,
  progress,
  answeredCount,
  score,
  isReviewMode,
  incorrectQuestions
}) {
  return (
    <div className="mb-6 space-y-3">
      {/* Progress text */}
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-slate-700">
          Question {idx + 1} of {total}
        </div>
        <div className="text-slate-600">
          {answeredCount} answered | Score {score}
          {isReviewMode && ` | Mistakes: ${incorrectQuestions.length}`}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(progress)}
      >
        <div 
          className="h-full bg-teal-600 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Progress percentage */}
      <div className="text-center">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
          {Math.round(progress)}% complete
        </span>
      </div>
    </div>
  )
}
