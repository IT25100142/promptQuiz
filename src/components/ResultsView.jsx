import { cx } from '../shared/utils/helpers.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'
export default function ResultsView({
  percent,
  score,
  total,
  isReviewMode,
  incorrectQuestions,
  quiz,
  answers,
  textAnswers,
  restartSession,
  startReviewMistakes,
  editQuiz,
  MarkdownRenderer
}) {
  return (
    <main className="flex-1 py-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="rounded-lg bg-slate-950 p-5 text-white">
            <div className="text-sm font-semibold text-teal-200">
              {isReviewMode ? 'Review Complete' : 'Session complete'}
            </div>
            <div className="mt-4 text-5xl font-semibold tracking-tight">{percent}%</div>
            <div className="mt-2 text-sm text-slate-300">
              {score} correct out of {total}
            </div>
            <div className="mt-4 space-y-2">
              {incorrectQuestions.length > 0 && !isReviewMode && (
                <button
                  type="button"
                  onClick={startReviewMistakes}
                  className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  Review Mistakes ({incorrectQuestions.length})
                </button>
              )}
              <button
                type="button"
                onClick={restartSession}
                className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {isReviewMode ? 'Start New Quiz' : 'Try Again'}
              </button>
              <button
                type="button"
                onClick={editQuiz}
                className="w-full rounded-md border border-slate-600 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                Back to Home
              </button>
            </div>
            {incorrectQuestions.length === 0 && !isReviewMode && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-emerald-800">Perfect round! Nothing to review.</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight">Review</h2>
            <div className="mt-4 grid gap-3">
              {quiz.map((question, questionIdx) => {
                const selected = answers[questionIdx]
                const textAnswer = textAnswers[questionIdx]
                
                let isCorrect = false
                let userAnswerText = ''
                let correctAnswerText = ''

                switch (question.type) {
                  case 'multiple-choice':
                    isCorrect = selected === question.answerIndex
                    userAnswerText = selected === null ? 'No answer' : question.options[selected]
                    correctAnswerText = question.options[question.answerIndex]
                    break
                  case 'true-false':
                    isCorrect = selected !== null && ((selected === 1 ? question.answer : !question.answer))
                    userAnswerText = selected === null ? 'No answer' : (selected === 1 ? 'True' : 'False')
                    correctAnswerText = question.answer ? 'True' : 'False'
                    break
                  case 'fill-blank':
                    if (textAnswer && question.answers) {
                      const normalizedAnswer = textAnswer.toLowerCase().trim()
                      const correctAnswers = question.answers.map(a => a.toLowerCase().trim())
                      isCorrect = correctAnswers.includes(normalizedAnswer)
                    }
                    userAnswerText = textAnswer || 'No answer'
                    correctAnswerText = question.answers?.[0] || 'N/A'
                    break
                  case 'cloze':
                    // For cloze, check if all blanks are filled correctly
                    const clozeAnswers = []
                    const blanks = question.question.split(/\{[^}]+\}/).length - 1
                    for (let i = 0; i < blanks; i++) {
                      const answer = textAnswers[`${questionIdx}-${i}`]
                      clozeAnswers.push(answer)
                    }
                    if (clozeAnswers.every(a => a && question.answers)) {
                      const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
                      const correctAnswers = question.answers.map(a => a.toLowerCase().trim())
                      isCorrect = normalizedAnswers.every((a, i) => correctAnswers.includes(a))
                    }
                    userAnswerText = clozeAnswers.length > 0 ? clozeAnswers.join(', ') : 'No answer'
                    correctAnswerText = question.answers?.join(', ') || 'N/A'
                    break
                  case 'short-answer':
                    isCorrect = selected?.selfAssessedCorrect || false
                    userAnswerText = textAnswer || 'No answer'
                    correctAnswerText = question.suggestedAnswer || 'N/A'
                    break
                }

                return (
                  <article
                    key={question.id || questionIdx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="font-semibold leading-6 text-slate-950">
                        {questionIdx + 1}. {question.question}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({question.type.replace('-', ' ')})
                        </span>
                      </h3>
                      <span
                        className={cx(
                          'w-fit rounded-md px-2 py-1 text-xs font-bold',
                          question.type === 'short-answer' && selected?.selfAssessed !== undefined
                            ? selected?.selfAssessedCorrect
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                            : isCorrect
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-rose-100 text-rose-800',
                        )}
                      >
                        {question.type === 'short-answer' && selected?.selfAssessed !== undefined
                          ? selected?.selfAssessedCorrect ? 'Self-assessed correct' : 'Needs review'
                          : isCorrect
                            ? 'Correct'
                            : 'Review'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                      <p>
                        Your answer:{' '}
                        <span className="font-semibold text-slate-950">
                          {userAnswerText}
                        </span>
                      </p>
                      {question.type !== 'short-answer' && !isCorrect && (
                        <p>
                          Correct answer:{' '}
                          <span className="font-semibold text-slate-950">
                            {correctAnswerText}
                          </span>
                        </p>
                      )}
                      {question.type === 'short-answer' && (
                        <p>
                          Model answer:{' '}
                          <span className="font-semibold text-slate-950">
                            {correctAnswerText}
                          </span>
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
