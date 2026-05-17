export default function PromptPreview({ generatedPrompt, onCopyToClipboard }) {
  if (!generatedPrompt) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="ai-generated-prompt">
          Generated Prompt (copy this to your AI)
        </label>
        <button
          type="button"
          onClick={() => onCopyToClipboard(generatedPrompt)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Copy to Clipboard
        </button>
      </div>
      <textarea
        id="ai-generated-prompt"
        value={generatedPrompt}
        readOnly
        rows={12}
        className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono"
      />
    </div>
  )
}
