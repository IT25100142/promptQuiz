import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useQuizLibrary, useQuizShell } from '../contexts/QuizContext.jsx';

import { useQuestionImport } from '../features/quiz/hooks/useQuestionImport.js';

import QuestionImportForm from '../components/QuestionImportForm.jsx';



export default function CreateDeckPage() {

  const navigate = useNavigate();

  const library = useQuizLibrary();

  const shell = useQuizShell();



  const [deckName, setDeckName] = useState('');

  const [deckDescription, setDeckDescription] = useState('');

  const [loading, setLoading] = useState(false);



  const {

    rawText,

    setRawText,

    validationResult,

    getValidatedQuestions,

  } = useQuestionImport(library);



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

      const questions = getValidatedQuestions();



      const deckId = await library.createNewDeck(deckName.trim(), deckDescription.trim());



      const quizName = `${deckName.trim()} - Quiz 1`;

      const quizId = await library.createNewQuiz(deckId, quizName, 'Auto-generated quiz from pasted text.');



      await library.addQuestionsToQuiz(quizId, deckId, questions);



      shell.showToast(`Successfully created deck "${deckName}" with ${questions.length} questions!`, 'success');

      navigate('/decks');

    } catch (err) {

      console.error('Submission failed:', err);

      shell.showToast(err.message || 'Failed to parse and save deck.', 'error');

    } finally {

      setLoading(false);

    }

  };



  const isBusy = loading;



  return (

    <div className="flex-1 max-w-3xl mx-auto w-full">

      <div className="mb-8">

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Import Questions</h1>

        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">

          Bulk import: create a new folder, quiz, and all questions in one step. Paste JSON or plain-text study sheets below.

        </p>

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

              disabled={isBusy}

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

              disabled={isBusy}

              placeholder="Provide a brief summary of what this study deck covers..."

              value={deckDescription}

              onChange={(e) => setDeckDescription(e.target.value)}

              className="w-full px-4 py-2.5 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-955/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 text-sm font-semibold transition-all resize-none shadow-inner"

            />

          </div>

        </div>



        <QuestionImportForm

          id="bulkImportRawText"

          rawText={rawText}

          onRawTextChange={setRawText}

          validationResult={validationResult}

          disabled={isBusy}

        />



        {/* Form actions */}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900/5 dark:border-white/5">

          <button

            type="button"

            disabled={isBusy}

            onClick={() => navigate('/decks')}

            className="px-5 py-2.5 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition cursor-pointer"

          >

            Cancel

          </button>

          <button

            type="submit"

            disabled={isBusy || (validationResult && !validationResult.ok)}

            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"

          >

            {loading ? 'Processing...' : 'Import Deck & Quiz'}

          </button>

        </div>

      </form>

    </div>

  );

}


