export default function ReviewSection({ startReviewMistakes, isReviewMode, incorrectQuestions }) {
  if (isReviewMode || incorrectQuestions.length === 0) return null

  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={startReviewMistakes}
        className="rounded-md bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        Review {incorrectQuestions.length} Mistake{incorrectQuestions.length === 1 ? '' : 's'}
      </button>
    </div>
  )
}
