import { useState, useEffect } from 'react';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import { useKeyPress } from '../shared/utils/useKeyPress.js';

export default function CreateQuizModal({ isOpen, deckId, onClose, onSuccess }) {
  const library = useQuizLibrary();
  const shell = useQuizShell();

  const [quizName, setQuizName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useKeyPress({
    Escape: () => {
      if (!loading) onClose();
    },
  }, !isOpen);

  useEffect(() => {
    if (!isOpen) {
      setQuizName('');
      setDescription('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deckId) {
      shell.showToast('No deck selected.', 'error');
      return;
    }

    if (!quizName.trim()) {
      shell.showToast('Quiz name is required.', 'error');
      return;
    }

    setLoading(true);

    try {
      await library.createNewQuiz(deckId, quizName.trim(), description.trim());
      shell.showToast(`Quiz "${quizName.trim()}" created.`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to create quiz:', err);
      shell.showToast(err.message || 'Failed to create quiz.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !deckId) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-quiz-title"
    >
      <div className="modal-panel rounded-3xl shadow-premium max-w-md w-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-900/5 dark:border-white/5 p-6 sm:p-7">
          <div>
            <h2
              id="create-quiz-title"
              className="font-serif text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white"
            >
              New Quiz
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Add an empty quiz shell to this folder. Import questions later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="btn-ghost inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-500 dark:text-slate-400 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          <div>
            <label htmlFor="quizName" className="label-premium block mb-2">
              Quiz Name
            </label>
            <input
              id="quizName"
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Chapter 1 Review, Vocabulary Set A..."
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="quizDescription" className="label-premium block mb-2">
              Description{' '}
              <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                (optional)
              </span>
            </label>
            <textarea
              id="quizDescription"
              rows={2}
              disabled={loading}
              placeholder="Brief summary of what this quiz covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl input-premium text-sm font-semibold text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/5 dark:border-white/5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="btn-ghost rounded-xl px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary rounded-xl px-6 py-2.5 text-xs shadow-glow-indigo cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
