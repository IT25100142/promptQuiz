import { cx } from '../../../shared/utils/helpers.js'

export default function QuestionControls({ idx, total, goPrevious, goNext, isAnswered }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={goPrevious}
        disabled={idx === 0}
        className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={!isAnswered()}
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {idx + 1 === total ? 'See Results' : 'Next'}
      </button>
    </div>
  )
}
