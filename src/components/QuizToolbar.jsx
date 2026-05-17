export default function QuizToolbar({
  shuffleMode,
  keepFirstQuestion,
  toggleShuffleMode,
  toggleKeepFirstQuestion,
  onShowCardOverview,
  total: _total
}) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-4">
        {/* Shuffle Mode Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleMode}
              onChange={toggleShuffleMode}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-slate-700">Shuffle</span>
          </label>
          
          {shuffleMode && (
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={keepFirstQuestion}
                onChange={toggleKeepFirstQuestion}
                className="h-3 w-3 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-600">Keep first</span>
            </label>
          )}
        </div>
      </div>

      {/* Card Overview Button */}
      <button
        type="button"
        onClick={onShowCardOverview}
        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        title="View all questions"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-xs">Overview</span>
      </button>
    </div>
  )
}
