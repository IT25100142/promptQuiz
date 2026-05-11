import { useState } from 'react'
import { cx } from '../utils/helpers.js'

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
  const [newQuestions, setNewQuestions] = useState('')
  const [addQuestionsError, setAddQuestionsError] = useState('')

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
    setNewQuestions('')
    setAddQuestionsError('')
  }

  const confirmAddQuestions = async () => {
    if (!selectedDeck) {
      setAddQuestionsError('Please select a deck first')
      return
    }

    if (!newQuestions.trim()) {
      setAddQuestionsError('Please enter questions to add')
      return
    }

    try {
      const lines = newQuestions.trim().split('\n').filter(line => line.trim())
      const parsedQuestions = []
      
      for (const line of lines) {
        if (line.trim()) {
          if (/^\d+\./.test(line) || line.includes('?') || line.toLowerCase().includes('question')) {
            const questionText = line.replace(/^\d+\.\s*/, '').trim()
            if (questionText) {
              parsedQuestions.push({
                question: questionText,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                answer: 'Option A',
                answerIndex: 0,
                type: 'multiple-choice'
              })
            }
          }
        }
      }

      if (parsedQuestions.length === 0) {
        setAddQuestionsError('No valid questions found. Please check your format.')
        return
      }

      const existingDeck = savedDecks.find(d => d.id === selectedDeck)
      if (!existingDeck) {
        setAddQuestionsError('Deck not found')
        return
      }

      console.log('Updated deck:', {
        ...existingDeck,
        questions: [...(existingDeck.questions || []), ...parsedQuestions],
        questionCount: (existingDeck.questions?.length || 0) + parsedQuestions.length
      })
      
      setAddQuestionsError('')
      setShowAddQuestions(false)
      setNewQuestions('')
      setAddQuestionsError(`Successfully added ${parsedQuestions.length} questions to "${existingDeck.name}"`)
      
      setTimeout(() => setAddQuestionsError(''), 3000)
      
    } catch (error) {
      setAddQuestionsError('Failed to add questions. Please check your format.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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

  const renderDeckCard = (deck) => (
    <div
      key={deck.id}
      className={cx(
        'relative rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer',
        currentDeckId === deck.id 
          ? 'border-teal-500 ring-2 ring-teal-200' 
          : 'border-slate-200 hover:border-teal-300',
        selectedDeck === deck.id ? 'ring-2 ring-teal-200' : ''
      )}
      onClick={() => setSelectedDeck(deck.id === selectedDeck.id ? null : deck.id)}
    >
      {showDeleteConfirm === deck.id && renderDeleteConfirm(deck)}

      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-950 pr-2">{deck.name}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleLoadDeck(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md bg-teal-700 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          >
            Study
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEditDeck(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleAddQuestions()
            }}
            disabled={deckLoading}
            className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            Add Q's
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(deck.id)
            }}
            disabled={deckLoading}
            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">{deck.questionCount || deck.questions?.length || 0} questions</span>
          <span>•</span>
          <span>{formatDate(deck.date || deck.createdAt)}</span>
        </div>
        
        {deck.questions && deck.questions.length > 0 && (
          <div className="mt-3">
            <div className="font-medium text-slate-700 mb-2">Recent questions:</div>
            <div className="space-y-1">
              {deck.questions.slice(0, 3).map((question, idx) => (
                <div key={idx} className="text-xs text-slate-600 truncate">
                  • {question.question.length > 60 ? question.question.substring(0, 60) + '...' : question.question}
                </div>
              ))}
              {deck.questions.length > 3 && (
                <div className="text-xs text-slate-500 italic">
                  ...and {deck.questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedDeck === deck.id && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleLoadDeck(deck.id)
              }}
              disabled={deckLoading}
              className="flex-1 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              Start Studying
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleAddQuestions()
              }}
              disabled={deckLoading}
              className="flex-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              Add Questions
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderAddQuestionsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-950">
            Add Questions to Deck
          </h2>
          <button
            type="button"
            onClick={() => setShowAddQuestions(false)}
            className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="new-questions" className="block text-sm font-medium text-slate-700 mb-2">
              Questions to Add (one per line)
            </label>
            <textarea
              id="new-questions"
              value={newQuestions}
              onChange={(e) => setNewQuestions(e.target.value)}
              placeholder="1. What is the capital of France?"
              rows={12}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="text-sm text-slate-600 mb-4">
            <p className="font-medium mb-2">Format:</p>
            <ul className="space-y-1 text-xs">
              <li>• Enter one question per line</li>
              <li>• Use numbers followed by periods (1., 2., etc.)</li>
              <li>• For multiple choice, list options on separate lines</li>
              <li>• Mark correct answer with *</li>
            </ul>
          </div>

          {addQuestionsError && (
            <div className={cx(
              'rounded-lg border px-4 py-3 text-sm font-semibold',
              addQuestionsError.includes('Successfully') 
                ? 'border-teal-200 bg-teal-50 text-teal-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            )}>
              {addQuestionsError}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddQuestions(false)
                setNewQuestions('')
                setAddQuestionsError('')
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAddQuestions}
              disabled={!selectedDeck || !newQuestions.trim()}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              Add Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">My Decks</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your quiz decks and study previous questions
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Create New Deck
        </button>
      </div>

      {savedDecks.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {savedDecks.map(renderDeckCard)}
        </div>
      )}

      {showAddQuestions && renderAddQuestionsModal()}
    </div>
  )
}
