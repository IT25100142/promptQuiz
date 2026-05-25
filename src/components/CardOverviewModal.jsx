import { cx } from '../shared/utils/helpers.js'

export default function CardOverviewModal({
  showCardOverview,
  setShowCardOverview,
  quiz,
  answers,
  currentIndex,
  onJumpToQuestion
}) {
  if (!showCardOverview) return null

  const getQuestionStatus = (index) => {
    const answer = answers[index]
    if (answer === null) return 'unanswered'
    
    const question = quiz[index]
    if (!question) return 'unanswered'
    
    const isCorrect = question.answerIndex === answer || 
                     (question.type === 'fill-blank' && answer === question.answer) ||
                     (question.type === 'cloze' && answer === question.answer) ||
                     (question.type === 'short-answer' && answer?.selfAssessedCorrect)
    
    return isCorrect ? 'correct' : 'incorrect'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct':
        return 'bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-900/50 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/40'
      case 'incorrect':
        return 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/40'
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-slate-955 dark:text-slate-50">Question Overview</h2>
          <button
            type="button"
            onClick={() => setShowCardOverview(false)}
            className="rounded-md p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-teal-100 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-900/50"></div>
              <span className="text-slate-600 dark:text-slate-400">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/50"></div>
              <span className="text-slate-600 dark:text-slate-400">Incorrect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-705"></div>
              <span className="text-slate-600 dark:text-slate-400">Not answered</span>
            </div>
          </div>
          
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[50vh] overflow-y-auto p-2">
            {quiz.map((_, index) => {
              const status = getQuestionStatus(index)
              const isCurrent = index === currentIndex
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    onJumpToQuestion(index)
                    setShowCardOverview(false)
                  }}
                  className={cx(
                    'aspect-square flex items-center justify-center rounded border text-sm font-medium transition-colors',
                    getStatusColor(status),
                    isCurrent && 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-900'
                  )}
                  title={`Question ${index + 1} - ${status}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-450">
            Click any question number to jump directly to that question
          </div>
        </div>
      </div>
    </div>
  )
}
