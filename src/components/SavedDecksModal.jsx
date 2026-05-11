export default function SavedDecksModal({ 
  showSavedDecks, 
  setShowSavedDecks, 
  savedDecks, 
  onLoadDeck, 
  onDeleteDeck, 
  deckLoading 
}) {
  if (!showSavedDecks) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl max-h-[80vh] rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Saved Decks</h2>
          <button
            type="button"
            onClick={() => setShowSavedDecks(false)}
            className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {savedDecks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">No saved decks yet.</p>
              <p className="mt-2 text-sm text-slate-500">Create a quiz and save it to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-950">{deck.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>{deck.questionCount || deck.questions?.length || 0} questions</span>
                        <span>{new Date(deck.date || deck.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadDeck(deck.id)}
                        disabled={deckLoading}
                        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDeck(deck.id)}
                        disabled={deckLoading}
                        className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
