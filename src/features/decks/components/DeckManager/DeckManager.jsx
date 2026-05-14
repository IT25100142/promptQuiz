import { useState } from 'react'
import { cx } from '../../../../shared/utils/helpers.js'
import DeckList from '../DeckList/DeckList.jsx'
import DeckForm from '../DeckEditor/DeckForm.jsx'

export default function DeckManager({
  savedDecks,
  onLoadDeck,
  onDeleteDeck,
  onEditDeck,
  onCreateNew,
  deckLoading,
  currentDeckId
}) {
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showAddQuestions, setShowAddQuestions] = useState(false)

  const handleLoadDeck = async (deckId) => {
    await onLoadDeck(deckId)
    setSelectedDeck(deckId)
  }

  const handleDeleteClick = (deckId) => {
    setShowDeleteConfirm(deckId)
  }

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await onDeleteDeck(showDeleteConfirm)
      setShowDeleteConfirm(null)
      if (selectedDeck === showDeleteConfirm) {
        setSelectedDeck(null)
      }
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  const handleAddQuestions = () => {
    setShowAddQuestions(true)
  }

  const handleConfirmAddQuestions = async ({ questions, error }) => {
    const existingDeck = savedDecks.find(d => d.id === selectedDeck)
    if (!existingDeck) {
      error('Deck not found')
      return
    }

    error(`Successfully added ${questions.length} questions to "${existingDeck.name}"`)
    setTimeout(() => error(''), 3000)
    
    setShowAddQuestions(false)
  }

  const renderDeleteConfirm = (deck) => (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 rounded-lg">
      <div className="text-center p-4">
        <p className="text-sm font-medium text-slate-900 mb-3">
          Are you sure you want to delete "{deck.name}"?
        </p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deckLoading}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={cancelDelete}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1">
      <DeckList
        savedDecks={savedDecks}
        currentDeckId={currentDeckId}
        selectedDeck={selectedDeck}
        onSelectDeck={setSelectedDeck}
        onLoadDeck={handleLoadDeck}
        onEditDeck={onEditDeck}
        onAddQuestions={handleAddQuestions}
        onDeleteDeck={confirmDelete}
        deckLoading={deckLoading}
        showDeleteConfirm={showDeleteConfirm}
        onShowDeleteConfirm={handleDeleteClick}
      />

      {showAddQuestions && (
        <DeckForm
          selectedDeck={selectedDeck}
          onConfirmAddQuestions={handleConfirmAddQuestions}
          onCancel={() => setShowAddQuestions(false)}
          deckLoading={deckLoading}
        />
      )}
    </div>
  )
}
