import { cx } from '../utils/helpers.js'

export default function QuestionAnswer({ 
  current, 
  idx, 
  answers, 
  choose, 
  isAnswered, 
  MarkdownRenderer 
}) {
  return (
    <div className="mt-6">
      {/* Multiple Choice */}
      {current.type === 'multiple-choice' && (
        <div className="grid gap-3">
          {current.options.map((option, optionIdx) => {
            const answered = answers[idx] !== null
            const isSelected = answers[idx] === optionIdx
            const isCorrect = optionIdx === current.answerIndex
            const isWrongSelected = answered && isSelected && !isCorrect

            const variant = answered
              ? isCorrect
                ? 'border-teal-300 bg-teal-50 text-teal-950'
                : isWrongSelected
                  ? 'border-rose-300 bg-rose-50 text-rose-950'
                  : 'border-slate-200 bg-white text-slate-800'
              : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(optionIdx)}
                disabled={answered}
                className={cx(
                  'rounded-md border px-4 py-3 text-sm font-semibold',
                  variant
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {/* True/False */}
      {current.type === 'true-false' && (
        <div className="grid gap-3">
          {['True', 'False'].map((option, optionIdx) => {
            const answered = answers[idx] !== null
            const isSelected = answers[idx] === optionIdx
            const isCorrect = optionIdx === current.answerIndex
            const isWrongSelected = answered && isSelected && !isCorrect

            const variant = answered
              ? isCorrect
                ? 'border-teal-300 bg-teal-50 text-teal-950'
                : isWrongSelected
                  ? 'border-rose-300 bg-rose-50 text-rose-950'
                  : 'border-slate-200 bg-white text-slate-800'
              : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(optionIdx)}
                disabled={answered}
                className={cx(
                  'rounded-md border px-4 py-3 text-sm font-semibold',
                  variant
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {/* Fill in Blank */}
      {current.type === 'fill-blank' && (
        <div className="space-y-3">
          {current.blanks.map((blank, blankIdx) => (
            <div key={blankIdx} className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{blank.prefix}</span>
              <input
                type="text"
                value={answers[idx]?.[blankIdx] || ''}
                onChange={(e) => {
                  const newAnswers = [...(answers[idx] || {})]
                  newAnswers[blankIdx] = e.target.value
                  const newAllAnswers = [...answers]
                  newAllAnswers[idx] = newAnswers
                  setAnswers(newAllAnswers)
                }}
                disabled={answers[idx] !== null}
                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Type answer here..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Cloze */}
      {current.type === 'cloze' && (
        <textarea
          value={answers[idx] || ''}
          onChange={(e) => {
            const newAnswers = [...answers]
            newAnswers[idx] = e.target.value
            setAnswers(newAnswers)
          }}
          disabled={answers[idx] !== null}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type the complete text with blanks filled..."
          rows={4}
        />
      )}

      {/* Short Answer */}
      {current.type === 'short-answer' && (
        <textarea
          value={answers[idx] || ''}
          onChange={(e) => {
            const newAnswers = [...answers]
            newAnswers[idx] = e.target.value
            setAnswers(newAnswers)
          }}
          disabled={answers[idx] !== null}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type your answer here..."
          rows={3}
        />
      )}

      {isAnswered() && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => idx + 1 < current.total ? setIdx(idx + 1) : null}
            disabled={!isAnswered()}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {idx + 1 === current.total ? 'See Results' : 'Next'}
          </button>
          <button
            type="button"
            onClick={() => setIdx(0)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  )
}
