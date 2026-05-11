import { useState } from 'react'

export default function AIPromptBuilder({
  showAIPromptBuilder,
  setShowAIPromptBuilder,
  aiResponse,
  setAiResponse,
  parseMessage,
  setParseMessage,
  onGeneratePrompt,
  onParseResponse,
  onCopyToClipboard
}) {
  const [studyNotes, setStudyNotes] = useState('')
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState({
    multipleChoice: true,
    trueFalse: true,
    fillBlank: false,
    cloze: false,
    shortAnswer: false
  })
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [topicInstructions, setTopicInstructions] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const handleGeneratePrompt = () => {
    const prompt = onGeneratePrompt({
      studyNotes,
      selectedQuestionTypes,
      numberOfQuestions,
      topicInstructions
    })
    setGeneratedPrompt(prompt)
  }

  if (!showAIPromptBuilder) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-950">AI Prompt Builder</h2>
          <button
            type="button"
            onClick={() => setShowAIPromptBuilder(false)}
            className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Study Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="study-notes">
              Study Notes (optional)
            </label>
            <textarea
              id="study-notes"
              value={studyNotes}
              onChange={(e) => setStudyNotes(e.target.value)}
              placeholder="Paste your lecture notes, book excerpts, or any study material here..."
              rows={4}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Question Types (select at least one)
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { key: 'multipleChoice', label: 'Multiple Choice' },
                { key: 'trueFalse', label: 'True/False' },
                { key: 'fillBlank', label: 'Fill in Blank' },
                { key: 'cloze', label: 'Cloze' },
                { key: 'shortAnswer', label: 'Short Answer' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQuestionTypes[key]}
                    onChange={(e) => setSelectedQuestionTypes(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="num-questions">
              Number of Questions
            </label>
            <input
              id="num-questions"
              type="number"
              min="1"
              max="100"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Topic Instructions */}
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="topic-instructions">
              Topic / Extra Instructions
            </label>
            <input
              id="topic-instructions"
              type="text"
              value={topicInstructions}
              onChange={(e) => setTopicInstructions(e.target.value)}
              placeholder="e.g., World War II battles, easy difficulty, focus on dates"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Generate Prompt Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGeneratePrompt}
              className="rounded-md bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Generate Prompt
            </button>
          </div>

          {/* Generated Prompt */}
          {generatedPrompt && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-800">
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
                value={generatedPrompt}
                readOnly
                rows={12}
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono"
              />
            </div>
          )}

          {/* AI Response Section */}
          {generatedPrompt && (
            <div className="border-t border-slate-200 pt-6">
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                Paste AI Response
              </label>
              <textarea
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                placeholder="Paste response from your AI here..."
                rows={8}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => onParseResponse({ aiResponse, generatedPrompt, studyNotes, selectedQuestionTypes, numberOfQuestions, topicInstructions })}
                  className="rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Parse & Load
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {parseMessage && (
            <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              parseMessage.includes('Successfully') || parseMessage.includes('Copied')
                ? 'border-teal-200 bg-teal-50 text-teal-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              {parseMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
