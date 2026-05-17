import { useState } from 'react'
import { cx } from '../../../../shared/utils/helpers.js'

export default function FolderDeckBrowser({
  savedDecks,
  deckQuizzes,
  selectedDeckForQuiz,
  currentDeckId: _currentDeckId,
  currentQuizId,
  onLoadDeck,
  onLoadQuiz,
  onCreateDeck,
  onCreateQuiz,
  onDeleteDeck,
  onDeleteQuiz,
  onUpdateDeck,
  onUpdateQuiz,
  deckLoading,
  isCreatingDeck,
  isCreatingQuiz,
  setIsCreatingDeck,
  setIsCreatingQuiz
}) {
  const [expandedDecks, setExpandedDecks] = useState(new Set())
  const [editingDeck, setEditingDeck] = useState(null)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [newDeckName, setNewDeckName] = useState('')
  const [newQuizName, setNewQuizName] = useState('')
  const [selectedDeckForNewQuiz, setSelectedDeckForNewQuiz] = useState('')

  const toggleDeckExpansion = (deckId) => {
    const newExpanded = new Set(expandedDecks)
    if (newExpanded.has(deckId)) {
      newExpanded.delete(deckId)
    } else {
      newExpanded.add(deckId)
      // Load quizzes for this deck if not already loaded
      if (selectedDeckForQuiz !== deckId) {
        onLoadDeck(deckId)
      }
    }
    setExpandedDecks(newExpanded)
  }

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return
    
    try {
      await onCreateDeck(newDeckName.trim())
      setNewDeckName('')
      setIsCreatingDeck(false)
    } catch (error) {
      console.error('Failed to create deck:', error)
    }
  }

  const handleCreateQuiz = async () => {
    if (!newQuizName.trim() || !selectedDeckForNewQuiz) return
    
    try {
      await onCreateQuiz(selectedDeckForNewQuiz, newQuizName.trim())
      setNewQuizName('')
      setSelectedDeckForNewQuiz('')
      setIsCreatingQuiz(false)
    } catch (error) {
      console.error('Failed to create quiz:', error)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck and all its quizzes?')) return
    
    try {
      await onDeleteDeck(deckId)
      const newExpanded = new Set(expandedDecks)
      newExpanded.delete(deckId)
      setExpandedDecks(newExpanded)
    } catch (error) {
      console.error('Failed to delete deck:', error)
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz and all its questions?')) return
    
    try {
      await onDeleteQuiz(quizId)
    } catch (error) {
      console.error('Failed to delete quiz:', error)
    }
  }

  const handleUpdateDeck = async (deckId, name) => {
    if (!name.trim()) return
    
    try {
      await onUpdateDeck(deckId, { name: name.trim() })
      setEditingDeck(null)
    } catch (error) {
      console.error('Failed to update deck:', error)
    }
  }

  const handleUpdateQuiz = async (quizId, name) => {
    if (!name.trim()) return
    
    try {
      await onUpdateQuiz(quizId, { name: name.trim() })
      setEditingQuiz(null)
    } catch (error) {
      console.error('Failed to update quiz:', error)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Decks & quizzes</h2>
            <p className="text-sm text-slate-500">Organize decks and open a quiz to edit</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsCreatingDeck(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New deck</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingQuiz(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>New quiz</span>
          </button>
        </div>
      </div>

      {/* Create Deck Form */}
      {isCreatingDeck && (
        <div className="mb-6 p-6 border-2 border-teal-200 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-teal-900">Create New Deck</h3>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Enter deck name..."
              className="flex-1 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={handleCreateDeck}
              disabled={deckLoading || !newDeckName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Create</span>
            </button>
            <button
              onClick={() => {
                setIsCreatingDeck(false)
                setNewDeckName('')
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Quiz Form */}
      {isCreatingQuiz && (
        <div className="mb-6 p-6 border-2 border-blue-200 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Create New Quiz</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2" htmlFor="select-deck-for-new-quiz">
                Select Deck
              </label>
              <select
                id="select-deck-for-new-quiz"
                value={selectedDeckForNewQuiz}
                onChange={(e) => setSelectedDeckForNewQuiz(e.target.value)}
                className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a deck...</option>
                {savedDecks.map(deck => (
                  <option key={deck.id} value={deck.id}>{deck.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2" htmlFor="new-quiz-name-input">
                Quiz Name
              </label>
              <div className="flex gap-3">
                <input
                  id="new-quiz-name-input"
                  type="text"
                  value={newQuizName}
                  onChange={(e) => setNewQuizName(e.target.value)}
                  placeholder="Enter quiz name..."
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleCreateQuiz}
                  disabled={deckLoading || !newQuizName.trim() || !selectedDeckForNewQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create</span>
                </button>
                <button
                  onClick={() => {
                    setIsCreatingQuiz(false)
                    setNewQuizName('')
                    setSelectedDeckForNewQuiz('')
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decks List */}
      <div className="space-y-3">
        {savedDecks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No decks yet</h3>
            <p className="text-slate-600 mb-4">Create your first deck to start organizing your learning materials</p>
            <button
              onClick={() => setIsCreatingDeck(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create First Deck</span>
            </button>
          </div>
        ) : (
          savedDecks.map(deck => (
            <div key={deck.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              {/* Deck Header */}
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleDeckExpansion(deck.id)}
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <svg
                      className={cx(
                        "w-5 h-5 text-slate-500 transition-transform duration-200",
                        expandedDecks.has(deck.id) ? "rotate-90" : ""
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  
                  {editingDeck === deck.id ? (
                    <input
                      type="text"
                      defaultValue={deck.name}
                      onBlur={(e) => handleUpdateDeck(deck.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateDeck(deck.id, e.target.value)
                        } else if (e.key === 'Escape') {
                          setEditingDeck(null)
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <button
                      onClick={() => toggleDeckExpansion(deck.id)}
                      className="flex items-center gap-3 flex-1 text-left group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">{deck.name}</div>
                        <div className="text-xs text-slate-500">
                          {deckQuizzes.filter(quiz => quiz.deckId === deck.id).length} quiz{deckQuizzes.filter(quiz => quiz.deckId === deck.id).length === 1 ? '' : 'zes'}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {editingDeck !== deck.id && (
                    <button
                      onClick={() => setEditingDeck(deck.id)}
                      className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Rename deck"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors group"
                    title="Delete deck"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quizzes within deck */}
              {expandedDecks.has(deck.id) && (
                <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                  {deckQuizzes.filter(quiz => quiz.deckId === deck.id).length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">No quizzes yet</h4>
                      <p className="text-xs text-slate-600 mb-3">Create your first quiz to start adding questions</p>
                      <button
                        onClick={() => {
                          setSelectedDeckForNewQuiz(deck.id)
                          setIsCreatingQuiz(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create First Quiz</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {deckQuizzes
                        .filter(quiz => quiz.deckId === deck.id)
                        .map(quiz => (
                          <div
                            key={quiz.id}
                            className={cx(
                              "group flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                              currentQuizId === quiz.id 
                                ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 shadow-sm" 
                                : "bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm hover:bg-teal-50/50"
                            )}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              
                              {editingQuiz === quiz.id ? (
                                <input
                                  type="text"
                                  defaultValue={quiz.name}
                                  onBlur={(e) => handleUpdateQuiz(quiz.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateQuiz(quiz.id, e.target.value)
                                    } else if (e.key === 'Escape') {
                                      setEditingQuiz(null)
                                    }
                                  }}
                                  className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <button
                                  onClick={() => onLoadQuiz(quiz.id)}
                                  className="flex-1 text-left group"
                                >
                                  <div className="font-medium text-slate-900 group-hover:text-teal-700 transition-colors">{quiz.name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Click to edit questions</div>
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {editingQuiz !== quiz.id && (
                                <>
                                  <button
                                    onClick={() => setEditingQuiz(quiz.id)}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                    title="Rename quiz"
                                  >
                                    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                    title="Delete quiz"
                                  >
                                    <svg className="w-3 h-3 text-slate-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
