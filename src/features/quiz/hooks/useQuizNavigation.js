/**
 * Quiz interaction handlers from the session slice returned by {@link useQuizSession}.
 * Pages call `useQuizHandlers(session)` (same field names as the former combined quiz state).
 */
export function useQuizHandlers(session) {
  return {
    textAnswers: session.textAnswers,
    showSuggestedAnswer: session.showSuggestedAnswer,
    handleTextAnswer: session.handleTextAnswer,
    submitTextAnswer: session.submitTextAnswer,
    toggleSuggestedAnswer: session.toggleSuggestedAnswer,
    handleSelfAssessment: session.handleSelfAssessment,
    isAnswered: session.isAnswered,
    goPrevious: session.goPrevious,
    goNext: session.goNext,
    restartSession: session.restartSession,
    startReviewMistakes: session.startReviewMistakes,
    editQuiz: session.prepareForEdit,
    resetTextAnswers: session.resetTextAnswers,
  }
}
