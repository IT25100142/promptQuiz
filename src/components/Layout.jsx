import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import AiPromptBuilderModal from '../features/ai/AiPromptBuilderModal.jsx';

export default function Layout({ children }) {
  const library = useQuizLibrary();
  const shell = useQuizShell();
  const deckCount = library.savedDecks?.length || 0;

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      {/* Top persistent navigation bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900/5 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link 
              to="/decks" 
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition"
            >
              <span>PromptQuiz</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1.5">
              <Link 
                to="/decks" 
                className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                My Library
              </Link>
              <Link 
                to="/create-deck" 
                className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                Create Deck
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Decks in memory indicator */}
            <div className="flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/5 px-3 py-1 text-[11px] font-medium tracking-tight text-slate-600 dark:text-slate-350 border border-slate-900/5 dark:border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              {deckCount} {deckCount === 1 ? 'Deck' : 'Decks'} Stored
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-900/5 dark:border-white/5 bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M17.66 6.34l-1.41 1.41" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => shell.setShowAIPromptBuilder(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900/5 dark:border-white/5 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              AI Prompt Builder
            </button>

            <Link
              to="/create-deck"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              New Deck
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container Slot */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Global Toast Notification System */}
      {shell.toast && (
        <div 
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl border animate-slide-in-up transition-all duration-300 max-w-sm ${
            shell.toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <span className="text-lg">
            {shell.toast.type === 'error' ? '⚠️' : '✅'}
          </span>
          <div className="flex-1 text-sm font-semibold leading-snug">
            {shell.toast.message}
          </div>
        </div>
      )}
      {/* AI Prompt Builder Modal Helper */}
      <AiPromptBuilderModal />
    </div>
  );
}
