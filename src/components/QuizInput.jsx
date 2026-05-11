export default function QuizInput({ 
  rawJson, 
  setRawJson, 
  inputError, 
  setInputError, 
  preview, 
  loadSample, 
  formatJson, 
  clearQuiz, 
  startQuiz, 
  sampleJson 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="json-input" className="block text-sm font-semibold text-slate-800">
          Paste your quiz JSON or text
        </label>
        <textarea
          id="json-input"
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          placeholder="Paste your quiz JSON here..."
          rows={8}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      
      {inputError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {inputError}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadSample}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Load Sample
        </button>
        <button
          type="button"
          onClick={formatJson}
          disabled={!rawJson.trim()}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Format
        </button>
        <button
          type="button"
          onClick={clearQuiz}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Clear
        </button>
      </div>
      
      {preview.ok && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-800">
            Preview: {preview.value.length} questions
          </div>
          <button
            type="button"
            onClick={startQuiz}
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Start Quiz
          </button>
        </div>
      )}
      
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="font-semibold">Accepted answer formats</div>
        <div className="mt-3 space-y-3 leading-6">
          <p>
            <span className="font-mono text-xs">"answer"</span> can be exact text of the
            correct option.
          </p>
          <p>
            <span className="font-mono text-xs">"answerIndex"</span> can be a number from 0
            to 3.
          </p>
          <p>Duplicate or blank options are flagged before quiz starts.</p>
          <p className="mt-2 font-semibold">Markdown Support:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><span className="font-mono">**bold**</span> for bold text</li>
            <li><span className="font-mono">*italic*</span> for italic text</li>
            <li><span className="font-mono">`code`</span> for inline code</li>
            <li><span className="font-mono">![alt](url)</span> for images</li>
          </ul>
          <p className="mt-2 text-xs">Use Import button to add images or load CSV/Markdown files.</p>
        </div>
      </div>
    </div>
  )
}
