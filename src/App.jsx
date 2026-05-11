import { useMemo, useState } from 'react'
import { useQuiz } from './features/quiz/hooks/useQuizState.js'
import { useQuizHandlers } from './features/quiz/hooks/useQuizNavigation.js'
import { generateAIPrompt, parseAIResponse } from './features/ai/services/aiPromptGenerator.js'
import { cx, formatSampleJson } from './shared/utils/helpers.js'

import InputView from './components/InputView.jsx'
import QuizView from './components/QuizView.jsx'
import ResultsView from './components/ResultsView.jsx'
import Header from './features/ui/layout/Header.jsx'
import DeckManager from './features/decks/components/DeckManager/DeckManager.jsx'
import MarkdownRenderer from './features/ui/display/MarkdownRenderer.jsx'
import AIPromptBuilder from './features/ai/components/PromptBuilder/AIPromptBuilder.jsx'
import SaveDeckModal from './components/SaveDeckModal.jsx'
import SavedDecksModal from './components/SavedDecksModal.jsx'

export default function App() {
  // UI-only state (modals, toggles)
  const [showSavedDecks, setShowSavedDecks] = useState(false)
  const [showSaveDeck, setShowSaveDeck] = useState(false)
  const [deckLoading, setDeckLoading] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState(null)
  const [showDecksManager, setShowDecksManager] = useState(false)

  // Initialize useQuiz hook for core state and logic
  const quizState = useQuiz()
  
  // Initialize quiz handlers
  const quizHandlers = useQuizHandlers(quizState)

  // Sample JSON for display
  const sampleJson = useMemo(() => formatSampleJson(), [])

  // Handler functions that use both UI state and quiz state
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
      quizHandlers.resetTextAnswers()
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
      await quizState.deleteDeckById(deckId)
      
      // Clear current deck if it was deleted
      if (quizState.currentDeckId === deckId) {
        quizHandlers.resetTextAnswers()
      }
    } catch (error) {
      console.error('Failed to delete deck:', error)
    } finally {
      setDeckLoading(false)
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
      quizState.setView('quiz')
      quizState.setParseMessage(`Successfully loaded ${result.questions.length} questions`)
      quizHandlers.resetTextAnswers()
    } else {
      quizState.setParseMessage(result.error)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      quizState.setParseMessage('Copied to clipboard!')
      setTimeout(() => quizState.setParseMessage(''), 2000)
    } catch (err) {
      quizState.setParseMessage('Failed to copy to clipboard')
    }
  }


  const handleCreateNew = () => {
    setEditingDeckId(null)
    setShowSavedDecks(false)
    quizState.setView('input')
    quizState.setQuiz([])
    quizState.setAnswers([])
    quizState.setIdx(0)
    quizState.setCurrentDeckId(null)
    quizState.setRawJson('')
    quizState.setInputError('')
  }

  // Calculate percentage for results
  const percent = useMemo(() => {
    return quizState.total > 0 ? Math.round((quizState.score / quizState.total) * 100) : 0
  }, [quizState.score, quizState.total])

  return (
    <div className="min-h-dvh bg-[#f6f3ee] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <Header
          isSpacedRepetition={quizState.isSpacedRepetition}
          toggleSpacedRepetition={quizState.toggleSpacedRepetition}
          savedDecks={quizState.savedDecks}
          showAIPromptBuilder={quizState.showAIPromptBuilder}
          setShowAIPromptBuilder={quizState.setShowAIPromptBuilder}
          startDailyReview={quizState.startDailyReview}
          onShowDecks={() => setShowDecksManager(true)}
        />

        <div className="flex-1">
          {showDecksManager && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-950">My Decks</h2>
                  <button
                    type="button"
                    onClick={() => setShowDecksManager(false)}
                    className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto p-6">
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
              </div>
            </div>
          )}

          {quizState.view === 'input' && !showDecksManager && (
            <DeckManager
              savedDecks={quizState.savedDecks}
              onLoadDeck={handleLoadDeck}
              onDeleteDeck={handleDeleteDeck}
              onEditDeck={handleEditDeck}
              onCreateNew={handleCreateNew}
              deckLoading={deckLoading}
              currentDeckId={quizState.currentDeckId}
            />
          )}

          {quizState.view === 'input' && editingDeckId && (
            <main className="grid flex-1 items-center gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      Edit Deck: {quizState.savedDecks.find(d => d.id === editingDeckId)?.name || 'Unknown'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Add questions to this deck or modify existing ones. You can also paste JSON/text to add new questions.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={quizState.formatJson}
                      disabled={!quizState.rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Format
                    </button>
                    <button
                      type="button"
                      onClick={quizState.clearQuiz}
                      disabled={!quizState.rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <InputView
                  rawJson={quizState.rawJson}
                  setRawJson={quizState.setRawJson}
                  inputError={quizState.inputError}
                  setInputError={quizState.setInputError}
                  preview={quizState.preview}
                  loadSample={quizState.loadSample}
                  formatJson={quizState.formatJson}
                  clearQuiz={quizState.clearQuiz}
                  startQuiz={quizState.startQuiz}
                  sampleJson={sampleJson}
                />
              </section>

              <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
                <div className="font-semibold">Adding to Existing Deck</div>
                <div className="mt-3 space-y-3 leading-6">
                  <p>
                    <span className="font-mono text-xs">•</span> Questions added will append to the current deck
                  </p>
                  <p>
                    <span className="font-mono text-xs">•</span> Use JSON format or text format with type markers
                  </p>
                  <p className="mt-2 font-semibold">Question Types:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><span className="font-mono">[T/F]</span> True/False</li>
                    <li><span className="font-mono">[FIB]</span> Fill in Blank</li>
                    <li><span className="font-mono">[CLOZE]</span> Cloze Deletion</li>
                    <li><span className="font-mono">[SA]</span> Short Answer</li>
                  </ul>
                </div>
              </aside>
            </main>
          )}

          {quizState.view === 'input' && !editingDeckId && (
            <main className="grid flex-1 items-center gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      Create New Deck
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Start fresh with a new deck or paste JSON/text to create questions.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={quizState.formatJson}
                      disabled={!quizState.rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Format
                    </button>
                    <button
                      type="button"
                      onClick={quizState.clearQuiz}
                      disabled={!quizState.rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <InputView
                  rawJson={quizState.rawJson}
                  setRawJson={quizState.setRawJson}
                  inputError={quizState.inputError}
                  setInputError={quizState.setInputError}
                  preview={quizState.preview}
                  loadSample={quizState.loadSample}
                  formatJson={quizState.formatJson}
                  clearQuiz={quizState.clearQuiz}
                  startQuiz={quizState.startQuiz}
                  sampleJson={sampleJson}
                />
              </section>

              <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
                <div className="font-semibold">Accepted answer formats</div>
                <div className="mt-3 space-y-3 leading-6">
                  <p>
                    <span className="font-mono text-xs">"answer"</span> can be the exact text of the
                    correct option.
                  </p>
                  <p>
                    <span className="font-mono text-xs">"answerIndex"</span> can be a number from 0
                    to 3.
                  </p>
                  <p>Duplicate or blank options are flagged before the quiz starts.</p>
                  <p className="mt-2 font-semibold">Markdown Support:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><span className="font-mono">**bold**</span> for bold text</li>
                    <li><span className="font-mono">*italic*</span> for italic text</li>
                    <li><span className="font-mono">`code`</span> for inline code</li>
                    <li><span className="font-mono">![alt](url)</span> for images</li>
                  </ul>
                  <p className="mt-2 text-xs">Use Import button to add images or load CSV/Markdown files.</p>
                </div>
              </aside>
            </main>
          )}

          {quizState.view === 'quiz' && (
            <QuizView
              current={quizState.current}
              idx={quizState.idx}
              total={quizState.total}
              answeredCount={quizState.answeredCount}
              score={quizState.score}
              progress={quizState.progress}
              isReviewMode={quizState.isReviewMode}
              incorrectQuestions={quizState.incorrectQuestions}
              answers={quizState.answers}
              textAnswers={quizHandlers.textAnswers}
              showSuggestedAnswer={quizHandlers.showSuggestedAnswer}
              choose={quizState.choose}
              handleTextAnswer={quizHandlers.handleTextAnswer}
              submitTextAnswer={quizHandlers.submitTextAnswer}
              toggleSuggestedAnswer={quizHandlers.toggleSuggestedAnswer}
              handleSelfAssessment={quizHandlers.handleSelfAssessment}
              isAnswered={quizHandlers.isAnswered}
              goPrevious={quizHandlers.goPrevious}
              goNext={quizHandlers.goNext}
              MarkdownRenderer={MarkdownRenderer}
            />
          )}

          {quizState.view === 'results' && (
            <ResultsView
              percent={percent}
              score={quizState.score}
              total={quizState.total}
              isReviewMode={quizState.isReviewMode}
              incorrectQuestions={quizState.incorrectQuestions}
              quiz={quizState.quiz}
              answers={quizState.answers}
              textAnswers={quizHandlers.textAnswers}
              restartSession={quizHandlers.restartSession}
              startReviewMistakes={quizHandlers.startReviewMistakes}
              editQuiz={quizHandlers.editQuiz}
              MarkdownRenderer={MarkdownRenderer}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 mt-4">
          {quizState.view === 'input' ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSavedDecks(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Saved Decks ({quizState.savedDecks.length})
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {quizState.quiz.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSaveDeck(true)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Save Deck
                </button>
              )}
              <button
                type="button"
                onClick={quizHandlers.editQuiz}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Edit Quiz
              </button>
              <button
                type="button"
                onClick={quizHandlers.restartSession}
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Restart
              </button>
            </div>
          )}
        </div>

        {/* Saved Decks Modal */}
        <SavedDecksModal
          showSavedDecks={showSavedDecks}
          setShowSavedDecks={setShowSavedDecks}
          savedDecks={quizState.savedDecks}
          onLoadDeck={handleLoadDeck}
          onDeleteDeck={handleDeleteDeck}
          deckLoading={deckLoading}
        />

        {/* Save Deck Modal */}
        <SaveDeckModal
          showSaveDeck={showSaveDeck}
          setShowSaveDeck={setShowSaveDeck}
          onSaveDeck={handleSaveDeck}
          deckLoading={deckLoading}
        />

        {/* AI Prompt Builder Modal */}
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
