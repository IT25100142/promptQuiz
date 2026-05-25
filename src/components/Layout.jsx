import { Link, Outlet } from 'react-router-dom';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import AiPromptBuilderModal from '../features/ai/AiPromptBuilderModal.jsx';

export default function Layout({ children }) {
  const library = useQuizLibrary();
  const shell = useQuizShell();
  const deckCount = library.savedDecks?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top persistent navigation bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link 
              to="/decks" 
              className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-indigo-600 hover:opacity-90 transition"
            >
              <span>PromptQuiz 🧠⚡</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/decks" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                My Library
              </Link>
              <Link 
                to="/create-deck" 
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Create Deck
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Decks in memory indicator */}
            <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {deckCount} {deckCount === 1 ? 'Deck' : 'Decks'} Stored
            </div>
            
            <button
              type="button"
              onClick={() => shell.setShowAIPromptBuilder(true)}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-colors cursor-pointer"
            >
              AI Prompt Builder 🤖
            </button>

            <Link
              to="/create-deck"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
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
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
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
