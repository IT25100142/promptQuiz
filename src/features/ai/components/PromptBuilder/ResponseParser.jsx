export default function ResponseParser({ 
  aiResponse, 
  setAiResponse, 
  onParseResponse, 
  generatedPrompt, 
  studyNotes, 
  selectedQuestionTypes, 
  numberOfQuestions, 
  topicInstructions 
}) {
  return (
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
          onClick={() => onParseResponse({ 
            aiResponse, 
            generatedPrompt, 
            studyNotes, 
            selectedQuestionTypes, 
            numberOfQuestions, 
            topicInstructions 
          })}
          className="rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Parse & Load
        </button>
      </div>
    </div>
  )
}
