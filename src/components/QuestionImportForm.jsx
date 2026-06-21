export default function QuestionImportForm({
  rawText,
  onRawTextChange,
  validationResult,
  disabled = false,
  id = 'rawText',
  rows = 12,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={id} className="label-premium">
          Paste Study Questions
        </label>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Format: AI Block / Markdown / CSV
        </span>
      </div>

      <textarea
        id={id}
        required
        rows={rows}
        disabled={disabled}
        placeholder={`[T/F] React 19 is fully compatible.
*True

What does CSS stand for?
A. Computer Style Sheets
B. Cascading Style Sheets
*B`}
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        className="w-full font-mono text-xs sm:text-sm px-4 py-3 rounded-xl input-premium text-slate-900 dark:text-slate-100 resize-none"
      />

      {validationResult && (
        <div
          className={`premium-glass subpixel-border p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-fade-up ${
            validationResult.ok
              ? 'text-emerald-800 dark:text-emerald-300 border-emerald-500/15'
              : 'text-rose-800 dark:text-rose-300 border-rose-500/15'
          }`}
        >
          <span className="text-sm shrink-0">{validationResult.ok ? '✅' : '⚠️'}</span>
          <div className="leading-relaxed">
            {validationResult.ok ? (
              <span>
                Valid format! Found {validationResult.questions.length}{' '}
                {validationResult.questions.length === 1 ? 'question' : 'questions'} ready to
                import.
              </span>
            ) : (
              <span>Format Error: {validationResult.error}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
