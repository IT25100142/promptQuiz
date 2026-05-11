import { cx } from '../utils/helpers.js'

export default function Header({ 
  isSpacedRepetition, 
  toggleSpacedRepetition, 
  savedDecks, 
  showAIPromptBuilder, 
  setShowAIPromptBuilder, 
  startDailyReview 
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <div className="text-base font-semibold tracking-tight">PromptQuiz</div>
        <div className="text-sm text-slate-600">Active recall from your own JSON</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSpacedRepetition}
          className={cx(
            'rounded-md border px-3 py-2 text-sm font-semibold',
            isSpacedRepetition 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          )}
        >
          {isSpacedRepetition ? 'SR On' : 'SR Off'}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Saved Decks ({savedDecks.length})
        </button>
        <button
          type="button"
          onClick={() => setShowAIPromptBuilder(true)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          AI Prompt Builder
        </button>
        <button
          type="button"
          onClick={startDailyReview}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Daily Review
        </button>
      </div>
    </header>
  )
}
