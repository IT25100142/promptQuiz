import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx';
import {
  exportLibrarySnapshot,
  importLibrarySnapshot,
  getAllDecks,
} from '../shared/services/indexedDB.js';

export default function DecksPage() {
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const session = useQuizSession();
  const shell = useQuizShell();
  const importInputRef = useRef(null);

  const [quizzesMap, setQuizzesMap] = useState({});
  const [questionsCountMap, setQuestionsCountMap] = useState({});
  const [deckLoading, setDeckLoading] = useState(false);

  // States for adding a new quiz inline
  const [activeDeckForNewQuiz, setActiveDeckForNewQuiz] = useState(null);
  const [newQuizName, setNewQuizName] = useState('');

  // Fetch quizzes for each deck
  const fetchQuizzes = async (deckId) => {
    try {
      const list = await library.getQuizzesByDeck(deckId);
      setQuizzesMap(prev => ({ ...prev, [deckId]: list }));
      
      // Fetch question count for each quiz in this deck
      for (const q of list) {
        const questions = await library.getQuestionsByQuiz(q.id);
        setQuestionsCountMap(prev => ({ ...prev, [q.id]: questions.length }));
      }
    } catch (e) {
      console.error(`Failed to load quizzes for deck ${deckId}:`, e);
    }
  };

  useEffect(() => {
    if (library.savedDecks?.length > 0) {
      library.savedDecks.forEach(deck => {
        fetchQuizzes(deck.id);
      });
    }
  }, [library.savedDecks]);

  const handleStudyQuiz = async (quizId, deckId) => {
    setDeckLoading(true);
    try {
      const questions = await library.getQuestionsByQuiz(quizId);
      if (questions.length === 0) {
        shell.showToast('This quiz has no questions yet.', 'error');
        return;
      }
      session.setQuiz(questions);
      session.setAnswers(Array(questions.length).fill(null));
      session.setIdx(0);
      session.setIsReviewMode(false);
      session.setIncorrectQuestions([]);
      navigate('/quiz');
    } catch (err) {
      console.error(err);
      shell.showToast('Failed to load quiz.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!window.confirm('Are you sure you want to delete this deck and all of its quizzes/questions?')) {
      return;
    }
    setDeckLoading(true);
    try {
      await library.deleteDeck(deckId);
      shell.showToast('Deck deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      shell.showToast('Failed to delete deck.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleCreateQuiz = async (deckId) => {
    if (!newQuizName.trim()) {
      shell.showToast('Please enter a quiz name', 'error');
      return;
    }
    setDeckLoading(true);
    try {
      await library.addQuiz(deckId, newQuizName.trim(), 'Quiz description');
      setNewQuizName('');
      setActiveDeckForNewQuiz(null);
      shell.showToast('Quiz created successfully', 'success');
      await fetchQuizzes(deckId);
    } catch (err) {
      console.error(err);
      shell.showToast('Failed to create quiz.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleExportLibrary = async () => {
    setDeckLoading(true);
    try {
      const snapshot = await exportLibrarySnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptquiz-library-${new Date().toISOString().slice(0, 10)}.json`;
      a.rel = 'noopener';
      a.click();
      URL.revokeObjectURL(url);
      shell.showToast('Library exported to your downloads folder.', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      shell.showToast(error?.message || 'Failed to export library.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleImportLibraryPick = () => {
    importInputRef.current?.click();
  };

  const handleImportLibraryFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!window.confirm('Import will replace your entire local library in this browser. Continue?')) {
      return;
    }

    setDeckLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await importLibrarySnapshot(json, { mode: 'replace' });
      
      // Update context state
      const decks = await getAllDecks();
      library.setSavedDecks(decks);
      library.clearQuiz();
      session.setIsReviewMode(false);
      
      shell.showToast(`Library imported successfully (${decks.length} decks).`, 'success');
    } catch (error) {
      console.error('Import failed:', error);
      shell.showToast(error?.message || 'Failed to import library.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const hasDecks = library.savedDecks && library.savedDecks.length > 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Study Library</h1>
          <p className="text-slate-500 mt-1">Manage your active recall card decks and study quizzes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Export library
          </button>
          <button
            type="button"
            onClick={handleImportLibraryPick}
            disabled={deckLoading}
            className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            Import library
          </button>
          <button
            type="button"
            onClick={() => navigate('/create-deck')}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Create New Deck
          </button>
        </div>
      </div>

      {/* Main decks grid */}
      {hasDecks ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.savedDecks.map(deck => {
            const quizzes = quizzesMap[deck.id] || [];
            return (
              <div 
                key={deck.id} 
                className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                {/* Header card details */}
                <div className="p-6 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{deck.name}</h2>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors text-xs font-semibold p-1"
                      title="Delete deck safely"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{deck.description || 'No description provided.'}</p>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-6">
                    Created: {new Date(deck.date).toLocaleDateString()}
                  </span>

                  {/* Quizzes Sub-list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quizzes</h3>
                    {quizzes.length > 0 ? (
                      <div className="space-y-2">
                        {quizzes.map(quiz => {
                          const count = questionsCountMap[quiz.id] || 0;
                          return (
                            <button
                              key={quiz.id}
                              type="button"
                              onClick={() => handleStudyQuiz(quiz.id, deck.id)}
                              className="w-full flex items-center justify-between text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition group"
                            >
                              <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-900 transition-colors truncate pr-2">
                                📝 {quiz.name}
                              </span>
                              <span className="shrink-0 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                {count} {count === 1 ? 'item' : 'items'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">No quizzes in this deck yet.</p>
                    )}
                  </div>
                </div>

                {/* Inline Quiz Creation Panel */}
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                  {activeDeckForNewQuiz === deck.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Quiz Name..."
                        value={newQuizName}
                        onChange={(e) => setNewQuizName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeckForNewQuiz(null);
                            setNewQuizName('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateQuiz(deck.id)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          Save Quiz
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveDeckForNewQuiz(deck.id)}
                      className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-500 py-1"
                    >
                      + Add New Quiz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Clean empty state card */
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-white shadow-sm mt-4">
          <span className="text-5xl mb-4 animate-bounce">📚</span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Your Library is Empty</h2>
          <p className="text-slate-500 max-w-md mt-2 mb-8">
            Create folder decks to organize active recall quizzes, or paste raw study notes to build tests instantly.
          </p>
          <button
            type="button"
            onClick={() => navigate('/create-deck')}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 text-base font-bold shadow-lg shadow-indigo-100 transition-all duration-200 scale-105 hover:scale-110"
          >
            Create Your First Deck
          </button>
        </div>
      )}
    </div>
  );
}
