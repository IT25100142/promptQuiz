export default function ResultsView({
  isReviewMode,
  percent,
  score,
  total
}) {
  return (
    <main className="flex-1 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="rounded-lg bg-slate-950 p-5 text-white">
            <div className="text-sm font-semibold text-teal-200">
              {isReviewMode ? 'Review Complete' : 'Session complete'}
            </div>
            <div className="mt-4 text-5xl font-semibold tracking-tight">{percent}%</div>
            <div className="mt-2 text-sm text-slate-300">
              {score} correct out of {total}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
