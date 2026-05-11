export default function QuizProgress({ 
  current, 
  total, 
  answeredCount, 
  score, 
  isReviewMode, 
  incorrectQuestions 
}) {
  const progress = total > 0 ? (answeredCount / total) * 100 : 0

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-semibold text-teal-700">
          {isReviewMode ? 'Reviewing ' : 'Question '}{current + 1} of {total}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {answeredCount} answered | Score {score}
          {isReviewMode && ` | Mistakes: ${incorrectQuestions.length}`}
        </div>
      </div>
      <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
        {Math.round(progress)}% through
      </div>
    </div>
  )
}
