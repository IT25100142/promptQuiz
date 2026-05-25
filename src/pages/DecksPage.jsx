import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx';
import {
  exportLibrarySnapshot,
  importLibrarySnapshot,
  getAllDecks,
  getQuizzesByDeckId,
  getQuestionsByQuizId,
  getQuestionsCountByQuizId,
  deleteDeck,
  createQuiz,
  getRecentReviewTimestamps
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
      const list = await getQuizzesByDeckId(deckId);
      setQuizzesMap(prev => ({ ...prev, [deckId]: list }));
      
      // Fetch question count for each quiz in this deck
      for (const q of list) {
        const count = await getQuestionsCountByQuizId(q.id);
        setQuestionsCountMap(prev => ({ ...prev, [q.id]: count }));
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

  const [matrixData, setMatrixData] = useState(() => 
    Array.from({ length: 7 }, () => Array(24).fill(0))
  );

  useEffect(() => {
    async function loadMatrix() {
      try {
        const timestamps = await getRecentReviewTimestamps(7);
        const newMatrix = Array.from({ length: 7 }, () => Array(24).fill(0));
        
        const now = new Date();
        now.setHours(0, 0, 0, 0); // start of today
        
        timestamps.forEach(ts => {
          const date = new Date(ts);
          const dayDiff = Math.floor((now - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / (1000 * 60 * 60 * 24));
          
          if (dayDiff >= 0 && dayDiff < 7) {
            // Row 6 = today, Row 0 = 6 days ago
            const rowIndex = 6 - dayDiff; 
            const hourIndex = date.getHours();
            newMatrix[rowIndex][hourIndex] += 1;
          }
        });

        // Cap intensities to 4 for styling classes
        const finalMatrix = newMatrix.map(row => 
          row.map(count => Math.min(4, count))
        );
        
        setMatrixData(finalMatrix);
      } catch (err) {
        console.error('Failed to load matrix data', err);
      }
    }
    
    loadMatrix();
  }, []);

  const handleStudyQuiz = async (quizId, deckId) => {
    setDeckLoading(true);
    try {
      const questions = await getQuestionsByQuizId(quizId);
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
      await deleteDeck(deckId);
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
      await createQuiz(deckId, newQuizName.trim(), 'Quiz description');
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

  const heroDeck = hasDecks ? library.savedDecks[0] : null;
  const heroQuizzes = heroDeck ? (quizzesMap[heroDeck.id] || []) : [];
  const remainingDecks = hasDecks ? library.savedDecks.slice(1) : [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12">
        <div>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-white font-light">My Study Library</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl mt-2 font-mono uppercase tracking-widest">Active recalling & card deck indexes.</p>
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
            aria-label="Export library"
            className="inline-flex items-center justify-center rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-900/5 dark:hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleImportLibraryPick}
            disabled={deckLoading}
            aria-label="Import library"
            className="inline-flex items-center justify-center rounded-xl border border-amber-500/15 dark:border-amber-500/15 bg-amber-50/20 dark:bg-amber-955/10 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-amber-800 dark:text-amber-300 shadow-sm hover:bg-amber-100/20 dark:hover:bg-amber-900/10 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => navigate('/create-deck')}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-white dark:text-slate-955 shadow-md transition-all cursor-pointer active:scale-[0.98]"
          >
            New Deck
          </button>
        </div>
      </div>

      {/* Bento Layout Canvas */}
      {hasDecks ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Hero Stage: Master active deck */}
          <div className="lg:col-span-2 premium-glass rounded-3xl p-8 md:p-12 min-h-[420px] transition-all duration-300 relative group bg-technical-grid overflow-hidden">
            {/* Corner Crosshairs */}
            <div className="absolute top-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none">+</div>
            <div className="absolute top-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none">+</div>
            <div className="absolute bottom-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none">+</div>
            <div className="absolute bottom-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none">+</div>

            {/* Ambient subtle glow overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-full relative z-10">
              {/* Left Column: Metadata and Title */}
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-600 dark:text-indigo-400 font-semibold border-b border-indigo-500/20 pb-0.5">Hero Collection</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeck(heroDeck.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors text-xs font-semibold p-1"
                    >
                      Delete
                    </button>
                  </div>
                  <h2 className="font-serif text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight mb-4">{heroDeck.name}</h2>
                  <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">{heroDeck.description || 'No description provided.'}</p>
                  
                  {/* Monospaced Metadata Analytics */}
                  <div className="flex flex-col gap-2 mb-8 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-900/5 dark:border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Total Cards</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{heroQuizzes.reduce((acc, q) => acc + (questionsCountMap[q.id] || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Avg Ease Factor</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">2.45</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Retention Health</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">DB Sync</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">ACTIVE_OK</span>
                    </div>
                  </div>
                </div>

                {/* Quizzes List */}
                <div className="border-t border-slate-900/5 dark:border-white/5 pt-6">
                  <h3 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quizzes / Intervals</h3>
                  {heroQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {heroQuizzes.map(quiz => {
                        const count = questionsCountMap[quiz.id] || 0;
                        return (
                          <button
                            key={quiz.id}
                            type="button"
                            onClick={() => handleStudyQuiz(quiz.id, heroDeck.id)}
                            className="w-full flex items-center justify-between text-left px-4 py-3 rounded-lg border-l-2 border-l-transparent hover:border-l-indigo-500 bg-slate-50/30 dark:bg-slate-950/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all duration-200 group active:scale-[0.98]"
                          >
                            <span className="text-[11px] font-mono tracking-wide text-slate-700 dark:text-slate-300 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate pr-2">
                              {quiz.name}
                            </span>
                            <span className="shrink-0 text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase">
                              [ {count} {count === 1 ? 'OBJ' : 'OBJS'} ]
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 dark:text-slate-500 font-mono">No intervals in this deck.</p>
                  )}

                  {/* Inline Quiz Creation for Hero */}
                  <div className="mt-4">
                    {activeDeckForNewQuiz === heroDeck.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="TERMINAL_INPUT..."
                          value={newQuizName}
                          onChange={(e) => setNewQuizName(e.target.value)}
                          className="w-full px-3 py-1.5 text-[10px] uppercase rounded-none border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDeckForNewQuiz(null);
                              setNewQuizName('');
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition uppercase"
                          >
                            Abort
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateQuiz(heroDeck.id)}
                            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase transition hover:bg-indigo-600 dark:hover:bg-indigo-400 active:scale-[0.98]"
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveDeckForNewQuiz(heroDeck.id)}
                        className="w-full text-left text-[9px] font-mono font-bold text-indigo-600/70 dark:text-indigo-400/70 hover:text-indigo-600 py-1 uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <span className="text-lg leading-none">+</span> APPEND_NEW_INTERVAL
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Review Velocity Matrix */}
              <div className="hidden xl:flex flex-col justify-end h-full">
                 <div className="border border-slate-900/10 dark:border-white/10 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/50 relative">
                   <div className="absolute top-2 right-2 text-slate-900/20 dark:text-white/20 font-mono text-[8px] select-none">MATRIX_V1</div>
                   <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6">Review Velocity</h3>
                   
                   <div className="flex gap-1.5 justify-end">
                     {matrixData[0].map((_, colIndex) => (
                       <div key={colIndex} className="flex flex-col gap-1.5">
                         {matrixData.map((row, rowIndex) => {
                           const intensity = row[colIndex];
                           const colors = {
                             0: 'bg-slate-200/50 dark:bg-slate-800/50',
                             1: 'bg-indigo-300 dark:bg-indigo-900/60',
                             2: 'bg-indigo-400 dark:bg-indigo-700',
                             3: 'bg-indigo-500 dark:bg-indigo-500',
                             4: 'bg-indigo-600 dark:bg-indigo-400',
                           };
                           return (
                             <div 
                               key={`${rowIndex}-${colIndex}`} 
                               className={`w-3 h-3 rounded-[2px] ${colors[intensity] || colors[0]} transition-all duration-300 hover:scale-125 hover:ring-1 hover:ring-indigo-400 hover:z-10 relative`}
                               title={`Reviews: ${intensity * 4}`}
                             />
                           );
                         })}
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-6 flex justify-between items-center text-[9px] font-mono text-slate-400">
                     <span>Less</span>
                     <div className="flex gap-1.5 items-center">
                       <div className="w-2.5 h-2.5 rounded-[1px] bg-slate-200/50 dark:bg-slate-800/50"></div>
                       <div className="w-2.5 h-2.5 rounded-[1px] bg-indigo-300 dark:bg-indigo-900/60"></div>
                       <div className="w-2.5 h-2.5 rounded-[1px] bg-indigo-400 dark:bg-indigo-700"></div>
                       <div className="w-2.5 h-2.5 rounded-[1px] bg-indigo-500 dark:bg-indigo-500"></div>
                       <div className="w-2.5 h-2.5 rounded-[1px] bg-indigo-600 dark:bg-indigo-400"></div>
                     </div>
                     <span>More</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Technical Cluster: Flanking remaining decks list */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-450 dark:text-slate-500 font-semibold">Technical Cluster</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">[{remainingDecks.length} RACKS]</span>
            </div>
            
            {remainingDecks.length > 0 ? (
              remainingDecks.map((deck, idx) => {
                const numberPrefix = String(idx + 2).padStart(2, '0');
                const quizzes = quizzesMap[deck.id] || [];
                return (
                  <div 
                    key={deck.id}
                    className="group flex flex-col bg-transparent border-y border-slate-900/5 dark:border-white/5 py-3 overflow-hidden max-h-12 hover:max-h-[500px] focus-within:max-h-[500px] transition-all duration-500 ease-in-out relative"
                  >
                    {/* Header line - like a server rack unit */}
                    <div className="flex items-center justify-between min-h-6 cursor-default">
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 opacity-50 font-bold">{numberPrefix}</span>
                        <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{deck.name}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" title="System Active"></div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="text-[9px] font-mono uppercase tracking-widest text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Wipe
                        </button>
                      </div>
                    </div>

                    {/* Expandable item views */}
                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 mt-4 space-y-4 pl-8 border-l border-slate-900/10 dark:border-white/10 ml-1.5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">{deck.description || 'N/A'}</p>
                      <div className="pt-2 space-y-1">
                        {quizzes.length > 0 ? (
                          quizzes.map(quiz => {
                            const count = questionsCountMap[quiz.id] || 0;
                            return (
                              <button
                                key={quiz.id}
                                type="button"
                                onClick={() => handleStudyQuiz(quiz.id, deck.id)}
                                className="w-full flex items-center justify-between text-left py-2 px-2 rounded hover:pl-3 border-l-2 border-l-transparent hover:border-l-indigo-500 transition-all text-xs font-mono group/btn hover:bg-slate-50 dark:hover:bg-slate-900/50 active:scale-[0.98]"
                              >
                                <span className="text-slate-600 dark:text-slate-400 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 truncate">
                                  &gt; {quiz.name}
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">[{count}]</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-[9px] text-slate-400 font-mono">EMPTY_STATE</p>
                        )}
                      </div>

                      {/* Inline Quiz Creation for sub-decks */}
                      <div className="pt-2">
                        {activeDeckForNewQuiz === deck.id ? (
                          <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-900/5 dark:border-white/5">
                            <input
                              type="text"
                              placeholder="INPUT..."
                              value={newQuizName}
                              onChange={(e) => setNewQuizName(e.target.value)}
                              className="w-full px-2 py-1 text-[9px] bg-transparent border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 uppercase"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDeckForNewQuiz(null);
                                  setNewQuizName('');
                                }}
                                className="px-3 py-1.5 rounded text-[10px] font-mono text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase active:scale-[0.98] transition"
                              >
                                Abort
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateQuiz(deck.id)}
                                className="px-3 py-1.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono font-bold uppercase hover:bg-indigo-600 dark:hover:bg-indigo-400 active:scale-[0.98] transition"
                              >
                                Exec
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveDeckForNewQuiz(deck.id)}
                            className="text-[9px] font-mono font-bold text-slate-400 hover:text-indigo-500 py-0.5 uppercase tracking-widest transition-colors"
                          >
                            + APPEND
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border border-slate-900/5 dark:border-white/5 p-4 rounded-xl border-dashed">
                <p className="text-[10px] italic text-slate-400 dark:text-slate-550 font-mono text-center">NO_SECONDARY_RACKS</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Editorial empty state minimalist layout */
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center max-w-3xl mx-auto mt-4">
          <span className="text-7xl mb-8 opacity-75">📚</span>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-slate-100 mt-2 mb-6 font-light">Your Library is Empty</h2>
          <p className="text-slate-550 dark:text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl font-sans">
            Create folder decks to organize active recall quizzes, or paste raw study notes to build tests instantly.
          </p>
          <button
            type="button"
            onClick={() => navigate('/create-deck')}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 px-10 py-4 text-lg font-bold tracking-wide min-w-[280px] uppercase text-white dark:text-slate-950 shadow-md transition-all active:scale-[0.98]"
          >
            Create Your First Deck
          </button>
        </div>
      )}
    </div>
  );
}
