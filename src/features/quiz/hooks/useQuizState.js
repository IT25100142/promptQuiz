import { useMemo, useReducer, useCallback } from 'react'
import { safeParseQuizJson } from '../../../shared/utils/helpers.js'
import {
  countAnswered,
  computeScore,
  progressPercent,
} from '../utils/quizDerivedMetrics.js'
import { useQuizDeckHierarchy } from './useQuizDeckHierarchy.js'
import { useQuizDeckSync } from './useQuizDeckSync.js'
import { useQuizJsonInput } from './useQuizJsonInput.js'
import { useQuizReviewActions } from './useQuizReviewActions.js'
import { useQuizSessionActions } from './useQuizSessionActions.js'
import { initialState, quizReducer } from './quizReducer.js'

export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  const {
    quiz,
    answers,
    idx,
    rawJson,
    textAnswers,
    currentDeckId,
    appNotice,
    parseMessage,
    showAIPromptBuilder,
    aiResponse,
    inputError,
    savedDecks,
    decksLoadStatus,
    decksLoadError,
    currentQuizId,
    deckQuizzes,
    selectedDeckForQuiz,
    isCreatingDeck,
    isCreatingQuiz,
    isReviewMode,
    incorrectQuestions,
    isSpacedRepetition,
    showReviewButtons,
    reviewSchedule,
    shuffleMode,
    keepFirstQuestion,
    originalQuiz,
    showCardOverview,
    showSuggestedAnswer,
  } = state

  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [],
  )

  const hierarchy = useQuizDeckHierarchy({ dispatch })

  const current = quiz[idx]
  const total = quiz.length
  const answeredCount = useMemo(() => countAnswered(answers), [answers])
  const score = useMemo(
    () => computeScore(quiz, answers, textAnswers),
    [quiz, answers, textAnswers],
  )
  const progress = useMemo(
    () => progressPercent(answeredCount, total),
    [answeredCount, total],
  )
  const parsedPreview = useMemo(() => safeParseQuizJson(rawJson), [rawJson])

  const sessionActions = useQuizSessionActions({
    dispatch,
    quiz,
    answers,
    idx,
    current,
    total,
    textAnswers,
    showSuggestedAnswer,
    shuffleMode,
    keepFirstQuestion,
    originalQuiz,
  })

  const jsonInput = useQuizJsonInput({
    dispatch,
    rawJson,
    preview: parsedPreview,
    clearSessionTextState: sessionActions.clearSessionTextState,
  })

  const review = useQuizReviewActions({
    dispatch,
    incorrectQuestions,
    clearSessionTextState: sessionActions.clearSessionTextState,
  })

  const deckSync = useQuizDeckSync({
    dispatch,
    quiz,
    currentDeckId,
    clearSessionTextState: sessionActions.clearSessionTextState,
    hierarchy,
    selectedDeckForQuiz,
  })

  const shell = useMemo(
    () => ({
      appNotice,
      setAppNotice: (appNotice) => setState({ appNotice }),
      parseMessage,
      setParseMessage: (parseMessage) => setState({ parseMessage }),
      showAIPromptBuilder,
      setShowAIPromptBuilder: (showAIPromptBuilder) =>
        setState({ showAIPromptBuilder }),
      aiResponse,
      setAiResponse: (aiResponse) => setState({ aiResponse }),
    }),
    [
      appNotice,
      parseMessage,
      showAIPromptBuilder,
      aiResponse,
      setState,
    ],
  )

  const library = useMemo(
    () => ({
      rawJson,
      inputError,
      preview: parsedPreview,
      currentDeckId,
      savedDecks,
      decksLoadStatus,
      decksLoadError,
      currentQuizId,
      deckQuizzes,
      selectedDeckForQuiz,
      isCreatingDeck,
      isCreatingQuiz,
      loadSample: jsonInput.loadSample,
      formatJson: jsonInput.formatJson,
      clearQuiz: jsonInput.clearQuiz,
      startQuiz: jsonInput.startQuiz,
      prepareForEdit: jsonInput.prepareForEdit,
      saveCurrentDeck: deckSync.saveCurrentDeck,
      loadDeck: deckSync.loadDeck,
      deleteDeck: deckSync.deleteDeckById,
      setRawJson: (rawJson) => setState({ rawJson }),
      setInputError: (inputError) => setState({ inputError }),
      setCurrentDeckId: (currentDeckId) => setState({ currentDeckId }),
      setSavedDecks: (savedDecks) => setState({ savedDecks }),
      ...hierarchy,
    }),
    [
      rawJson,
      inputError,
      parsedPreview,
      currentDeckId,
      savedDecks,
      decksLoadStatus,
      decksLoadError,
      currentQuizId,
      deckQuizzes,
      selectedDeckForQuiz,
      isCreatingDeck,
      isCreatingQuiz,
      jsonInput.loadSample,
      jsonInput.formatJson,
      jsonInput.clearQuiz,
      jsonInput.startQuiz,
      jsonInput.prepareForEdit,
      deckSync.saveCurrentDeck,
      deckSync.loadDeck,
      deckSync.deleteDeckById,
      hierarchy,
      setState,
    ],
  )

  const session = useMemo(
    () => ({
      quiz,
      answers,
      idx,
      current,
      total,
      answeredCount,
      score,
      progress,
      isReviewMode,
      incorrectQuestions,
      isSpacedRepetition,
      showReviewButtons,
      reviewSchedule,
      shuffleMode,
      keepFirstQuestion,
      originalQuiz,
      showCardOverview,
      textAnswers,
      showSuggestedAnswer,
      toggleSpacedRepetition: review.toggleSpacedRepetition,
      choose: sessionActions.choose,
      completeQuizSession: sessionActions.completeQuizSession,
      restartSession: sessionActions.restartSession,
      startDailyReview: review.startDailyReview,
      startReviewMistakes: review.startReviewMistakes,
      toggleShuffleMode: sessionActions.toggleShuffleMode,
      toggleKeepFirstQuestion: sessionActions.toggleKeepFirstQuestion,
      jumpToQuestion: sessionActions.jumpToQuestion,
      handleTextAnswer: sessionActions.handleTextAnswer,
      submitTextAnswer: sessionActions.submitTextAnswer,
      toggleSuggestedAnswer: sessionActions.toggleSuggestedAnswer,
      handleSelfAssessment: sessionActions.handleSelfAssessment,
      isAnswered: sessionActions.isAnswered,
      goPrevious: sessionActions.goPrevious,
      goNext: sessionActions.goNext,
      resetTextAnswers: sessionActions.resetTextAnswers,
      setQuiz: (quiz) => setState({ quiz }),
      setAnswers: (answers) => setState({ answers }),
      setIdx: (idx) => setState({ idx }),
      setIsReviewMode: (isReviewMode) => setState({ isReviewMode }),
      setIncorrectQuestions: (incorrectQuestions) =>
        setState({ incorrectQuestions }),
      setIsSpacedRepetition: (isSpacedRepetition) =>
        setState({ isSpacedRepetition }),
      setShowReviewButtons: (showReviewButtons) =>
        setState({ showReviewButtons }),
      setReviewSchedule: (reviewSchedule) => setState({ reviewSchedule }),
      setShuffleMode: (shuffleMode) => setState({ shuffleMode }),
      setKeepFirstQuestion: (keepFirstQuestion) =>
        setState({ keepFirstQuestion }),
      setOriginalQuiz: (originalQuiz) => setState({ originalQuiz }),
      setShowCardOverview: (showCardOverview) => setState({ showCardOverview }),
    }),
    [
      quiz,
      answers,
      idx,
      current,
      total,
      answeredCount,
      score,
      progress,
      isReviewMode,
      incorrectQuestions,
      isSpacedRepetition,
      showReviewButtons,
      reviewSchedule,
      shuffleMode,
      keepFirstQuestion,
      originalQuiz,
      showCardOverview,
      textAnswers,
      showSuggestedAnswer,
      review.toggleSpacedRepetition,
      sessionActions.choose,
      sessionActions.completeQuizSession,
      sessionActions.restartSession,
      review.startDailyReview,
      review.startReviewMistakes,
      sessionActions.toggleShuffleMode,
      sessionActions.toggleKeepFirstQuestion,
      sessionActions.jumpToQuestion,
      sessionActions.handleTextAnswer,
      sessionActions.submitTextAnswer,
      sessionActions.toggleSuggestedAnswer,
      sessionActions.handleSelfAssessment,
      sessionActions.isAnswered,
      sessionActions.goPrevious,
      sessionActions.goNext,
      sessionActions.resetTextAnswers,
      setState,
    ],
  )

  return { session, library, shell }
}
