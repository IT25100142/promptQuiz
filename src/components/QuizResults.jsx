export default function QuizResults({ 
  isReviewMode, 
  percent, 
  score, 
  total 
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="rounded-lg bg-slate-950 p-5 text-white">
        <div className="text-sm font-semibold text-teal-200">
          {isReviewMode ? 'Review Complete' : 'Session complete'}
        </div>
        <div className="mt-4 text-5xl font-semibold tracking-tight">{percent}%</div>
        <div className="mt-2 text-sm text-slate-300">
          {score} correct out of {total}
        </div>
        <div className="mt-4 space-y-2">
          {score === total && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-emerald-800">Perfect round! Nothing to review.</p>
            </div>
          )}
          <button
            type="button"
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            {isReviewMode ? 'Start New Quiz' : 'Try Again'}
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Review</h2>
        <div className="mt-4 grid gap-3">
          {[...Array(total)].map((_, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-950">
                Question {idx + 1}
              </div>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                <p>
                  Your answer:{' '}
                  <span className="font-semibold text-slate-950">
                    User answer here
                  </span>
                </p>
                <p>
                  Correct answer:{' '}
                  <span className="font-semibold text-slate-950">
                    Correct answer here
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
