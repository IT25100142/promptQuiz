import { useState, useMemo, useEffect } from 'react';
import { useQuizShell, useQuizLibrary } from '../../contexts/QuizContext.jsx';
import { parseRawInput } from '../../shared/utils/parsers.js';
import { validateQuestionStructure } from '../../shared/schemas/quizQuestions.js';
import { useKeyPress } from '../../shared/utils/useKeyPress.js';

export default function AiPromptBuilderModal() {
  const shell = useQuizShell();
  const library = useQuizLibrary();

  const { showAIPromptBuilder, setShowAIPromptBuilder } = shell;

  // Escape key closes modal
  useKeyPress({
    Escape: () => setShowAIPromptBuilder(false)
  }, !showAIPromptBuilder);

  // Configuration inputs state
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState(['multiple-choice']);

  // Paste Response Sandbox state
  const [llmOutput, setLlmOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);

  // Auto-fill selectedDeckId once decks load
  useEffect(() => {
    if (library.savedDecks?.length > 0 && !selectedDeckId) {
      setSelectedDeckId(library.savedDecks[0].id.toString());
    }
  }, [library.savedDecks, selectedDeckId]);

  // Handle type checkbox selection
  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Generate reactive markdown prompt
  const generatedPrompt = useMemo(() => {
    const typesString = selectedTypes.join(', ');
    const topicText = topic.trim() || '[Specify your topic or paste your study notes here]';
    
    return `Generate a quiz with exactly ${questionCount} questions based on the following topic or study notes:

Topic/Notes: "${topicText}"

Supported Question Types: ${typesString}

Please output the questions exactly as blank-line-separated text blocks using the following syntax. Do not output conversational preamble or explanation, just the questions.

Syntax Examples:

${selectedTypes.includes('multiple-choice') ? `[Multiple Choice Example]
What does CSS stand for?
A. Creative Style Sheets
B. Cascading Style Sheets
C. Computer Style Sheets
*B

` : ''}${selectedTypes.includes('true-false') ? `[True/False Example]
[T/F] React 19 is fully compatible with Vite 8.
*True

` : ''}${selectedTypes.includes('fill-blank') ? `[Fill-in-the-Blank Example]
[FIB] The React hook used to perform side effects is _______.
*useEffect

` : ''}${selectedTypes.includes('cloze') ? `[Cloze Deletion Example]
[CLOZE] The {0} hook returns a state value and a function to {1} it.
*useState, update

` : ''}${selectedTypes.includes('short-answer') ? `[Short Answer Example]
[SA] Explain the concept of Virtual DOM.
*A programming concept where a virtual representation of a UI is kept in memory and synced with the "real" DOM by a library such as ReactDOM.
` : ''}`;
  }, [topic, questionCount, selectedTypes]);

  // One-click clipboard action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  // Live validation on-change of pasted response
  const validationResult = useMemo(() => {
    if (!llmOutput.trim()) return null;

    try {
      const parsed = parseRawInput(llmOutput);
      if (parsed.length === 0) {
        return { ok: false, error: 'No structured questions detected in the pasted text.' };
      }

      const validation = validateQuestionStructure(parsed);
      if (!validation.ok) {
        return { ok: false, error: validation.error };
      }

      return { ok: true, questions: validation.value };
    } catch (err) {
      return { ok: false, error: err.message || 'Formatting validation failed.' };
    }
  }, [llmOutput]);

  // Submit parsed questions to library database
  const handleImport = async () => {
    if (!validationResult || !validationResult.ok) return;

    try {
      let deckId = selectedDeckId ? Number(selectedDeckId) : null;

      if (isCreatingNewDeck || !deckId) {
        if (!newDeckName.trim()) {
          shell.showToast('Please enter a new deck name.', 'error');
          return;
        }
        deckId = await library.addDeck(newDeckName.trim(), 'Generated deck from AI Prompt Builder');
      }

      const quizName = `${topic.trim() || 'AI Generated'} - Quiz`;
      const quizId = await library.addQuiz(deckId, quizName, 'Imported from AI generated response');
      await library.addQuestions(quizId, deckId, validationResult.questions);

      shell.showToast(`Imported ${validationResult.questions.length} questions into deck!`, 'success');
      
      // Reset inputs
      setLlmOutput('');
      setTopic('');
      setShowAIPromptBuilder(false);
      
      // Force library reload
      await library.loadDecks();
    } catch (err) {
      console.error('Import failed:', err);
      shell.showToast(err.message || 'Import failed.', 'error');
    }
  };

  if (!showAIPromptBuilder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-md rounded-3xl border border-slate-900/5 dark:border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.06)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in transition-colors duration-200">
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-slate-900/5 dark:border-white/5 p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              🤖 AI Prompt Builder
            </h2>
            <p className="text-slate-500 dark:text-slate-405 text-xs mt-0.5">Generate customized prompts, run outputs in LLMs, and load questions instantly.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAIPromptBuilder(false)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition p-2 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal content body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left panel: Prompt generator config */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Configure Prompts</h3>
            
            {/* Topic Input */}
            <div>
              <label htmlFor="modalTopic" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Topic or Study Notes</label>
              <textarea
                id="modalTopic"
                rows={3}
                placeholder="e.g. JavaScript Async/Await, cell respiration notes, etc."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-950/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 resize-none transition-all shadow-inner"
              />
            </div>

            {/* Question types selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Question Types desired</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {[
                  { id: 'multiple-choice', label: 'Multiple Choice' },
                  { id: 'true-false', label: 'True / False' },
                  { id: 'fill-blank', label: 'Fill in Blank' },
                  { id: 'cloze', label: 'Cloze Deletion' },
                  { id: 'short-answer', label: 'Short Answer' }
                ].map((type) => (
                  <label key={type.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-905/5 dark:hover:bg-white/5 transition-all">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => handleTypeToggle(type.id)}
                      disabled={selectedTypes.includes(type.id) && selectedTypes.length === 1}
                      className="rounded border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Questions count slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                <label htmlFor="modalCount">Number of Questions</label>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{questionCount}</span>
              </div>
              <input
                id="modalCount"
                type="range"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-550"
              />
            </div>

            {/* Generated Prompt Block */}
            <div className="relative border border-slate-900/5 dark:border-white/10 rounded-2xl bg-slate-950 dark:bg-black text-slate-300 p-4 font-mono text-[10px] max-h-[160px] overflow-y-auto">
              <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-slate-800 dark:bg-slate-900 hover:bg-indigo-650 text-white font-semibold text-[10px] transition-all flex items-center gap-1 shadow-sm active:scale-[0.97]"
              >
                {copied ? '✅ Copied' : '📋 Copy Prompt'}
              </button>
            </div>
          </div>

          {/* Right panel: Response Paste sandbox and library selector */}
          <div className="space-y-5 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">2. Paste & Import</h3>
            
            {/* Sandbox textarea */}
            <div className="flex-1 flex flex-col">
              <label htmlFor="modalOutput" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Paste LLM Output Here</label>
              <textarea
                id="modalOutput"
                rows={8}
                placeholder="Paste the generated response from external AI models here..."
                value={llmOutput}
                onChange={(e) => setLlmOutput(e.target.value)}
                className="w-full flex-1 font-mono text-xs p-3.5 rounded-xl border border-transparent bg-slate-105/50 dark:bg-slate-955/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 transition-all shadow-inner"
              />
            </div>

            {/* Target Deck selector options */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-955/35 border border-slate-900/5 dark:border-white/5 rounded-2xl text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span className="text-[10px]">Select Target Deck:</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewDeck(!isCreatingNewDeck)}
                  className="text-indigo-655 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-305 font-bold tracking-normal uppercase text-[10px]"
                >
                  {isCreatingNewDeck ? 'Choose Existing' : 'Create New Deck'}
                </button>
              </div>

              {isCreatingNewDeck ? (
                <input
                  type="text"
                  placeholder="New Deck Name..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-transparent bg-slate-105/50 dark:bg-slate-950/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100 transition-all font-semibold shadow-inner"
                />
              ) : (
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-transparent bg-slate-105/50 dark:bg-slate-950/65 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent font-semibold shadow-inner"
                >
                  {library.savedDecks?.length > 0 ? (
                    library.savedDecks.map(deck => (
                      <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))
                  ) : (
                    <option value="">-- No Decks (Create New Deck) --</option>
                  )}
                </select>
              )}
            </div>

            {/* Validation Banner Indicator */}
            {validationResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs font-semibold animate-fade-up ${
                validationResult.ok 
                  ? 'border-emerald-500/10 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300' 
                  : 'border-rose-500/10 bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350'
              }`}>
                <span className="text-sm">{validationResult.ok ? '✅' : '⚠️'}</span>
                <div>
                  {validationResult.ok ? (
                    <span>Valid format! Found {validationResult.questions.length} questions ready to import.</span>
                  ) : (
                    <span>Format Error: {validationResult.error}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal actions footer */}
        <div className="border-t border-slate-900/5 dark:border-white/5 p-6 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-955/50">
          <button
            type="button"
            onClick={() => setShowAIPromptBuilder(false)}
            className="px-5 py-2.5 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-55 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-305 shadow-xs transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!validationResult || !validationResult.ok}
            onClick={handleImport}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/10 transition-all active:scale-[0.98] cursor-pointer"
          >
            Import to Library
          </button>
        </div>
      </div>
    </div>
  );
}
