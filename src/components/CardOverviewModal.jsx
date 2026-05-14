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
        return 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200'
      case 'incorrect':
        return 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200'
      default:
        return 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">Question Overview</h2>
          <button
            type="button"
            onClick={() => setShowCardOverview(false)}
            className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-teal-100 border border-teal-300"></div>
              <span className="text-slate-600">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-rose-100 border border-rose-300"></div>
              <span className="text-slate-600">Incorrect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-slate-100 border border-slate-300"></div>
              <span className="text-slate-600">Not answered</span>
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
                    isCurrent && 'ring-2 ring-teal-500 ring-offset-2'
                  )}
                  title={`Question ${index + 1} - ${status}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-600">
            Click any question number to jump directly to that question
          </div>
        </div>
      </div>
    </div>
  )
}
