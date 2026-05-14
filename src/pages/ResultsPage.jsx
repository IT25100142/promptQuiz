import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizHandlers } from '../features/quiz/hooks/useQuizNavigation.js'
import ResultsView from '../components/ResultsView.jsx'
import MarkdownRenderer from '../features/ui/display/MarkdownRenderer.jsx'
import { useQuizContext } from '../contexts/QuizContext.jsx'

export default function ResultsPage() {
  const navigate = useNavigate()
  const quizState = useQuizContext()
  const quizHandlers = useQuizHandlers(quizState)

  const percent = useMemo(() => {
    return quizState.total > 0 ? Math.round((quizState.score / quizState.total) * 100) : 0
  }, [quizState.score, quizState.total])

  const handleRestartSession = () => {
    navigate('/quiz')
    quizHandlers.restartSession()
  }

  const handleStartReviewMistakes = () => {
    navigate('/quiz')
    quizHandlers.startReviewMistakes()
  }

  const handleEditQuiz = () => {
    navigate('/create')
    quizHandlers.editQuiz()
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  if (quizState.quiz.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-950 mb-4">No Results Available</h2>
          <p className="text-slate-600 mb-6">Complete a quiz to see your results</p>
          <button
            onClick={() => navigate('/create')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            Create Deck
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 py-6">
      <ResultsView
        percent={percent}
        score={quizState.score}
        total={quizState.total}
        isReviewMode={quizState.isReviewMode}
        incorrectQuestions={quizState.incorrectQuestions}
        quiz={quizState.quiz}
        answers={quizState.answers}
        textAnswers={quizHandlers.textAnswers}
        restartSession={handleRestartSession}
        startReviewMistakes={handleStartReviewMistakes}
        editQuiz={handleEditQuiz}
        MarkdownRenderer={MarkdownRenderer}
        onBackToHome={handleBackToHome}
      />
    </div>
  )
}
