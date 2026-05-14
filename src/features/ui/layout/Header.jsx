export default function Header({
  isSpacedRepetition,
  toggleSpacedRepetition,
  savedDecks,
  showAIPromptBuilder,
  setShowAIPromptBuilder,
  startDailyReview,
  onShowDecks,
}) {
  const btnBase =
    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors'
  const btnNeutral = `${btnBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
  const btnActiveTeal = `${btnBase} border-teal-600 bg-teal-600 text-white hover:bg-teal-700`
  const btnActiveViolet = `${btnBase} border-violet-600 bg-violet-600 text-white hover:bg-violet-700`

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p className="hidden shrink-0 text-sm text-slate-500 md:block">Study tools</p>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:justify-center">
          <button
            type="button"
            onClick={toggleSpacedRepetition}
            className={isSpacedRepetition ? btnActiveTeal : btnNeutral}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Spaced repetition</span>
            <span className="sm:hidden">Spaced</span>
          </button>

          {savedDecks.length > 0 && (
            <button type="button" onClick={startDailyReview} className={btnNeutral} title="Start daily review">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Daily review</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {savedDecks.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAIPromptBuilder(!showAIPromptBuilder)}
            className={showAIPromptBuilder ? btnActiveViolet : btnNeutral}
            title="AI prompt builder"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="hidden sm:inline">AI builder</span>
          </button>

          <button
            type="button"
            onClick={onShowDecks}
            className={btnNeutral}
            title="Open saved deck from library"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="hidden sm:inline">Library</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {savedDecks.length}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
