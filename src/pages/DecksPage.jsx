import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx';
import CreateFolderModal from '../components/CreateFolderModal.jsx';
import CreateQuizModal from '../components/CreateQuizModal.jsx';
import AddQuestionsModal from '../components/AddQuestionsModal.jsx';
import DeckQuizList from '../components/DeckQuizList.jsx';
import {
  exportLibrarySnapshot,
  importLibrarySnapshot,
  getAllDecks,
  getQuizzesByDeckId,
  getQuestionsByQuizId,
  getQuestionsCountByQuizId,
  deleteDeck,
  getRecentReviewTimestamps,
  getReviewStatsByDeckId
} from '../shared/services/indexedDB.js';

export default function DecksPage() {
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const session = useQuizSession();
  const shell = useQuizShell();
  const importInputRef = useRef(null);

  const [quizzesMap, setQuizzesMap] = useState({});
  const [questionsCountMap, setQuestionsCountMap] = useState({});
  const [reviewStatsMap, setReviewStatsMap] = useState({});
  const [deckLoading, setDeckLoading] = useState(false);

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [createQuizDeckId, setCreateQuizDeckId] = useState(null);
  const [addQuestionsTarget, setAddQuestionsTarget] = useState(null);

  // Fetch quizzes for each deck
  const fetchQuizzes = async (deckId) => {
    try {
      const list = await getQuizzesByDeckId(deckId);
      setQuizzesMap(prev => ({ ...prev, [deckId]: list }));
      const reviewStats = await getReviewStatsByDeckId(deckId);
      setReviewStatsMap(prev => ({ ...prev, [deckId]: reviewStats }));
      
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

        setMatrixData(newMatrix);
      } catch (err) {
        console.error('Failed to load matrix data', err);
      }
    }
    
    loadMatrix();
  }, []);

  const handleStudyQuiz = async (quizId, _deckId) => {
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
      const decks = await getAllDecks();
      library.setSavedDecks(decks);
      setQuizzesMap(prev => {
        const next = { ...prev };
        delete next[deckId];
        return next;
      });
      setReviewStatsMap(prev => {
        const next = { ...prev };
        delete next[deckId];
        return next;
      });
      shell.showToast('Deck deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      shell.showToast('Failed to delete deck.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleDeleteQuiz = async (deckId, quizId, quizName, questionCount) => {
    const cardLabel = questionCount === 1 ? 'question' : 'questions';
    const message = questionCount > 0
      ? `Delete "${quizName}" and all ${questionCount} ${cardLabel}? This cannot be undone.`
      : `Delete "${quizName}"? This cannot be undone.`;

    if (!window.confirm(message)) {
      return;
    }

    setDeckLoading(true);
    try {
      await library.deleteQuizById(quizId);
      setQuestionsCountMap(prev => {
        const next = { ...prev };
        delete next[quizId];
        return next;
      });
      await fetchQuizzes(deckId);
      shell.showToast('Quiz deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      shell.showToast('Failed to delete quiz.', 'error');
    } finally {
      setDeckLoading(false);
    }
  };

  const handleQuizCreated = async () => {
    if (createQuizDeckId) {
      await fetchQuizzes(createQuizDeckId);
    }
  };

  const handleQuestionsAppended = async (deckId) => {
    await fetchQuizzes(deckId);
  };

  const openAddQuestionsModal = (deckId, quizId, quizName) => {
    setAddQuestionsTarget({ deckId, quizId, quizName });
  };

  const renderAddQuizButton = (deckId, compact = false) => (
    <button
      type="button"
      disabled={deckLoading}
      onClick={() => setCreateQuizDeckId(deckId)}
      className={
        compact
          ? 'btn-ghost rounded-lg px-2.5 py-1 text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50'
          : 'btn-ghost w-full justify-start rounded-xl px-3 py-2 text-[10px] sm:text-xs font-mono text-indigo-600/80 dark:text-indigo-400/80 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 flex items-center gap-2'
      }
    >
      <span className={compact ? undefined : 'text-base leading-none'}>+</span> Add Quiz
    </button>
  );

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
  const heroReviewStats = heroDeck ? reviewStatsMap[heroDeck.id] : null;
  const remainingDecks = hasDecks ? library.savedDecks.slice(1) : [];
  const formatPercent = (value) => value === null || value === undefined
    ? 'Not enough data'
    : `${Math.round(value * 100)}%`;
  const formatEase = (value) => value === null || value === undefined
    ? 'Not enough data'
    : value.toFixed(2);

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
            className="inline-flex items-center justify-center rounded-xl border border-amber-500/15 dark:border-amber-500/15 bg-amber-50/20 dark:bg-amber-950/10 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-amber-800 dark:text-amber-300 shadow-sm hover:bg-amber-100/20 dark:hover:bg-amber-900/10 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => navigate('/create-deck')}
            disabled={deckLoading}
            aria-label="Bulk import questions"
            className="inline-flex items-center justify-center rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-900/5 dark:hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
          >
            Bulk Import
          </button>
          <button
            type="button"
            onClick={() => setShowCreateFolderModal(true)}
            disabled={deckLoading}
            aria-label="Create new folder"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 px-5 py-2.5 text-xs font-mono tracking-wider uppercase text-white dark:text-slate-950 shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            New Folder
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
                      className="btn-danger-ghost rounded-lg px-2.5 py-1 text-[10px] sm:text-xs"
                    >
                      Delete
                    </button>
                  </div>
                  <h2 className="font-serif text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight mb-4">{heroDeck.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">{heroDeck.description || 'No description provided.'}</p>
                  
                  {/* Monospaced Metadata Analytics */}
                  <div className="flex flex-col gap-2 mb-8 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-900/5 dark:border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Total Cards</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{heroQuizzes.reduce((acc, q) => acc + (questionsCountMap[q.id] || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Avg Ease Factor</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatEase(heroReviewStats?.avgEaseFactor)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Retention Health</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatPercent(heroReviewStats?.retentionHealth)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-widest">Due Reviews</span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">{heroReviewStats?.dueCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Quizzes List */}
                <div className="border-t border-slate-900/5 dark:border-white/5 pt-6 animate-fade-in">
                  <h3 className="label-premium mb-4">Quizzes</h3>
                  <DeckQuizList
                    quizzes={heroQuizzes}
                    questionsCountMap={questionsCountMap}
                    variant="hero"
                    disabled={deckLoading}
                    onStudy={(quizId) => handleStudyQuiz(quizId, heroDeck.id)}
                    onAddQuestions={(quizId, quizName) =>
                      openAddQuestionsModal(heroDeck.id, quizId, quizName)
                    }
                    onDelete={(quizId, quizName, count) =>
                      handleDeleteQuiz(heroDeck.id, quizId, quizName, count)
                    }
                  />
                  <div className="mt-4">
                    {renderAddQuizButton(heroDeck.id)}
                  </div>
                </div>
              </div>

              {/* Right Column: Review Velocity Matrix */}
              <div className="hidden xl:flex flex-col justify-end h-full">
                 <div className="border border-slate-900/10 dark:border-white/10 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/50 relative">
                   <div className="absolute top-2 right-2 text-slate-900/20 dark:text-white/20 font-mono text-[8px] select-none">MATRIX_V1</div>
                   <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6">Review Velocity</h3>
                   
                   <div className="flex gap-1 overflow-x-auto justify-start pb-1 scrollbar-hide">
                     {matrixData[0].map((_, colIndex) => (
                       <div key={colIndex} className="flex flex-col gap-1">
                         {matrixData.map((row, rowIndex) => {
                           const intensity = row[colIndex];
                           const colorLevel = Math.min(4, intensity);
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
                               className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[2px] ${colors[colorLevel] || colors[0]} transition-all duration-300 hover:scale-125 hover:ring-1 hover:ring-indigo-400 hover:z-10 relative`}
                               title={`Reviews: ${intensity}`}
                             />
                           );
                         })}
                       </div>
                     ))}
                   </div>
                   
                   <div className="mt-4 flex justify-between items-center text-[9px] font-mono text-slate-500">
                     <span>Less</span>
                     <div className="flex gap-1 items-center">
                       <div className="w-2 h-2 rounded-[1px] bg-slate-200/50 dark:bg-slate-800/50"></div>
                       <div className="w-2 h-2 rounded-[1px] bg-indigo-300 dark:bg-indigo-900/60"></div>
                       <div className="w-2 h-2 rounded-[1px] bg-indigo-400 dark:bg-indigo-700"></div>
                       <div className="w-2 h-2 rounded-[1px] bg-indigo-500 dark:bg-indigo-500"></div>
                       <div className="w-2 h-2 rounded-[1px] bg-indigo-600 dark:bg-indigo-400"></div>
                     </div>
                     <span>More</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Technical Cluster: Flanking remaining decks list */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex justify-between items-center mb-4 border-b border-slate-900/10 dark:border-white/10 pb-2">
              <span className="text-xs font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 font-bold">Other Decks</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{remainingDecks.length} saved</span>
            </div>
            
            {remainingDecks.length > 0 ? (
              remainingDecks.map((deck, idx) => {
                const numberPrefix = String(idx + 2).padStart(2, '0');
                const quizzes = quizzesMap[deck.id] || [];
                return (
                  <div
                    key={deck.id}
                    className="group flex flex-col premium-glass subpixel-border rounded-xl overflow-hidden max-h-[3.25rem] hover:max-h-[520px] focus-within:max-h-[520px] transition-[max-height] duration-500 ease-in-out"
                  >
                    <div className="flex items-center justify-between px-4 py-3 min-h-[3.25rem] cursor-default shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 opacity-60 font-bold shrink-0">{numberPrefix}</span>
                        <h4 className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{deck.name}</h4>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" title="Ready" />
                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="btn-danger-ghost rounded-md px-2 py-0.5 text-[9px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="deck-expand-panel group-hover:deck-expand-panel-visible group-focus-within:deck-expand-panel-visible px-4 pb-4 space-y-4 border-t border-slate-900/5 dark:border-white/5 pt-4">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">{deck.description || 'N/A'}</p>
                      <DeckQuizList
                        quizzes={quizzes}
                        questionsCountMap={questionsCountMap}
                        variant="compact"
                        disabled={deckLoading}
                        onStudy={(quizId) => handleStudyQuiz(quizId, deck.id)}
                        onAddQuestions={(quizId, quizName) =>
                          openAddQuestionsModal(deck.id, quizId, quizName)
                        }
                        onDelete={(quizId, quizName, count) =>
                          handleDeleteQuiz(deck.id, quizId, quizName, count)
                        }
                      />
                      {renderAddQuizButton(deck.id, true)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="premium-glass subpixel-border p-6 rounded-xl border-dashed">
                <p className="text-xs italic text-slate-500 dark:text-slate-400 font-mono text-center">No other decks yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Editorial empty state minimalist layout */
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center max-w-3xl mx-auto mt-4">
          <span className="text-7xl mb-8 opacity-75">📚</span>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-slate-100 mt-2 mb-6 font-light">Your Library is Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl font-sans">
            Create an empty folder to organize quizzes, or bulk import questions to get started instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => setShowCreateFolderModal(true)}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 px-10 py-4 text-lg font-bold tracking-wide min-w-[280px] uppercase text-white dark:text-slate-950 shadow-md transition-all active:scale-[0.98]"
            >
              New Folder
            </button>
            <button
              type="button"
              onClick={() => navigate('/create-deck')}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-900/5 dark:hover:bg-white/5 px-10 py-4 text-lg font-bold tracking-wide min-w-[280px] uppercase text-slate-700 dark:text-slate-300 shadow-sm transition-all active:scale-[0.98]"
            >
              Bulk Import
            </button>
          </div>
        </div>
      )}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
      />
      <CreateQuizModal
        isOpen={createQuizDeckId !== null}
        deckId={createQuizDeckId}
        onClose={() => setCreateQuizDeckId(null)}
        onSuccess={handleQuizCreated}
      />
      <AddQuestionsModal
        isOpen={addQuestionsTarget !== null}
        deckId={addQuestionsTarget?.deckId ?? null}
        quizId={addQuestionsTarget?.quizId ?? null}
        quizName={addQuestionsTarget?.quizName ?? ''}
        onClose={() => setAddQuestionsTarget(null)}
        onSuccess={handleQuestionsAppended}
      />
    </div>
  );
}
