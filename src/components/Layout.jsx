import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuizContext } from '../contexts/QuizContext.jsx'
import { generateAIPrompt, parseAIResponse } from '../features/ai/services/aiPromptGenerator.js'
import Header from '../features/ui/layout/Header.jsx'
import Navigation from './Navigation.jsx'
import SaveDeckModal from './SaveDeckModal.jsx'
import SavedDecksModal from './SavedDecksModal.jsx'
import AIPromptBuilder from '../features/ai/components/PromptBuilder/AIPromptBuilder.jsx'

export default function Layout({ children }) {
  const location = useLocation()
  const quizState = useQuizContext()
  
  const [showSavedDecks, setShowSavedDecks] = useState(false)
  const [showSaveDeck, setShowSaveDeck] = useState(false)
  const [deckLoading, setDeckLoading] = useState(false)

  useEffect(() => {
    if (!quizState.appNotice) return
    const t = setTimeout(() => quizState.setAppNotice(null), 6000)
    return () => clearTimeout(t)
  }, [quizState.appNotice, quizState.setAppNotice])

  const handleSaveDeck = async (deckName, setSaveError) => {
    if (!deckName.trim()) {
      setSaveError('Please enter a deck name')
      return
    }

    if (quizState.quiz.length === 0) {
      setSaveError('No quiz data to save')
      return
    }

    setDeckLoading(true)
    setSaveError('')

    try {
      await quizState.saveCurrentDeck(deckName.trim())
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
      await quizState.loadDeck(deckId)
      setShowSavedDecks(false)
    } catch (error) {
      console.error('Failed to load deck:', error)
      quizState.setAppNotice({
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
      await quizState.deleteDeck(deckId)
    } catch (error) {
      console.error('Failed to delete deck:', error)
      quizState.setAppNotice({
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
      quizState.setParseMessage('Copied to clipboard!')
      setTimeout(() => quizState.setParseMessage(''), 2000)
    } catch (_err) {
      quizState.setParseMessage('Failed to copy to clipboard')
    }
  }

  const handleAIPromptGeneration = (params) => {
    const prompt = generateAIPrompt(params)
    if (prompt.error) {
      quizState.setParseMessage(prompt.error)
      return ''
    }
    quizState.setParseMessage('')
    return prompt
  }

  const handleParseAIResponse = ({ aiResponse }) => {
    const result = parseAIResponse(aiResponse, quizState)
    
    if (result.success) {
      quizState.setQuiz(result.questions)
      quizState.setAnswers(Array(result.questions.length).fill(null))
      quizState.setIdx(0)
      quizState.setCurrentDeckId(null)
      quizState.setShowAIPromptBuilder(false)
      quizState.setIsReviewMode(false)
      quizState.setParseMessage(`Successfully loaded ${result.questions.length} questions`)
    } else {
      quizState.setParseMessage(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 text-slate-950">
      <Navigation />

      {quizState.decksLoadStatus === 'error' && quizState.decksLoadError && (
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {quizState.decksLoadError}
          </div>
        </div>
      )}

      {quizState.appNotice && (
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              quizState.appNotice.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : quizState.appNotice.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <span>{quizState.appNotice.message}</span>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => quizState.setAppNotice(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Header
          isSpacedRepetition={quizState.isSpacedRepetition}
          toggleSpacedRepetition={quizState.toggleSpacedRepetition}
          savedDecks={quizState.savedDecks}
          showAIPromptBuilder={quizState.showAIPromptBuilder}
          setShowAIPromptBuilder={quizState.setShowAIPromptBuilder}
          startDailyReview={quizState.startDailyReview}
          onShowDecks={() => setShowSavedDecks(true)}
        />

        <main className="flex-1">
          {children}
        </main>

        {/* Action buttons for quiz and results pages */}
        {(location.pathname === '/quiz' || location.pathname === '/results') && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6 mt-6 bg-white/50 backdrop-blur-sm rounded-t-2xl px-6">
            <div className="flex gap-3">
              {quizState.quiz.length > 0 && (
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

        {/* Modals */}
        <SavedDecksModal
          showSavedDecks={showSavedDecks}
          setShowSavedDecks={setShowSavedDecks}
          savedDecks={quizState.savedDecks}
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
          showAIPromptBuilder={quizState.showAIPromptBuilder}
          setShowAIPromptBuilder={quizState.setShowAIPromptBuilder}
          aiResponse={quizState.aiResponse}
          setAiResponse={quizState.setAiResponse}
          parseMessage={quizState.parseMessage}
          setParseMessage={quizState.setParseMessage}
          onGeneratePrompt={handleAIPromptGeneration}
          onParseResponse={handleParseAIResponse}
          onCopyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  )
}
