import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import AiPromptBuilderModal from '../features/ai/AiPromptBuilderModal.jsx';
import CommandHUD from './CommandHUD.jsx';
import RouteErrorBoundary from './RouteErrorBoundary.jsx';

export default function Layout({ children }) {
  const library = useQuizLibrary();
  const shell = useQuizShell();
  const deckCount = library.savedDecks?.length || 0;
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [headerHovered, setHeaderHovered] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [isHudOpen, setIsHudOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsHudOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (shell.toast) {
      const timer = setTimeout(() => {
        if (shell.setAppNotice) {
          shell.setAppNotice(null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shell.toast, shell]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="relative min-h-screen bg-premium-mesh flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/60 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 overflow-x-hidden">
      {/* Ambient background orbs */}
      <div className="ambient-orb w-[480px] h-[480px] -top-32 -left-32 bg-indigo-400/30 dark:bg-indigo-600/20" aria-hidden="true" />
      <div className="ambient-orb w-[360px] h-[360px] top-1/3 -right-24 bg-violet-400/20 dark:bg-violet-600/15" aria-hidden="true" style={{ animationDelay: '-4s' }} />
      <div className="ambient-orb w-[280px] h-[280px] bottom-0 left-1/4 bg-rose-300/15 dark:bg-rose-600/10" aria-hidden="true" style={{ animationDelay: '-8s' }} />

      {/* Top persistent navigation bar */}
      <div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8">
        <header
          className={`mx-auto max-w-7xl h-14 rounded-full glass-nav px-6 sm:px-8 flex items-center justify-between transition-all duration-300 ${headerHovered ? 'glass-nav-hover' : ''}`}
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
        >
          <div className="flex items-center gap-6">
            <Link
              to="/decks"
              className="group flex items-center gap-2.5 text-sm font-bold tracking-widest uppercase font-mono text-slate-900 dark:text-white transition-all duration-200 hover:opacity-90"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-black shadow-glow-indigo transition-transform duration-200 group-hover:scale-105">
                PQ
              </span>
              <span className="hidden sm:inline bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                PromptQuiz
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/decks"
                className={`relative px-3 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-200 ${
                  isActive('/decks')
                    ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-500/10 dark:bg-indigo-500/15'
                    : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                }`}
              >
                My Library
              </Link>
              <Link
                to="/create-deck"
                className={`relative px-3 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-200 ${
                  isActive('/create-deck')
                    ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-500/10 dark:bg-indigo-500/15'
                    : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                }`}
              >
                Create Deck
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Decks in memory indicator */}
            <div className="pill-badge flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-glow-pulse absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              {deckCount} Stored
            </div>

            {/* HUD Indicator */}
            <button
              type="button"
              onClick={() => setIsHudOpen(true)}
              className="pill-badge hidden sm:flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Command HUD"
            >
              <span>HUD</span>
              <kbd className="font-sans font-bold opacity-70 text-[9px] px-1.5 py-0.5 rounded bg-slate-900/5 dark:bg-white/10">⌘K</kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full btn-ghost text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M17.66 6.34l-1.41 1.41" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => shell.setShowAIPromptBuilder(true)}
              className="btn-ghost inline-flex items-center justify-center rounded-full px-3 sm:px-4 py-2 text-xs font-mono tracking-wider uppercase text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              AI Builder
            </button>

            <Link
              to="/create-deck"
              className="btn-primary inline-flex items-center justify-center rounded-full px-4 sm:px-5 py-2 text-xs font-mono tracking-wider shadow-glow-indigo"
            >
              New Deck
            </Link>
          </div>
        </header>
      </div>

      {/* Main Container Slot */}
      <main className="relative flex-1 w-full max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16 py-8 flex flex-col animate-fade-in">
        <RouteErrorBoundary>
          {children || <Outlet />}
        </RouteErrorBoundary>
      </main>

      {/* Global Toast Notification System */}
      {shell.toast && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 toast-glass border animate-slide-in-up transition-all duration-300 max-w-sm ${
            shell.toast.type === 'error'
              ? 'bg-rose-50/90 dark:bg-rose-950/75 border-rose-200/80 dark:border-rose-800/50 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50/90 dark:bg-emerald-950/75 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 dark:bg-black/20 text-base shrink-0">
            {shell.toast.type === 'error' ? '⚠️' : '✅'}
          </span>
          <div className="flex-1 text-sm font-semibold leading-snug">
            {shell.toast.message}
          </div>
        </div>
      )}
      {/* AI Prompt Builder Modal Helper */}
      <AiPromptBuilderModal />

      {/* Omni-Command HUD Modal */}
      <CommandHUD isOpen={isHudOpen} onClose={() => setIsHudOpen(false)} toggleTheme={toggleTheme} />
    </div>
  );
}
