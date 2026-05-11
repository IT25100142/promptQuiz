export default function QuizControls({ 
  idx, 
  total, 
  answeredCount, 
  isAnswered, 
  goNext, 
  restartSession 
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => idx + 1 < total ? setIdx(idx + 1) : null}
        disabled={!isAnswered()}
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {idx + 1 === total ? 'See Results' : 'Next'}
      </button>
      <button
        type="button"
        onClick={restartSession}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        Restart
      </button>
    </div>
  )
}
