import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizSession } from '../contexts/QuizContext.jsx';

export default function ResultsPage() {
  const navigate = useNavigate();
  const session = useQuizSession();

  const { quiz, score, restartSession } = session;

  const accuracy = useMemo(() => {
    if (!quiz || quiz.length === 0) return 0;
    return Math.round((score / quiz.length) * 100);
  }, [score, quiz]);

  const typeCounts = useMemo(() => {
    const counts = {};
    if (!quiz || quiz.length === 0) return counts;
    quiz.forEach((q) => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  }, [quiz]);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm">
        <span className="text-5xl mb-4" aria-hidden="true">!</span>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">No Quiz Results</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
          You haven't completed any quiz sessions yet. Go back to your library to start studying.
        </p>
        <button
          type="button"
          onClick={() => navigate('/decks')}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-sm font-bold shadow-md transition"
        >
          Go to Library
        </button>
      </div>
    );
  }

  const handleRestart = () => {
    restartSession();
    navigate('/quiz');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center py-6">
      <div className="text-center mb-8 animate-fade-in">
        <span className="text-6xl" aria-hidden="true">Done</span>
        <h1 className="font-serif text-5xl sm:text-6xl tracking-tight text-slate-900 dark:text-white mt-4 font-light">Quiz Completed!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl mt-2 font-mono uppercase tracking-widest">Excellent job finishing this recall practice block.</p>
      </div>

      {/* Accuracy & Score Card */}
      <div className="relative premium-glass bg-technical-grid rounded-3xl p-6 sm:p-8 mb-8 animate-slide-in-up transition-colors overflow-hidden">
        {/* Precision Crosshairs */}
        <div className="absolute top-4 left-4 text-slate-400/30 dark:text-slate-500/30 text-[10px] font-mono leading-none pointer-events-none">+</div>
        <div className="absolute top-4 right-4 text-slate-400/30 dark:text-slate-500/30 text-[10px] font-mono leading-none pointer-events-none">+</div>
        <div className="absolute bottom-4 left-4 text-slate-400/30 dark:text-slate-500/30 text-[10px] font-mono leading-none pointer-events-none">+</div>
        <div className="absolute bottom-4 right-4 text-slate-400/30 dark:text-slate-500/30 text-[10px] font-mono leading-none pointer-events-none">+</div>

        <div className="space-y-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
            <div className="text-center">
              <span className="text-xs font-mono uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">Score Accuracy</span>
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-slate-900 dark:border-white text-slate-900 dark:text-slate-100 font-extrabold text-3xl shadow-sm">
                {accuracy}%
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs font-mono uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">Retention Summary</span>
              <div className="text-slate-900 dark:text-slate-100 font-extrabold text-5xl">
                {score} <span className="text-slate-400 dark:text-slate-500 text-2xl">/ {quiz.length}</span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold mt-2 uppercase tracking-wide">correct answers</p>
            </div>
          </div>

          {/* Dynamic Card Type breakdown list */}
          <div className="border-t border-slate-900/5 dark:border-white/5 pt-6">
            <h3 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Question Type Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 border border-slate-900/5 dark:border-white/5 p-3 rounded-xl">
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 uppercase">{type.replace('-', ' ')}</span>
                  <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-mono font-extrabold px-2 py-0.5 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session Actions Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/decks')}
          className="flex-1 py-3.5 text-sm font-bold tracking-wide rounded-2xl active:scale-[0.97] transition-all border border-slate-900/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 shadow-sm uppercase"
        >
          Return to Library
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="flex-1 py-3.5 text-sm font-bold tracking-wide rounded-2xl active:scale-[0.97] transition-all bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-md uppercase"
        >
          Restart Quiz Session
        </button>
      </div>
    </div>
  );
}
