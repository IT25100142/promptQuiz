import { useState } from 'react'
import { cx } from '../../../../shared/utils/helpers.js'

export default function DeckForm({ 
  selectedDeck, 
  onConfirmAddQuestions, 
  onCancel, 
  deckLoading 
}) {
  const [newQuestions, setNewQuestions] = useState('')
  const [addQuestionsError, setAddQuestionsError] = useState('')

  const confirmAddQuestions = async () => {
    if (!selectedDeck) {
      setAddQuestionsError('Please select a deck first')
      return
    }

    if (!newQuestions.trim()) {
      setAddQuestionsError('Please enter questions to add')
      return
    }

    try {
      const lines = newQuestions.trim().split('\n').filter(line => line.trim())
      const parsedQuestions = []
      
      for (const line of lines) {
        if (line.trim()) {
          if (/^\d+\./.test(line) || line.includes('?') || line.toLowerCase().includes('question')) {
            const questionText = line.replace(/^\d+\.\s*/, '').trim()
            if (questionText) {
              parsedQuestions.push({
                question: questionText,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                answer: 'Option A',
                answerIndex: 0,
                type: 'multiple-choice'
              })
            }
          }
        }
      }

      if (parsedQuestions.length === 0) {
        setAddQuestionsError('No valid questions found. Please check your format.')
        return
      }

      await onConfirmAddQuestions({
        questions: parsedQuestions,
        error: setAddQuestionsError
      })
      
    } catch (error) {
      setAddQuestionsError('Failed to add questions. Please check your format.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-950">
            Add Questions to Deck
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="new-questions" className="block text-sm font-medium text-slate-700 mb-2">
              Questions to Add (one per line)
            </label>
            <textarea
              id="new-questions"
              value={newQuestions}
              onChange={(e) => setNewQuestions(e.target.value)}
              placeholder="1. What is the capital of France?"
              rows={12}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="text-sm text-slate-600 mb-4">
            <p className="font-medium mb-2">Format:</p>
            <ul className="space-y-1 text-xs">
              <li>• Enter one question per line</li>
              <li>• Use numbers followed by periods (1., 2., etc.)</li>
              <li>• For multiple choice, list options on separate lines</li>
              <li>• Mark correct answer with *</li>
            </ul>
          </div>

          {addQuestionsError && (
            <div className={cx(
              'rounded-lg border px-4 py-3 text-sm font-semibold',
              addQuestionsError.includes('Successfully') 
                ? 'border-teal-200 bg-teal-50 text-teal-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            )}>
              {addQuestionsError}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAddQuestions}
              disabled={!selectedDeck || !newQuestions.trim()}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              Add Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
