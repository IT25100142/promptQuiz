import DeckCard from './DeckCard.jsx'

export default function DeckList({ 
  savedDecks, 
  currentDeckId, 
  selectedDeck, 
  onSelectDeck, 
  onLoadDeck, 
  onEditDeck, 
  onAddQuestions, 
  deckLoading,
  onShowDeleteConfirm
}) {
  if (savedDecks.length === 0) {
    return null // Empty state is handled by the parent DecksPage component
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
          deckLoading={deckLoading}
          onShowDeleteConfirm={onShowDeleteConfirm}
        />
      ))}
    </div>
  )
}
