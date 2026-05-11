import { cx } from '../../shared/utils/helpers.js'
import MarkdownRenderer from '../../shared/ui/display/MarkdownRenderer.jsx'

export default function QuizView({
  current,
  idx,
  total,
  answeredCount,
  score,
  progress,
  isReviewMode,
  incorrectQuestions,
  answers,
  textAnswers,
  showSuggestedAnswer,
  choose,
  handleTextAnswer,
  submitTextAnswer,
  toggleSuggestedAnswer,
  handleSelfAssessment,
  isAnswered,
  goPrevious,
  goNext,
  MarkdownRenderer
}) {
  if (!current) return null

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
                      'grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold shadow-sm transition',
                      'focus:outline-none focus:ring-2 focus:ring-teal-500',
                      answered ? 'cursor-default' : 'cursor-pointer',
                      variant,
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200">
                      {String.fromCharCode(65 + optionIdx)}
                    </span>
                    <span className="text-left">
                      <MarkdownRenderer text={option} />
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* True/False */}
          {current.type === 'true-false' && (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((option, optionIdx) => {
                const answered = answers[idx] !== null
                const isSelected = answers[idx] === optionIdx
                const isCorrect = optionIdx === 1 ? current.answer : !current.answer
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
                      'min-h-14 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm transition',
                      'focus:outline-none focus:ring-2 focus:ring-teal-500',
                      answered ? 'cursor-default' : 'cursor-pointer',
                      variant,
                    )}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          )}

          {/* Fill in the Blank */}
          {current.type === 'fill-blank' && (
            <div className="space-y-4">
              <div className="text-lg leading-relaxed">
                {current.question.split('___').map((part, partIdx) => (
                  <span key={partIdx}>
                    {part}
                    {partIdx < current.question.split('___').length - 1 && (
                      <input
                        type="text"
                        value={textAnswers[idx] || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        disabled={answers[idx] !== null}
                        placeholder="answer"
                        className={cx(
                          'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium',
                          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                          answers[idx] !== null
                            ? answers[idx]?.isCorrect
                              ? 'border-teal-300 bg-teal-50 text-teal-950'
                              : 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-slate-300 bg-white'
                        )}
                      />
                    )}
                  </span>
                ))}
              </div>
              {answers[idx] === null && textAnswers[idx] && (
                <button
                  type="button"
                  onClick={submitTextAnswer}
                  className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Submit Answer
                </button>
              )}
              {answers[idx] !== null && (
                <p className={cx(
                  'rounded-lg border px-4 py-3 text-sm font-semibold',
                  answers[idx]?.isCorrect
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                )}>
                  {answers[idx]?.isCorrect ? 'Correct!' : `Correct answer: ${current.answers[0]}`}
                </p>
              )}
            </div>
          )}

          {/* Cloze Deletion */}
          {current.type === 'cloze' && (
            <div className="space-y-4">
              <div className="text-lg leading-relaxed">
                {current.question.split(/\{[^}]+\}/).map((part, partIdx) => (
                  <span key={partIdx}>
                    {part}
                    {partIdx < current.question.split(/\{[^}]+\}/).length - 1 && (
                      <input
                        type="text"
                        value={textAnswers[`${idx}-${partIdx}`] || ''}
                        onChange={(e) => handleTextAnswer(e.target.value, partIdx)}
                        disabled={answers[idx] !== null}
                        placeholder="answer"
                        className={cx(
                          'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium',
                          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                          answers[idx] !== null
                            ? answers[idx]?.isCorrect
                              ? 'border-teal-300 bg-teal-50 text-teal-950'
                              : 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-slate-300 bg-white'
                        )}
                      />
                    )}
                  </span>
                ))}
              </div>
              {answers[idx] === null && (() => {
                const blanks = current.question.split(/\{[^}]+\}/).length - 1
                for (let i = 0; i < blanks; i++) {
                  if (!textAnswers[`${idx}-${i}`]) return null
                }
                return (
                  <button
                    type="button"
                    onClick={submitTextAnswer}
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Submit Answer
                  </button>
                )
              })()}
              {answers[idx] !== null && (
                <p className={cx(
                  'rounded-lg border px-4 py-3 text-sm font-semibold',
                  answers[idx]?.isCorrect
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                )}>
                  {answers[idx]?.isCorrect ? 'Correct!' : `Correct answers: ${current.answers.join(', ')}`}
                </p>
              )}
            </div>
          )}

          {/* Short Answer */}
          {current.type === 'short-answer' && (
            <div className="space-y-4">
              <textarea
                value={textAnswers[idx] || ''}
                onChange={(e) => handleTextAnswer(e.target.value)}
                disabled={answers[idx]?.selfAssessed !== undefined}
                placeholder="Type your answer here..."
                rows={4}
                className={cx(
                  'w-full rounded-md border px-4 py-3 text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                  answers[idx]?.selfAssessed !== undefined ? 'border-slate-300 bg-slate-50' : 'border-slate-300 bg-white'
                )}
              />
              
              {!showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                <button
                  type="button"
                  onClick={toggleSuggestedAnswer}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Reveal Model Answer
                </button>
              )}

              {showSuggestedAnswer[idx] && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950 mb-2">Model Answer:</p>
                  <p className="text-sm text-amber-800">{current.suggestedAnswer}</p>
                </div>
              )}

              {showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelfAssessment(true)}
                    className="flex-1 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    I was correct
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelfAssessment(false)}
                    className="flex-1 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    I still need to review
                  </button>
                </div>
              )}

              {answers[idx]?.selfAssessed !== undefined && (
                <p className={cx(
                  'rounded-lg border px-4 py-3 text-sm font-semibold',
                  answers[idx]?.selfAssessedCorrect
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                )}>
                  {answers[idx]?.selfAssessedCorrect ? 'Self-assessed as correct' : 'Marked for review'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={idx === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!isAnswered()}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {idx + 1 === total ? 'See Results' : 'Next'}
          </button>
        </div>
      </section>
    </main>
  )
}
