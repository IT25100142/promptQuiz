import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizSession } from '../contexts/QuizContext.jsx';

export default function ResultsPage() {
  const navigate = useNavigate();
  const session = useQuizSession();

  const { quiz, answers, score, restartSession } = session;

  const accuracy = useMemo(() => {
    if (!quiz || quiz.length === 0) return 0;
    return Math.round((score / quiz.length) * 100);
  }, [score, quiz]);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm">
        <span className="text-5xl mb-4">⚠️</span>
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

  // Count question types for card summary
  const typeCounts = useMemo(() => {
    const counts = {};
    quiz.forEach((q) => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  }, [quiz]);

  const handleRestart = () => {
    restartSession();
    navigate('/quiz');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center py-6">
      <div className="text-center mb-8 animate-fade-in">
        <span className="text-6xl">🎉</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-4">Quiz Completed!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Excellent job finishing this recall practice block.</p>
      </div>

      {/* Accuracy & Score Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 mb-8 animate-slide-in-up transition-colors">
        <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Score Accuracy</span>
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-indigo-500 text-slate-900 dark:text-slate-100 font-extrabold text-3xl shadow-sm">
              {accuracy}%
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Retention Summary</span>
            <div className="text-slate-900 dark:text-slate-100 font-extrabold text-5xl">
              {score} <span className="text-slate-400 dark:text-slate-500 text-2xl">/ {quiz.length}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 uppercase tracking-wide">correct answers</p>
          </div>
        </div>

        {/* Dynamic Card Type breakdown list */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-4">Question Type Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-350 capitalize">{type.replace('-', ' ')}</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Actions Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/decks')}
          className="flex-1 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-850 font-bold text-sm text-slate-700 dark:text-slate-300 shadow-sm transition"
        >
          Return to Library
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
        >
          Restart Quiz Session
        </button>
      </div>
    </div>
  );
}
