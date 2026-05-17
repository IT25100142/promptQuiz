import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx'
import { generateAIPrompt, parseAIResponse } from '../features/ai/services/aiPromptGenerator.js'
import { validateQuizQuestions } from '../shared/schemas/quizQuestions.js'
import Header from '../features/ui/layout/Header.jsx'
import Navigation from './Navigation.jsx'
import SaveDeckModal from './SaveDeckModal.jsx'
import SavedDecksModal from './SavedDecksModal.jsx'
import AIPromptBuilder from '../features/ai/components/PromptBuilder/AIPromptBuilder.jsx'

export default function Layout({ children }) {
  const location = useLocation()
  const session = useQuizSession()
  const library = useQuizLibrary()
  const shell = useQuizShell()
  const { appNotice, setAppNotice } = shell

  const [showSavedDecks, setShowSavedDecks] = useState(false)
  const [showSaveDeck, setShowSaveDeck] = useState(false)
  const [deckLoading, setDeckLoading] = useState(false)

  useEffect(() => {
    if (!appNotice) return
    const t = setTimeout(() => setAppNotice(null), 6000)
    return () => clearTimeout(t)
  }, [appNotice, setAppNotice])

  const handleSaveDeck = async (deckName, setSaveError) => {
    if (!deckName.trim()) {
      setSaveError('Please enter a deck name')
      return
    }

    if (session.quiz.length === 0) {
      setSaveError('No quiz data to save')
      return
    }

    setDeckLoading(true)
    setSaveError('')

    try {
      await library.saveCurrentDeck(deckName.trim())
      setShowSaveDeck(false)
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleLoadDeck = async (deckId) => {
    setDeckLoading(true)

    try {
      await library.loadDeck(deckId)
      setShowSavedDecks(false)
    } catch (error) {
      console.error('Failed to load deck:', error)
      shell.setAppNotice({
        tone: 'error',
        message: error?.message || 'Failed to load deck.',
      })
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
    } catch (error) {
      console.error('Failed to delete deck:', error)
      shell.setAppNotice({
        tone: 'error',
        message: error?.message || 'Failed to delete deck.',
      })
    } finally {
      setDeckLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      shell.setParseMessage('Copied to clipboard!')
      setTimeout(() => shell.setParseMessage(''), 2000)
    } catch (_err) {
      shell.setParseMessage('Failed to copy to clipboard')
    }
  }

  const handleAIPromptGeneration = (params) => {
    const prompt = generateAIPrompt(params)
    if (prompt.error) {
      shell.setParseMessage(prompt.error)
      return ''
    }
    shell.setParseMessage('')
    return prompt
  }

  const handleParseAIResponse = ({ aiResponse }) => {
    const result = parseAIResponse(aiResponse)

    if (result.success) {
      const validated = validateQuizQuestions(result.questions)
      if (!validated.ok) {
        shell.setParseMessage(validated.error)
        return
      }
      session.setQuiz(validated.value)
      session.setAnswers(Array(validated.value.length).fill(null))
      session.setIdx(0)
      library.setCurrentDeckId(null)
      shell.setShowAIPromptBuilder(false)
      session.setIsReviewMode(false)
      shell.setParseMessage(`Successfully loaded ${validated.value.length} questions`)
    } else {
      shell.setParseMessage(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-950">
      <Navigation />

      {library.decksLoadStatus === 'error' && library.decksLoadError && (
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {library.decksLoadError}
          </div>
        </div>
      )}

      {shell.appNotice && (
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              shell.appNotice.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : shell.appNotice.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <span>{shell.appNotice.message}</span>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => shell.setAppNotice(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Header
          isSpacedRepetition={session.isSpacedRepetition}
          toggleSpacedRepetition={session.toggleSpacedRepetition}
          savedDecks={library.savedDecks}
          showAIPromptBuilder={shell.showAIPromptBuilder}
          setShowAIPromptBuilder={shell.setShowAIPromptBuilder}
          startDailyReview={session.startDailyReview}
          onShowDecks={() => setShowSavedDecks(true)}
        />

        <main className="flex-1">
          {children}
        </main>

        {(location.pathname === '/quiz' || location.pathname === '/results') && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6 mt-6 bg-white/50 backdrop-blur-sm rounded-t-2xl px-6">
            <div className="flex gap-3">
              {session.quiz.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSaveDeck(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                  Save Deck
                </button>
              )}
            </div>
          </div>
        )}

        <SavedDecksModal
          showSavedDecks={showSavedDecks}
          setShowSavedDecks={setShowSavedDecks}
          savedDecks={library.savedDecks}
          onLoadDeck={handleLoadDeck}
          onDeleteDeck={handleDeleteDeck}
          deckLoading={deckLoading}
        />

        <SaveDeckModal
          showSaveDeck={showSaveDeck}
          setShowSaveDeck={setShowSaveDeck}
          onSaveDeck={handleSaveDeck}
          deckLoading={deckLoading}
        />

        <AIPromptBuilder
          showAIPromptBuilder={shell.showAIPromptBuilder}
          setShowAIPromptBuilder={shell.setShowAIPromptBuilder}
          aiResponse={shell.aiResponse}
          setAiResponse={shell.setAiResponse}
          parseMessage={shell.parseMessage}
          setParseMessage={shell.setParseMessage}
          onGeneratePrompt={handleAIPromptGeneration}
          onParseResponse={handleParseAIResponse}
          onCopyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  )
}
