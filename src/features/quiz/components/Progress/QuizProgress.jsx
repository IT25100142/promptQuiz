export default function QuizProgress({ 
  idx, 
  total, 
  answeredCount, 
  score, 
  isReviewMode, 
  incorrectQuestions 
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-teal-700">
        {isReviewMode ? 'Reviewing ' : 'Question '}{idx + 1} of {total}
      </div>
      <div className="mt-1 text-sm text-slate-600">
        {answeredCount} answered | Score {score}
        {isReviewMode && ` | Mistakes: ${incorrectQuestions.length}`}
      </div>
    </div>
  )
}
