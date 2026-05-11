import { useState, useMemo, useEffect } from 'react'
import { 
  getAllDecks, 
  getDeckById, 
  saveDeck, 
  saveLastUsedDeckId,
  getLastUsedDeckId,
  clearLastUsedDeckId,
  saveReviewSchedule,
  getReviewSchedule,
  updateReviewSchedule,
  getDueReviews,
  deleteReviewSchedule
} from '../utils/indexedDB.js'
import { 
  SAMPLE_QUIZ,
  safeParseQuizJson, 
  parseCSVFormat, 
  parseMarkdownFormat, 
  parseTextFormat 
} from '../utils/helpers.js'

export function useQuiz() {
  // Core quiz state
  const [view, setView] = useState('input')
  const [rawJson, setRawJson] = useState('')
  const [inputError, setInputError] = useState('')
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState([])
  const [idx, setIdx] = useState(0)
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [savedDecks, setSavedDecks] = useState([])

  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [incorrectQuestions, setIncorrectQuestions] = useState([])
  const [isSpacedRepetition, setIsSpacedRepetition] = useState(false)
  const [showReviewButtons, setShowReviewButtons] = useState(false)
  const [reviewSchedule, setReviewSchedule] = useState([])
  
  const current = quiz[idx]
  const total = quiz.length
  const answeredCount = useMemo(() => {
    return answers.filter(answer => answer !== null).length
  }, [answers])
  const score = useMemo(() => {
    return answers.reduce((total, answer, idx) => {
      if (answer === null) return total
      
      const question = quiz[idx]
      if (!question) return total
      
      const isCorrect = question.answerIndex === answer || 
                     (question.type === 'fill-blank' && answer === question.answer) ||
                     (question.type === 'cloze' && answer === question.answer)
      
      return total + (isCorrect ? 1 : 0)
    }, 0)
  }, [quiz, answers])
  const progress = useMemo(() => total > 0 ? (answeredCount / total) * 100 : 0, [answeredCount, total])
  const preview = useMemo(() => {
    return safeParseQuizJson(rawJson)
  }, [rawJson])

  // Load saved decks on mount
  useEffect(() => {
    const loadDecks = async () => {
      const decks = await getAllDecks()
      setSavedDecks(decks)
      
      // Load last used deck
      const lastUsedId = await getLastUsedDeckId()
      if (lastUsedId) {
        const deck = await getDeckById(lastUsedId)
        if (deck) {
          setCurrentDeckId(lastUsedId)
          setQuiz(deck.questions)
          setAnswers(Array(deck.questions.length).fill(null))
          setIdx(0)
        }
      }
    }
    
    loadDecks()
  }, [])

  // Actions
  const toggleSpacedRepetition = () => {
    setIsSpacedRepetition(!isSpacedRepetition)
    setShowReviewButtons(!isSpacedRepetition)
  }

  const loadSample = () => {
    setRawJson(JSON.stringify(SAMPLE_QUIZ, null, 2))
    setInputError('')
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      setRawJson(JSON.stringify(parsed, null, 2))
      setInputError('')
    } catch (error) {
      setInputError('Invalid JSON format')
    }
  }

  const clearQuiz = () => {
    setRawJson('')
    setQuiz([])
    setAnswers([])
    setIdx(0)
    setInputError('')
    setCurrentDeckId(null)
  }

  const startQuiz = () => {
    if (preview.ok) {
      setQuiz(preview.value)
      setAnswers(Array(preview.value.length).fill(null))
      setIdx(0)
      setView('quiz')
      setInputError('')
    } else {
      setInputError(preview.error)
    }
  }

  const choose = (answerIdx) => {
    const newAnswers = [...answers]
    newAnswers[idx] = answerIdx
    setAnswers(newAnswers)
  }

  const goPrevious = () => {
    if (idx > 0) {
      setIdx(idx - 1)
    }
  }

  const goNext = () => {
    if (idx < quiz.length - 1) {
      setIdx(idx + 1)
    }
  }

  const isAnswered = () => {
    return answers[idx] !== null
  }

  const restartSession = () => {
    setIdx(0)
    setAnswers(Array(quiz.length).fill(null))
    setIsReviewMode(false)
    setIncorrectQuestions([])
  }

  const startDailyReview = () => {
    const dueReviews = getDueReviews()
    if (dueReviews.length > 0) {
      const questionsToReview = dueReviews.flatMap(review => review.questions)
      setQuiz(questionsToReview)
      setAnswers(Array(questionsToReview.length).fill(null))
      setIdx(0)
      setIsReviewMode(true)
      setView('quiz')
    }
  }

  const saveCurrentDeck = async (deckName) => {
    if (!deckName.trim()) {
      throw new Error('Deck name cannot be empty')
    }

    if (quiz.length === 0) {
      throw new Error('No quiz data to save')
    }

    const deck = {
      id: Date.now().toString(),
      name: deckName,
      questions: quiz,
      date: new Date().toISOString(),
      questionCount: quiz.length
    }

    await saveDeck(deck)
    await saveLastUsedDeckId(deck.id)
    setCurrentDeckId(deck.id)
    setSavedDecks(prev => [...prev, deck])
  }

  const loadDeck = async (deckId) => {
    const deck = await getDeckById(deckId)
    if (deck) {
      setCurrentDeckId(deckId)
      setQuiz(deck.questions)
      setAnswers(Array(deck.questions.length).fill(null))
      setIdx(0)
      setView('input')
    }
  }

  const deleteDeck = async (deckId) => {
    await deleteDeck(deckId)
    setSavedDecks(prev => prev.filter(d => d.id !== deckId))
    if (currentDeckId === deckId) {
      setCurrentDeckId(null)
      setQuiz([])
      setAnswers([])
      setIdx(0)
    }
  }

  const editQuiz = () => {
    setView('input')
  }

  const finishQuiz = () => {
    const incorrect = []
    
    quiz.forEach((question, questionIdx) => {
      const userAnswer = answers[questionIdx]
      const isCorrect = question.answerIndex === userAnswer || 
                         (question.type === 'fill-blank' && userAnswer === question.answer) ||
                         (question.type === 'cloze' && userAnswer === question.answer)

      if (!isCorrect && userAnswer !== null) {
        incorrect.push(question)
      }
    })

    setIsReviewMode(true)
    setIncorrectQuestions(incorrect)
    setView('results')
  }

  const startReviewMistakes = () => {
    if (incorrectQuestions.length > 0) {
      setQuiz(incorrectQuestions)
      setAnswers(Array(incorrectQuestions.length).fill(null))
      setIdx(0)
      setIsReviewMode(true)
      setView('quiz')
    }
  }

  const parseMessage = ''
  const showAIPromptBuilder = false

  return {
    // State
    view,
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
    isReviewMode,
    incorrectQuestions,
    isSpacedRepetition,
    showReviewButtons,
    reviewSchedule,
    parseMessage,
    showAIPromptBuilder,

    // Actions
    toggleSpacedRepetition,
    loadSample,
    formatJson,
    clearQuiz,
    startQuiz,
    choose,
    goPrevious,
    goNext,
    isAnswered,
    restartSession,
    startDailyReview,
    saveCurrentDeck,
    loadDeck,
    deleteDeck,
    editQuiz,
    finishQuiz,
    startReviewMistakes,

    // Setters
    setView,
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
    setShowAIPromptBuilder
  }
}
