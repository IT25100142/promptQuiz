import { useState } from 'react'

export default function PromptForm({ 
  studyNotes, 
  setStudyNotes, 
  selectedQuestionTypes, 
  setSelectedQuestionTypes, 
  numberOfQuestions, 
  setNumberOfQuestions, 
  topicInstructions, 
  setTopicInstructions,
  onGeneratePrompt 
}) {
  const handleGeneratePrompt = () => {
    onGeneratePrompt({
      studyNotes,
      selectedQuestionTypes,
      numberOfQuestions,
      topicInstructions
    })
  }

  return (
    <div className="space-y-6">
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
    </div>
  )
}
