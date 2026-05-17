import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizHandlers } from '../features/quiz/hooks/useQuizNavigation.js'
import DeckManager from '../features/decks/components/DeckManager/DeckManager.jsx'
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx'
import {
  exportLibrarySnapshot,
  importLibrarySnapshot,
  getAllDecks,
} from '../shared/services/indexedDB.js'

export default function DecksPage() {
  const navigate = useNavigate()
  const library = useQuizLibrary()
  const session = useQuizSession()
  const shell = useQuizShell()
  const quizHandlers = useQuizHandlers(session)
  const importInputRef = useRef(null)

  const [deckLoading, setDeckLoading] = useState(false)

  const handleLoadDeck = async (deckId) => {
    setDeckLoading(true)
    
    try {
      await library.loadDeck(deckId)
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
      await library.deleteDeck(deckId)
      
      if (library.currentDeckId === deckId) {
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

  const handleExportLibrary = async () => {
    setDeckLoading(true)
    try {
      const snapshot = await exportLibrarySnapshot()
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `promptquiz-library-${new Date().toISOString().slice(0, 10)}.json`
      a.rel = 'noopener'
      a.click()
      URL.revokeObjectURL(url)
      shell.setAppNotice({
        message: 'Library exported to your downloads folder.',
      })
    } catch (error) {
      console.error('Export failed:', error)
      shell.setAppNotice({
        tone: 'error',
        message: error?.message || 'Failed to export library.',
      })
    } finally {
      setDeckLoading(false)
    }
  }

  const handleImportLibraryPick = () => {
    importInputRef.current?.click()
  }

  const handleImportLibraryFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (
      !window.confirm(
        'Import will replace your entire local library in this browser. Continue?',
      )
    ) {
      return
    }

    setDeckLoading(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      await importLibrarySnapshot(json, { mode: 'replace' })
      const decks = await getAllDecks()
      library.setSavedDecks(decks)
      library.clearQuiz()
      session.setIsReviewMode(false)
      quizHandlers.resetTextAnswers()
      shell.setAppNotice({
        message: `Library imported (${decks.length} deck${decks.length === 1 ? '' : 's'}).`,
      })
    } catch (error) {
      console.error('Import failed:', error)
      shell.setAppNotice({
        tone: 'error',
        message: error?.message || 'Failed to import library.',
      })
    } finally {
      setDeckLoading(false)
    }
  }

  return (
    <div className="flex-1 py-6">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 mb-2">My Decks</h1>
            <p className="text-slate-600">
              Manage your flashcard decks and start studying
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import library JSON file"
              onChange={handleImportLibraryFile}
            />
            <button
              type="button"
              onClick={handleExportLibrary}
              disabled={deckLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Export library
            </button>
            <button
              type="button"
              onClick={handleImportLibraryPick}
              disabled={deckLoading}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              Import library
            </button>
            <button
              type="button"
              onClick={handleCreateNew}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Create New Deck
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <DeckManager
          savedDecks={library.savedDecks}
          onLoadDeck={handleLoadDeck}
          onDeleteDeck={handleDeleteDeck}
          onEditDeck={handleEditDeck}
          onCreateNew={handleCreateNew}
          deckLoading={deckLoading}
          currentDeckId={library.currentDeckId}
        />
      </div>

      {library.savedDecks.length === 0 && (
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
