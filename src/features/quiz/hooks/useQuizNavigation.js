/**
 * Compatibility layer: quiz interaction handlers live on {@link useQuiz} state.
 * Keeps the `useQuizHandlers(quizState)` call shape used by pages.
 */
export function useQuizHandlers(quizState) {
  return {
    textAnswers: quizState.textAnswers,
    showSuggestedAnswer: quizState.showSuggestedAnswer,
    handleTextAnswer: quizState.handleTextAnswer,
    submitTextAnswer: quizState.submitTextAnswer,
    toggleSuggestedAnswer: quizState.toggleSuggestedAnswer,
    handleSelfAssessment: quizState.handleSelfAssessment,
    isAnswered: quizState.isAnswered,
    goPrevious: quizState.goPrevious,
    goNext: quizState.goNext,
    restartSession: quizState.restartSession,
    startReviewMistakes: quizState.startReviewMistakes,
    editQuiz: quizState.prepareForEdit,
    resetTextAnswers: quizState.resetTextAnswers,
  }
}
