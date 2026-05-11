import { useState } from 'react'
import { cx } from '../shared/utils/helpers.js'
export default function InputView({ 
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
    <>
      <button
        type="button"
        onClick={loadSample}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        Load Sample
      </button>
      <button
        type="button"
        onClick={clearQuiz}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        Clear
      </button>

      <label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="quiz-json">
        Quiz JSON
      </label>
      <textarea
        id="quiz-json"
        value={rawJson}
        onChange={(event) => {
          setRawJson(event.target.value)
          if (inputError) setInputError('')
        }}
        placeholder={sampleJson}
        spellCheck={false}
        aria-invalid={Boolean(inputError)}
        className="mt-2 h-[420px] w-full resize-y rounded-lg border bg-slate-950 p-4 font-mono text-[12px] leading-5 text-slate-50 shadow-inner outline-none placeholder:text-slate-500 focus:ring-2 border-slate-800 focus:ring-teal-500"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          {inputError ? (
            <p className="text-sm font-medium text-rose-700">{inputError}</p>
          ) : rawJson.trim() && preview.ok ? (
            <p className="text-sm font-medium text-teal-700">
              Ready: {preview.value.length} question
              {preview.value.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={startQuiz}
            className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Start Quiz
          </button>
        </div>
      </div>

      <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
        <div className="font-semibold">Accepted answer formats</div>
        <div className="mt-3 space-y-3 leading-6">
          <p>
            <span className="font-mono text-xs">"answer"</span> can be the exact text of the correct option.
          </p>
          <p>
            <span className="font-mono text-xs">"answerIndex"</span> can be a number from 0 to 3.
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
      </aside>
    </>
  )
}
