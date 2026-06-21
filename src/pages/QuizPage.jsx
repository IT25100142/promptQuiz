import { useNavigate } from 'react-router-dom';
import { useQuizHandlers } from '../features/quiz/hooks/useQuizNavigation.js';
import QuizView from '../components/QuizView.jsx';
import MarkdownRenderer from '../features/ui/display/MarkdownRenderer.jsx';
import { useQuizSession } from '../contexts/QuizContext.jsx';

export default function QuizPage() {
  const navigate = useNavigate();
  const quizState = useQuizSession();
  const quizHandlers = useQuizHandlers(quizState);

  const handleQuizComplete = () => {
    quizState.completeQuizSession();
    navigate('/results');
  };

  const handleCloseStudy = () => {
    navigate('/decks');
  };

  const handleEditQuiz = () => {
    navigate('/create-deck');
  };

  if (!quizState.quiz || quizState.quiz.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-950 mb-4">No Quiz Available</h2>
          <p className="text-slate-600 mb-6">Create a deck first to start practicing</p>
          <button
            onClick={() => navigate('/create-deck')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-6">
      <QuizView
        current={quizState.quiz[quizState.idx]}
        idx={quizState.idx}
        total={quizState.quiz.length}
        answeredCount={quizState.answeredCount}
        score={quizState.score}
        progress={quizState.progress}
        isReviewMode={quizState.isReviewMode}
        incorrectQuestions={quizState.incorrectQuestions}
        answers={quizState.answers}
        textAnswers={quizHandlers.textAnswers}
        showSuggestedAnswer={quizHandlers.showSuggestedAnswer}
        choose={quizState.choose}
        handleTextAnswer={quizHandlers.handleTextAnswer}
        submitTextAnswer={quizHandlers.submitTextAnswer}
        toggleSuggestedAnswer={quizHandlers.toggleSuggestedAnswer}
        handleSelfAssessment={quizHandlers.handleSelfAssessment}
        isAnswered={quizHandlers.isAnswered}
        goPrevious={quizHandlers.goPrevious}
        goNext={quizHandlers.goNext}
        MarkdownRenderer={MarkdownRenderer}
        shuffleMode={quizState.shuffleMode}
        keepFirstQuestion={quizState.keepFirstQuestion}
        toggleShuffleMode={quizState.toggleShuffleMode}
        toggleKeepFirstQuestion={quizState.toggleKeepFirstQuestion}
        showCardOverview={quizState.showCardOverview}
        setShowCardOverview={quizState.setShowCardOverview}
        jumpToQuestion={quizState.jumpToQuestion}
        quiz={quizState.quiz}
        onQuizComplete={handleQuizComplete}
        onCloseStudy={handleCloseStudy}
        onEditQuiz={handleEditQuiz}
      />
    </div>
  );
}
