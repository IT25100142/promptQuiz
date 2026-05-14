import { useState, useMemo, useLayoutEffect, useRef } from 'react'
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

export function useQuiz() {
  const [rawJson, setRawJson] = useState('')
  const [inputError, setInputError] = useState('')
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState([])
  const [idx, setIdx] = useState(0)
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [savedDecks, setSavedDecks] = useState([])

  const [decksLoadStatus, setDecksLoadStatus] = useState('idle')
  const [decksLoadError, setDecksLoadError] = useState(null)
  const [appNotice, setAppNotice] = useState(null)

  const [isReviewMode, setIsReviewMode] = useState(false)
  const [incorrectQuestions, setIncorrectQuestions] = useState([])
  const [isSpacedRepetition, setIsSpacedRepetition] = useState(false)
  const [showReviewButtons, setShowReviewButtons] = useState(false)
  const [reviewSchedule, setReviewSchedule] = useState([])

  const [shuffleMode, setShuffleMode] = useState(false)
  const [keepFirstQuestion, setKeepFirstQuestion] = useState(false)
  const [originalQuiz, setOriginalQuiz] = useState([])
  const [showCardOverview, setShowCardOverview] = useState(false)

  const [aiResponse, setAiResponse] = useState('')
  const [parseMessage, setParseMessage] = useState('')
  const [showAIPromptBuilder, setShowAIPromptBuilder] = useState(false)

  const [textAnswers, setTextAnswers] = useState({})
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState({})

  const hierarchy = useQuizDeckHierarchy({
    setQuiz,
    setAnswers,
    setIdx,
    setSavedDecks,
  })
  const hierarchyRef = useRef(hierarchy)
  useLayoutEffect(() => {
    hierarchyRef.current = hierarchy
  }, [hierarchy])

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
  const preview = useMemo(() => safeParseQuizJson(rawJson), [rawJson])

  const session = useQuizSessionActions({
    quiz,
    setQuiz,
    answers,
    setAnswers,
    idx,
    setIdx,
    current,
    total,
    textAnswers,
    setTextAnswers,
    setShowSuggestedAnswer,
    shuffleMode,
    setShuffleMode,
    keepFirstQuestion,
    setKeepFirstQuestion,
    originalQuiz,
    setOriginalQuiz,
    setIncorrectQuestions,
    setIsReviewMode,
  })

  const jsonInput = useQuizJsonInput({
    rawJson,
    setRawJson,
    setInputError,
    setQuiz,
    setAnswers,
    setIdx,
    setCurrentDeckId,
    preview,
    clearSessionTextState: session.clearSessionTextState,
    setIsReviewMode,
  })

  const review = useQuizReviewActions({
    setIsSpacedRepetition,
    setShowReviewButtons,
    setAppNotice,
    incorrectQuestions,
    setQuiz,
    setAnswers,
    setIdx,
    clearSessionTextState: session.clearSessionTextState,
    setIsReviewMode,
  })

  const deckSync = useQuizDeckSync({
    hierarchy,
    setSavedDecks,
    setDecksLoadStatus,
    setDecksLoadError,
    setCurrentDeckId,
    setQuiz,
    setAnswers,
    setIdx,
    setInputError,
    quiz,
    currentDeckId,
    clearSessionTextState: session.clearSessionTextState,
  })

  return useMemo(
    () => ({
      rawJson,
      inputError,
      quiz,
      answers,
      idx,
      current,
      total,
      answeredCount,
      score,
      progress,
      preview,
      currentDeckId,
      savedDecks,
      decksLoadStatus,
      decksLoadError,
      appNotice,
      setAppNotice,
      isReviewMode,
      incorrectQuestions,
      isSpacedRepetition,
      showReviewButtons,
      reviewSchedule,
      parseMessage,
      showAIPromptBuilder,
      aiResponse,
      shuffleMode,
      keepFirstQuestion,
      originalQuiz,
      showCardOverview,
      textAnswers,
      showSuggestedAnswer,

      currentQuizId: hierarchy.currentQuizId,
      deckQuizzes: hierarchy.deckQuizzes,
      selectedDeckForQuiz: hierarchy.selectedDeckForQuiz,
      isCreatingDeck: hierarchy.isCreatingDeck,
      isCreatingQuiz: hierarchy.isCreatingQuiz,

      toggleSpacedRepetition: review.toggleSpacedRepetition,
      loadSample: jsonInput.loadSample,
      formatJson: jsonInput.formatJson,
      clearQuiz: jsonInput.clearQuiz,
      startQuiz: jsonInput.startQuiz,
      choose: session.choose,
      completeQuizSession: session.completeQuizSession,
      restartSession: session.restartSession,
      startDailyReview: review.startDailyReview,
      saveCurrentDeck: deckSync.saveCurrentDeck,
      loadDeck: deckSync.loadDeck,
      deleteDeck: deckSync.deleteDeckById,
      prepareForEdit: jsonInput.prepareForEdit,
      startReviewMistakes: review.startReviewMistakes,
      toggleShuffleMode: session.toggleShuffleMode,
      toggleKeepFirstQuestion: session.toggleKeepFirstQuestion,
      jumpToQuestion: session.jumpToQuestion,

      handleTextAnswer: session.handleTextAnswer,
      submitTextAnswer: session.submitTextAnswer,
      toggleSuggestedAnswer: session.toggleSuggestedAnswer,
      handleSelfAssessment: session.handleSelfAssessment,
      isAnswered: session.isAnswered,
      goPrevious: session.goPrevious,
      goNext: session.goNext,
      resetTextAnswers: session.resetTextAnswers,

      createNewDeck: (...args) => hierarchyRef.current.createNewDeck(...args),
      createNewQuiz: (...args) => hierarchyRef.current.createNewQuiz(...args),
      loadDeckQuizzes: (...args) => hierarchyRef.current.loadDeckQuizzes(...args),
      loadQuizQuestions: (...args) => hierarchyRef.current.loadQuizQuestions(...args),
      addQuestionsToQuiz: (...args) => hierarchyRef.current.addQuestionsToQuiz(...args),
      updateQuizQuestion: (...args) => hierarchyRef.current.updateQuizQuestion(...args),
      deleteQuizQuestion: (...args) => hierarchyRef.current.deleteQuizQuestion(...args),
      deleteQuizById: (...args) => hierarchyRef.current.deleteQuizById(...args),
      updateDeckInfo: (...args) => hierarchyRef.current.updateDeckInfo(...args),
      updateQuizInfo: (...args) => hierarchyRef.current.updateQuizInfo(...args),

      setRawJson,
      setInputError,
      setQuiz,
      setAnswers,
      setIdx,
      setCurrentDeckId,
      setSavedDecks,
      setIsReviewMode,
      setIncorrectQuestions,
      setIsSpacedRepetition,
      setShowReviewButtons,
      setReviewSchedule,
      setParseMessage,
      setShowAIPromptBuilder,
      setAiResponse,
      setShuffleMode,
      setKeepFirstQuestion,
      setOriginalQuiz,
      setShowCardOverview,
      setCurrentQuizId: (...args) => hierarchyRef.current.setCurrentQuizId(...args),
      setDeckQuizzes: (...args) => hierarchyRef.current.setDeckQuizzes(...args),
      setSelectedDeckForQuiz: (...args) =>
        hierarchyRef.current.setSelectedDeckForQuiz(...args),
      setIsCreatingDeck: (...args) => hierarchyRef.current.setIsCreatingDeck(...args),
      setIsCreatingQuiz: (...args) => hierarchyRef.current.setIsCreatingQuiz(...args),
    }),
    [
      rawJson,
      inputError,
      quiz,
      answers,
      idx,
      current,
      total,
      answeredCount,
      score,
      progress,
      preview,
      currentDeckId,
      savedDecks,
      decksLoadStatus,
      decksLoadError,
      appNotice,
      isReviewMode,
      incorrectQuestions,
      isSpacedRepetition,
      showReviewButtons,
      reviewSchedule,
      parseMessage,
      showAIPromptBuilder,
      aiResponse,
      shuffleMode,
      keepFirstQuestion,
      originalQuiz,
      showCardOverview,
      textAnswers,
      showSuggestedAnswer,
      hierarchy.currentQuizId,
      hierarchy.deckQuizzes,
      hierarchy.selectedDeckForQuiz,
      hierarchy.isCreatingDeck,
      hierarchy.isCreatingQuiz,
      review.toggleSpacedRepetition,
      jsonInput.loadSample,
      jsonInput.formatJson,
      jsonInput.clearQuiz,
      jsonInput.startQuiz,
      session.choose,
      session.completeQuizSession,
      session.restartSession,
      review.startDailyReview,
      deckSync.saveCurrentDeck,
      deckSync.loadDeck,
      deckSync.deleteDeckById,
      jsonInput.prepareForEdit,
      review.startReviewMistakes,
      session.toggleShuffleMode,
      session.toggleKeepFirstQuestion,
      session.jumpToQuestion,
      session.handleTextAnswer,
      session.submitTextAnswer,
      session.toggleSuggestedAnswer,
      session.handleSelfAssessment,
      session.isAnswered,
      session.goPrevious,
      session.goNext,
      session.resetTextAnswers,
      setRawJson,
      setInputError,
      setQuiz,
      setAnswers,
      setIdx,
      setCurrentDeckId,
      setSavedDecks,
      setIsReviewMode,
      setIncorrectQuestions,
      setIsSpacedRepetition,
      setShowReviewButtons,
      setReviewSchedule,
      setParseMessage,
      setShowAIPromptBuilder,
      setAiResponse,
      setShuffleMode,
      setKeepFirstQuestion,
      setOriginalQuiz,
      setShowCardOverview,
      setAppNotice,
    ],
  )
}
