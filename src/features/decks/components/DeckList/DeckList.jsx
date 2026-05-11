import DeckCard from './DeckCard.jsx'

export default function DeckList({ 
  savedDecks, 
  currentDeckId, 
  selectedDeck, 
  onSelectDeck, 
  onLoadDeck, 
  onEditDeck, 
  onAddQuestions, 
  onDeleteDeck, 
  deckLoading,
  showDeleteConfirm,
  onShowDeleteConfirm 
}) {
  if (savedDecks.length === 0) {
    return (
      <div className="text-center py-12 rounded-lg border border-slate-200 bg-white">
        <div className="mx-auto max-w-sm">
          <div className="text-6xl text-slate-300 mb-4">📚</div>
          <h3 className="text-lg font-semibold text-slate-950 mb-2">No decks yet</h3>
          <p className="text-sm text-slate-600 mb-6">
            Create your first deck to start studying and tracking your progress.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-md bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Create Your First Deck
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {savedDecks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          currentDeckId={currentDeckId}
          selectedDeck={selectedDeck}
          onSelectDeck={onSelectDeck}
          onLoadDeck={onLoadDeck}
          onEditDeck={onEditDeck}
          onAddQuestions={onAddQuestions}
          onDeleteDeck={onDeleteDeck}
          deckLoading={deckLoading}
          showDeleteConfirm={showDeleteConfirm}
          onShowDeleteConfirm={onShowDeleteConfirm}
        />
      ))}
    </div>
  )
}
