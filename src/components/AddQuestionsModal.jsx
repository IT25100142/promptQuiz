import { useEffect } from 'react';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import { useKeyPress } from '../shared/utils/useKeyPress.js';
import { useQuestionImport } from '../features/quiz/hooks/useQuestionImport.js';
import QuestionImportForm from './QuestionImportForm.jsx';

export default function AddQuestionsModal({
  isOpen,
  deckId,
  quizId,
  quizName,
  onClose,
  onSuccess,
}) {
  const library = useQuizLibrary();
  const shell = useQuizShell();
  const {
    rawText,
    setRawText,
    validationResult,
    isImporting,
    appendToQuiz,
    reset,
  } = useQuestionImport(library);

  useKeyPress({
    Escape: () => {
      if (!isImporting) onClose();
    },
  }, !isOpen);

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deckId || !quizId) {
      shell.showToast('No quiz selected.', 'error');
      return;
    }

    if (!validationResult?.ok) {
      shell.showToast(validationResult?.error || 'Please fix validation errors before importing.', 'error');
      return;
    }

    try {
      const { addedCount } = await appendToQuiz(quizId, deckId);
      shell.showToast(
        `Added ${addedCount} ${addedCount === 1 ? 'question' : 'questions'} to "${quizName}".`,
        'success',
      );
      onSuccess?.(deckId, quizId, addedCount);
      onClose();
    } catch (err) {
      console.error('Failed to append questions:', err);
      shell.showToast(err.message || 'Failed to import questions.', 'error');
    }
  };

  if (!isOpen || !deckId || !quizId) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-questions-title"
    >
      <div className="premium-glass modal-panel rounded-3xl shadow-premium max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-900/5 dark:border-white/5 p-6 sm:p-7 shrink-0">
          <div>
            <h2
              id="add-questions-title"
              className="font-serif text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white"
            >
              Add Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Append to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{quizName}</span>
              {' '}— new cards are added after existing ones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            aria-label="Close"
            className="btn-ghost inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-500 dark:text-slate-400 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1">
          <QuestionImportForm
            id="addQuestionsRawText"
            rawText={rawText}
            onRawTextChange={setRawText}
            validationResult={validationResult}
            disabled={isImporting}
            rows={10}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/5 dark:border-white/5">
            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="btn-ghost rounded-xl px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !validationResult?.ok}
              className="btn-primary rounded-xl px-6 py-2.5 text-xs shadow-glow-indigo cursor-pointer disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Append Questions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
