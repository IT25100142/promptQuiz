import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizLibrary, useQuizSession, useQuizShell } from '../contexts/QuizContext.jsx';
import { exportLibrarySnapshot, getQuestionsByQuizId, getQuizzesByDeckId } from '../shared/services/indexedDB.js';

export default function CommandHUD({ isOpen, onClose, toggleTheme }) {
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const session = useQuizSession();
  const shell = useQuizShell();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatItems, setFlatItems] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const loadData = async () => {
        const items = [];
        const decks = library.savedDecks || [];
        for (const deck of decks) {
          items.push({ type: 'deck', id: deck.id, title: deck.name, description: deck.description || 'Deck Collection' });
          try {
            const quizzes = await getQuizzesByDeckId(deck.id);
            for (const quiz of quizzes) {
              items.push({ type: 'quiz', id: quiz.id, deckId: deck.id, title: quiz.name, description: 'Quiz Interval' });
            }
          } catch (err) {
            console.error(err);
          }
        }
        setFlatItems(items);
      };
      loadData();
    }
  }, [isOpen, library.savedDecks]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    if (query.startsWith('>')) {
      const qAction = query.replace('>', '').trim().toLowerCase();
      const actions = [
        { type: 'action', action: 'zen', title: 'toggle focus mode', description: 'Switches the quiz view into a quieter study layout.' },
        { type: 'action', action: 'export', title: 'export library', description: 'Downloads a JSON backup of your local library.' },
        { type: 'action', action: 'theme', title: 'toggle theme', description: 'Switches between light and dark mode.' },
        { type: 'action', action: 'clear', title: 'clear session', description: 'Clears the active quiz session and editor input.' },
      ];
      return actions.filter(a => a.title.toLowerCase().includes(qAction));
    } else if (q) {
      return flatItems.filter(item => item.title.toLowerCase().includes(q));
    } else {
      return flatItems;
    }
  }, [query, flatItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleExportLibrary = async () => {
    try {
      const snapshot = await exportLibrarySnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptquiz-library-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      shell.showToast('Library exported.', 'success');
    } catch (e) {
      shell.showToast('Export failed.', 'error');
    }
  };

  const handleClearRegistry = () => {
    if (session.restartSession) session.restartSession();
    if (library.clearQuiz) library.clearQuiz();
    shell.showToast('Registry cleared safely.', 'success');
  };

  const executeItem = async (item) => {
    if (!item) return;
    
    if (item.type === 'action') {
      switch (item.action) {
        case 'zen':
          const current = localStorage.getItem('promptquiz_zen_mode');
          // useLocalStorage stores json, so 'true' or 'false'
          const nextVal = current === 'true' ? false : true;
          localStorage.setItem('promptquiz_zen_mode', JSON.stringify(nextVal));
          // Provide a visual toast to indicate successful operation since cross-tab storage events aren't completely reliable for same-tab updates
          shell.showToast('Focus mode updated.', 'success');
          break;
        case 'export':
          await handleExportLibrary();
          break;
        case 'theme':
          if (toggleTheme) toggleTheme();
          break;
        case 'clear':
          handleClearRegistry();
          break;
      }
      onClose();
    } else if (item.type === 'deck') {
      navigate('/decks');
      onClose();
    } else if (item.type === 'quiz') {
      try {
        const questions = await getQuestionsByQuizId(item.id);
        if (questions.length > 0) {
          session.setQuiz(questions);
          session.setAnswers(Array(questions.length).fill(null));
          session.setIdx(0);
          session.setIsReviewMode(false);
          session.setIncorrectQuestions([]);
          navigate('/quiz');
        } else {
          shell.showToast('This quiz is empty.', 'error');
        }
      } catch (err) {
        console.error(err);
      }
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, Math.max(0, filteredItems.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeItem(filteredItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-xl bg-slate-950/80 transition-all animate-fade-in">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div 
        className="w-full max-w-2xl premium-glass bg-technical-grid rounded-2xl overflow-hidden shadow-2xl relative animate-slide-in-up"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="absolute top-4 left-4 text-white/20 font-mono text-[10px] leading-none pointer-events-none">+</div>
        <div className="absolute top-4 right-4 text-white/20 font-mono text-[10px] leading-none pointer-events-none">+</div>
        <div className="absolute bottom-4 left-4 text-white/20 font-mono text-[10px] leading-none pointer-events-none">+</div>
        <div className="absolute bottom-4 right-4 text-white/20 font-mono text-[10px] leading-none pointer-events-none">+</div>

        <div className="p-4 border-b border-white/10 flex items-center gap-3 relative z-10">
          <span className="text-indigo-400 font-mono font-bold animate-pulse">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="FILTER_QUERY > _"
            className="flex-1 bg-transparent text-white font-mono outline-none placeholder:text-white/30 text-sm tracking-wide"
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2 relative z-10">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-white/40 font-mono text-[10px] uppercase tracking-widest">No matching nodes</div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => executeItem(item)}
                className={`w-full px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center transition-colors font-mono mb-1 text-left ${
                  selectedIndex === idx ? 'bg-indigo-600/30 border border-indigo-500/50 text-white shadow-md scale-[1.01]' : 'text-white/60 hover:bg-white/5 border border-transparent hover:text-white/90 scale-100'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold tracking-wide">{item.title}</div>
                  <div className="text-[9px] opacity-60 uppercase tracking-widest text-indigo-200">{item.description}</div>
                </div>
                <div className="text-[8px] uppercase tracking-wider opacity-60 border border-white/20 bg-black/20 px-2 py-0.5 rounded-full">
                  {item.type}
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-3 border-t border-white/10 flex justify-between items-center text-[9px] font-mono text-white/40 uppercase bg-black/40 relative z-10 tracking-widest">
          <span>{filteredItems.length} items</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><strong className="text-white/80 bg-white/10 px-1 py-0.5 rounded">↑↓</strong> NAVIGATE</span>
            <span className="flex items-center gap-1.5"><strong className="text-white/80 bg-white/10 px-1 py-0.5 rounded">↵</strong> EXECUTE</span>
            <span className="flex items-center gap-1.5"><strong className="text-white/80 bg-white/10 px-1 py-0.5 rounded">ESC</strong> ABORT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
