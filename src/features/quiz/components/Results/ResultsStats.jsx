export default function ResultsStats({ percent, score, total, isReviewMode, incorrectQuestions }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="text-5xl font-bold text-slate-950">{percent}%</div>
        <div className="text-lg text-slate-600">Score: {score}/{total}</div>
      </div>
      
      {!isReviewMode && incorrectQuestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950 mb-2">
            You got {incorrectQuestions.length} question{incorrectQuestions.length === 1 ? '' : 's'} wrong
          </p>
          <p className="text-sm text-amber-800">
            Review these questions to reinforce your learning.
          </p>
        </div>
      )}
    </div>
  )
}
