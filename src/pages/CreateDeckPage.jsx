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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Study Deck</h1>
        <p className="text-slate-500 mt-1">Configure metadata folders and paste study sheets to generate recall cards.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* Deck metadata */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="deckName" className="block text-sm font-bold text-slate-700 mb-2">Deck Name</label>
            <input
              id="deckName"
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Spanish Vocabulary, CS Algorithms..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="deckDescription" className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea
              id="deckDescription"
              rows={2}
              disabled={loading}
              placeholder="Provide a brief summary of what this study deck covers..."
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition bg-slate-50 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Text area ingestion */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="rawText" className="block text-sm font-bold text-slate-700">Paste Study Questions</label>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Format: AI Block / Markdown / CSV</span>
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
            className="w-full font-mono text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate('/decks')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 shadow-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Deck & Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
