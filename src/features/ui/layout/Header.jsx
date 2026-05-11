export default function Header({ 
  isSpacedRepetition, 
  toggleSpacedRepetition, 
  savedDecks, 
  showAIPromptBuilder, 
  setShowAIPromptBuilder, 
  startDailyReview, 
  onShowDecks 
}) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-slate-950">PromptQuiz</h1>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpacedRepetition}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isSpacedRepetition
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🔄 Spaced Repetition
            </button>
            
            {savedDecks.length > 0 && (
              <button
                type="button"
                onClick={startDailyReview}
                className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 transition-colors"
              >
                📅 Daily Review
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAIPromptBuilder(!showAIPromptBuilder)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              showAIPromptBuilder
                ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🤖 AI Builder
          </button>
          
          <button
            type="button"
            onClick={onShowDecks}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            📚 My Decks ({savedDecks.length})
          </button>
        </div>
      </div>
    </header>
  )
}
