import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizHandlers } from '../features/quiz/hooks/useQuizNavigation.js'
import DeckManager from '../features/decks/components/DeckManager/DeckManager.jsx'
import { useQuizContext } from '../contexts/QuizContext.jsx'

export default function DecksPage() {
  const navigate = useNavigate()
  const quizState = useQuizContext()
  const quizHandlers = useQuizHandlers(quizState)
  
  const [deckLoading, setDeckLoading] = useState(false)

  const handleLoadDeck = async (deckId) => {
    setDeckLoading(true)
    
    try {
      await quizState.loadDeck(deckId)
      quizHandlers.resetTextAnswers()
      navigate('/quiz')
    } catch (error) {
      console.error('Failed to load deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) {
      return
    }

    setDeckLoading(true)
    
    try {
      await quizState.deleteDeck(deckId)
      
      if (quizState.currentDeckId === deckId) {
        quizHandlers.resetTextAnswers()
      }
    } catch (error) {
      console.error('Failed to delete deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleEditDeck = (deckId) => {
    navigate(`/create?deck=${deckId}`)
  }

  const handleCreateNew = () => {
    navigate('/create')
  }

  return (
    <div className="flex-1 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 mb-2">My Decks</h1>
            <p className="text-slate-600">
              Manage your flashcard decks and start studying
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Create New Deck
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <DeckManager
          savedDecks={quizState.savedDecks}
          onLoadDeck={handleLoadDeck}
          onDeleteDeck={handleDeleteDeck}
          onEditDeck={handleEditDeck}
          onCreateNew={handleCreateNew}
          deckLoading={deckLoading}
          currentDeckId={quizState.currentDeckId}
        />
      </div>

      {quizState.savedDecks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-slate-950 mb-2">No Decks Yet</h3>
          <p className="text-slate-600 mb-6">Create your first deck to get started</p>
          <button
            onClick={handleCreateNew}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Create Your First Deck
          </button>
        </div>
      )}
    </div>
  )
}
