import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizHandlers } from '../features/quiz/hooks/useQuizNavigation.js'
import { formatSampleJson } from '../shared/utils/helpers.js'
import FolderDeckBrowser from '../features/decks/components/FolderDeckBrowser/FolderDeckBrowser.jsx'
import QuestionEditor from '../features/questions/components/QuestionEditor/QuestionEditor.jsx'
import { useQuizContext } from '../contexts/QuizContext.jsx'

export default function CreateDeckPage() {
  const navigate = useNavigate()
  const quizState = useQuizContext()
  const quizHandlers = useQuizHandlers(quizState)
  
  const [deckLoading, setDeckLoading] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState(null)

  const sampleJson = useMemo(() => formatSampleJson(), [])

  const handleLoadDeck = async (deckId) => {
    setDeckLoading(true)
    
    try {
      await quizState.loadDeckQuizzes(deckId)
    } catch (error) {
      console.error('Failed to load deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleLoadQuiz = async (quizId) => {
    setDeckLoading(true)
    
    try {
      await quizState.loadQuizQuestions(quizId)
      quizHandlers.resetTextAnswers()
    } catch (error) {
      console.error('Failed to load quiz:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleCreateDeck = async (deckName) => {
    setDeckLoading(true)
    
    try {
      await quizState.createNewDeck(deckName)
    } catch (error) {
      console.error('Failed to create deck:', error)
      throw error
    } finally {
      setDeckLoading(false)
    }
  }

  const handleCreateQuiz = async (deckId, quizName) => {
    setDeckLoading(true)
    
    try {
      await quizState.createNewQuiz(deckId, quizName)
    } catch (error) {
      console.error('Failed to create quiz:', error)
      throw error
    } finally {
      setDeckLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    setDeckLoading(true)
    
    try {
      await quizState.deleteDeck(deckId)
      
      if (quizState.currentDeckId === deckId) {
        quizHandlers.resetTextAnswers()
        setEditingDeckId(null)
      }
    } catch (error) {
      console.error('Failed to delete deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    setDeckLoading(true)
    
    try {
      await quizState.deleteQuizById(quizId)
      
      if (quizState.currentQuizId === quizId) {
        quizHandlers.resetTextAnswers()
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleUpdateDeck = async (deckId, updates) => {
    setDeckLoading(true)
    
    try {
      await quizState.updateDeckInfo(deckId, updates)
    } catch (error) {
      console.error('Failed to update deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleUpdateQuiz = async (quizId, updates) => {
    setDeckLoading(true)
    
    try {
      await quizState.updateQuizInfo(quizId, updates)
    } catch (error) {
      console.error('Failed to update quiz:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleUpdateQuestion = async (questionId, updates) => {
    setDeckLoading(true)
    
    try {
      await quizState.updateQuizQuestion(questionId, updates)
    } catch (error) {
      console.error('Failed to update question:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    setDeckLoading(true)
    
    try {
      await quizState.deleteQuizQuestion(questionId)
    } catch (error) {
      console.error('Failed to delete question:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleReorderQuestions = async (newQuestions) => {
    setDeckLoading(true)
    
    try {
      // Update order for each question
      for (let i = 0; i < newQuestions.length; i++) {
        await quizState.updateQuizQuestion(newQuestions[i].id, { order: i })
      }
      // Reload questions to get updated order
      if (quizState.currentQuizId) {
        await quizState.loadQuizQuestions(quizState.currentQuizId)
      }
    } catch (error) {
      console.error('Failed to reorder questions:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleEditDeck = (deckId) => {
    setEditingDeckId(deckId)
    handleLoadDeck(deckId)
  }

  const handleCreateNew = () => {
    setEditingDeckId(null)
    quizState.setQuiz([])
    quizState.setAnswers([])
    quizState.setIdx(0)
    quizState.setCurrentDeckId(null)
    quizState.setRawJson('')
    quizState.setInputError('')
  }

  const handleStartQuiz = () => {
    if (quizState.startQuiz()) {
      navigate('/quiz')
    }
  }

  const pageTitle = quizState.currentQuizId ? 'Edit quiz' : 'Create quiz'
  const pageSubtitle = quizState.currentQuizId
    ? 'Modify questions in the JSON editor or use the list below.'
    : 'Pick a deck and quiz on the left, or paste JSON to start.'

  return (
    <div className="flex-1 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{pageTitle}</h1>
          {quizState.currentQuizId && quizState.quiz.length > 0 && (
            <p className="text-sm text-slate-500">
              {quizState.quiz.length} question{quizState.quiz.length === 1 ? '' : 's'}
              {quizState.preview.ok ? ' · JSON preview valid' : ''}
            </p>
          )}
        </div>
        <p className="mt-1 text-slate-600">{pageSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        {/* Left Column - Deck Browser */}
        <div className="xl:col-span-3">
          <FolderDeckBrowser
            savedDecks={quizState.savedDecks}
            deckQuizzes={quizState.deckQuizzes}
            selectedDeckForQuiz={quizState.selectedDeckForQuiz}
            currentDeckId={quizState.currentDeckId}
            currentQuizId={quizState.currentQuizId}
            onLoadDeck={handleLoadDeck}
            onLoadQuiz={handleLoadQuiz}
            onCreateDeck={handleCreateDeck}
            onCreateQuiz={handleCreateQuiz}
            onDeleteDeck={handleDeleteDeck}
            onDeleteQuiz={handleDeleteQuiz}
            onUpdateDeck={handleUpdateDeck}
            onUpdateQuiz={handleUpdateQuiz}
            deckLoading={deckLoading}
            isCreatingDeck={quizState.isCreatingDeck}
            isCreatingQuiz={quizState.isCreatingQuiz}
            setIsCreatingDeck={quizState.setIsCreatingDeck}
            setIsCreatingQuiz={quizState.setIsCreatingQuiz}
          />
        </div>

        {/* Center Column - Main Content */}
        <div className="xl:col-span-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New quiz</span>
                </button>
                {quizState.currentQuizId && (
                  <button
                    type="button"
                    onClick={() =>
                      quizState.addQuestionsToQuiz(
                        quizState.currentQuizId,
                        quizState.selectedDeckForQuiz,
                        quizState.preview.value,
                      )
                    }
                    disabled={!quizState.preview.ok || deckLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add questions</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {quizState.preview.value?.length || 0}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={quizState.formatJson}
                  disabled={!quizState.rawJson.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>Format</span>
                </button>
                <button
                  type="button"
                  onClick={quizState.clearQuiz}
                  disabled={!quizState.rawJson.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">Quiz JSON</h3>
                <p className="text-sm text-slate-500">Edit the array of question objects, then parse or start.</p>
              </div>
              <button
                type="button"
                onClick={quizState.loadSample}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Load sample
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="quiz-json">
                  Editor
                </label>
                <textarea
                  id="quiz-json"
                  value={quizState.rawJson}
                  onChange={(event) => {
                    quizState.setRawJson(event.target.value)
                    if (quizState.inputError) quizState.setInputError('')
                  }}
                  placeholder={sampleJson}
                  spellCheck={false}
                  aria-invalid={Boolean(quizState.inputError)}
                  className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-slate-900 p-4 font-mono text-[12px] leading-6 text-slate-50 shadow-inner outline-none placeholder:text-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite" className="flex min-w-0 items-center gap-2">
                  {quizState.inputError ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      <span>{quizState.inputError}</span>
                    </div>
                  ) : quizState.rawJson.trim() && quizState.preview.ok ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      <span>
                        Ready · {quizState.preview.value.length} question
                        {quizState.preview.value.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (quizState.preview.ok) {
                        quizState.setInputError('')
                      } else {
                        quizState.setInputError(quizState.preview.error || 'Failed to parse input')
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <span>Parse & validate</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    disabled={!quizState.preview.ok}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>Start quiz</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {quizState.currentQuizId && quizState.quiz.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Question list</h3>
                  <p className="text-sm text-slate-500">Reorder, edit, or remove cards in this quiz.</p>
                </div>
                <div className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                  {quizState.quiz.length} total
                </div>
              </div>
              <QuestionEditor
                questions={quizState.quiz}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onReorderQuestions={handleReorderQuestions}
                loading={deckLoading}
              />
            </div>
          )}
        </div>

        <div className="xl:col-span-3 space-y-5">
          {quizState.currentQuizId && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">This quiz</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Questions</dt>
                  <dd className="font-semibold text-slate-900">{quizState.quiz.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Status</dt>
                  <dd>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        quizState.quiz.length > 0
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {quizState.quiz.length > 0 ? 'Ready' : 'Empty'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <details className="group rounded-xl border border-slate-200 bg-white shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
              <span>JSON and answer formats</span>
              <svg
                className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="space-y-6 border-t border-slate-100 p-4 text-sm leading-relaxed text-slate-700">
              {quizState.currentQuizId ? (
                <ul className="list-inside list-disc space-y-2">
                  <li>Add questions with &quot;Add questions&quot; only after the JSON preview is valid.</li>
                  <li>Use JSON or import flows; type markers are documented below.</li>
                  <li>Edit individual cards in the question list in the center column.</li>
                </ul>
              ) : (
                <ul className="list-inside list-disc space-y-2">
                  <li>Expand a deck, open a quiz, then edit JSON or use the question list.</li>
                  <li>Decks group quizzes; each quiz holds an ordered list of questions.</li>
                </ul>
              )}

              <div>
                <h4 className="mb-2 font-semibold text-slate-900">Multiple choice answers</h4>
                <p>
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">&quot;answer&quot;</code> can match
                  the correct option text exactly, or use{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">&quot;answerIndex&quot;</code> (0–3).
                  Duplicate or blank options are rejected before starting a run.
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-900">Cloze blanks</h4>
                <p className="mb-2">Use braces in the question string, one blank per accepted answer in order.</p>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
                  <p>Example: The if block runs when a {'{condition}'} is true.</p>
                  <p>Example: A constructor is used to {'{initialize}'} an object.</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-slate-900">Question type markers</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['[T/F]', 'True / false'],
                    ['[FIB]', 'Fill in blank'],
                    ['[CLOZE]', 'Cloze'],
                    ['[SA]', 'Short answer'],
                  ].map(([tag, label]) => (
                    <div key={tag} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">{tag}</span>
                      <span className="text-xs text-slate-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!quizState.currentQuizId && (
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Markdown in stems</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-slate-200 px-2 py-2 font-mono text-slate-800">**bold**</div>
                    <div className="rounded-lg border border-slate-200 px-2 py-2 font-mono text-slate-800">*italic*</div>
                    <div className="rounded-lg border border-slate-200 px-2 py-2 font-mono text-slate-800">`code`</div>
                    <div className="rounded-lg border border-slate-200 px-2 py-2 font-mono text-slate-800">![alt](url)</div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Use your usual import flow for images or CSV/Markdown when available.
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
