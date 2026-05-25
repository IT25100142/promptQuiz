import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';
import { parseRawInput } from '../shared/utils/parsers.js';
import { validateQuestionStructure } from '../shared/schemas/quizQuestions.js';

export default function CreateDeckPage() {
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const shell = useQuizShell();

  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deckName.trim()) {
      shell.showToast('Deck name is required.', 'error');
      return;
    }

    if (!rawText.trim()) {
      shell.showToast('Please paste or type study questions to populate the quiz.', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Ingest raw text and auto-detect format
      const parsedQuestions = parseRawInput(rawText);
      if (parsedQuestions.length === 0) {
        throw new Error('No valid questions found in pasted text format. Please check formatting guidelines.');
      }

      // 2. Validate questions structure via Zod schema union
      const validation = validateQuestionStructure(parsedQuestions);
      if (!validation.ok) {
        throw new Error(validation.error || 'Question validation failed.');
      }

      // 3. Write deck folder node to IndexedDB
      const deckId = await library.addDeck(deckName.trim(), deckDescription.trim());

      // 4. Create default quiz container inside deck
      const quizName = `${deckName.trim()} - Quiz 1`;
      const quizId = await library.addQuiz(deckId, quizName, 'Auto-generated quiz from pasted text.');

      // 5. Batch insert questions under quizId and deckId
      await library.addQuestions(quizId, deckId, validation.value);

      // 6. Notify success and redirect to dashboard
      shell.showToast(`Successfully created deck "${deckName}" with ${validation.value.length} questions!`, 'success');
      navigate('/decks');
    } catch (err) {
      console.error('Submission failed:', err);
      shell.showToast(err.message || 'Failed to parse and save deck.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Create Study Deck</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure metadata folders and paste study sheets to generate recall cards.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900/70 dark:backdrop-blur-md rounded-2xl border border-slate-900/5 dark:border-white/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-colors">
        {/* Deck metadata */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="deckName" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Deck Name</label>
            <input
              id="deckName"
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Spanish Vocabulary, CS Algorithms..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-950/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 text-sm font-semibold transition-all shadow-inner"
            />
          </div>

          <div>
            <label htmlFor="deckDescription" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              id="deckDescription"
              rows={2}
              disabled={loading}
              placeholder="Provide a brief summary of what this study deck covers..."
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-955/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 text-sm font-semibold transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Text area ingestion */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="rawText" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Paste Study Questions</label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Format: AI Block / Markdown / CSV</span>
          </div>
          
          <textarea
            id="rawText"
            required
            rows={12}
            disabled={loading}
            placeholder={`[T/F] React 19 is fully compatible.
*True
 
What does CSS stand for?
A. Computer Style Sheets
B. Cascading Style Sheets
*B`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full font-mono text-sm px-4 py-3 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-950/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 transition-all shadow-inner"
          />
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900/5 dark:border-white/5">
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate('/decks')}
            className="px-5 py-2.5 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : 'Create Deck & Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
