import { MarkdownRenderer } from '../utils/helpers.js'

export default function QuizQuestion({ 
  question, 
  idx, 
  total, 
  isAnswered, 
  showSuggestedAnswer, 
  setShowSuggestedAnswer 
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-semibold leading-6 text-slate-950">
          {idx + 1}. {question.question}
          <span className="ml-2 text-xs font-normal text-slate-500">
            ({question.type.replace('-', ' ')})
          </span>
        </h3>
        <span
          className="w-fit rounded-md px-2 py-1 text-xs font-bold"
        >
          {isAnswered ? 'Answered' : 'Not answered'}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
        <p>
          Your answer:{' '}
          <span className="font-semibold text-slate-950">
            {isAnswered ? 'Answered' : 'Not answered'}
          </span>
        </p>
        {question.type !== 'short-answer' && !isAnswered && (
          <p>
            Correct answer:{' '}
            <span className="font-semibold text-slate-950">
              {question.type === 'multiple-choice' && question.options[question.answerIndex]}
              {question.type === 'true-false' && (question.answer ? 'True' : 'False')}
              {question.type === 'fill-blank' && question.answer}
              {question.type === 'cloze' && question.answer}
            </span>
          </p>
        )}
        {question.type === 'short-answer' && (
          <p>
            Model answer:{' '}
            <span className="font-semibold text-slate-950">
              {question.suggestedAnswer}
            </span>
          </p>
        )}
        {showSuggestedAnswer[`${idx}`] && (
          <button
            type="button"
            onClick={() => setShowSuggestedAnswer(prev => ({ ...prev, [`${idx}`]: false }))}
            className="mt-2 text-xs text-teal-600 hover:text-teal-700"
          >
            Hide suggested answer
          </button>
        )}
      </div>
    </div>
  )
}
