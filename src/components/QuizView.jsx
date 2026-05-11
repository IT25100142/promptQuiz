import { useState } from 'react'

export default function QuizView({
  current,
  idx,
  total,
  answeredCount,
  score,
  isReviewMode,
  incorrectQuestions,
  progress,
  choose,
  answers,
  goNext,
  restartSession,
  isAnswered,
  MarkdownRenderer
}) {
  return (
    <main className="flex flex-1 items-center py-6">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-teal-700">
              {isReviewMode ? 'Reviewing ' : 'Question '}{idx + 1} of {total}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {answeredCount} answered | Score {score}
              {isReviewMode && ` | Mistakes: ${incorrectQuestions.length}`}
            </div>
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
            {Math.round(progress)}% through
          </div>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(progress)}
        >
          <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
        </div>

        <h2 className="mt-8 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          <MarkdownRenderer text={current.question} />
        </h2>

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
            <div className="space-y-3">
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
            </div>
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
                onClick={goNext}
                disabled={!isAnswered()}
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {idx + 1 === total ? 'See Results' : 'Next'}
              </button>
              <button
                type="button"
                onClick={restartSession}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Restart
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
