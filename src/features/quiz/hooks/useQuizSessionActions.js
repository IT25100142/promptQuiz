import { useCallback } from 'react'
import { shuffleArray } from '../utils/shuffleQuiz.js'
import { getIncorrectQuestions } from '../utils/scoreSession.js'

/**
 * In-quiz navigation, answers (MC + text + self-assessment), shuffle, and session reset.
 */
export function useQuizSessionActions({
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
}) {
  const clearSessionTextState = useCallback(() => {
    setTextAnswers({})
    setShowSuggestedAnswer({})
  }, [setTextAnswers, setShowSuggestedAnswer])

  const toggleShuffleMode = useCallback(() => {
    const next = !shuffleMode
    setShuffleMode(next)

    if (next) {
      setOriginalQuiz([...quiz])
      const shuffled = shuffleArray(quiz, keepFirstQuestion)
      setQuiz(shuffled)
      setAnswers(Array(shuffled.length).fill(null))
      setIdx(0)
    } else if (originalQuiz.length > 0) {
      setQuiz(originalQuiz)
      setAnswers(Array(originalQuiz.length).fill(null))
      setIdx(0)
    }
  }, [shuffleMode, quiz, keepFirstQuestion, originalQuiz, setShuffleMode, setOriginalQuiz, setQuiz, setAnswers, setIdx])

  const jumpToQuestion = useCallback(
    (questionIndex) => {
      if (questionIndex >= 0 && questionIndex < quiz.length) {
        setIdx(questionIndex)
      }
    },
    [quiz.length, setIdx],
  )

  const choose = useCallback(
    (answerIdx) => {
      setAnswers((prev) => {
        const next = [...prev]
        next[idx] = answerIdx
        return next
      })
    },
    [idx, setAnswers],
  )

  const handleTextAnswer = useCallback(
    (value, blankIndex = null) => {
      setTextAnswers((prev) => {
        if (blankIndex !== null) {
          return { ...prev, [`${idx}-${blankIndex}`]: value }
        }
        return { ...prev, [idx]: value }
      })
    },
    [idx, setTextAnswers],
  )

  const submitTextAnswer = useCallback(() => {
    if (!current) return

    let isCorrect = false
    let userAnswer = ''

    switch (current.type) {
      case 'fill-blank': {
        const user = textAnswers[idx] || ''
        userAnswer = user
        if (user && current.answers) {
          const normalizedAnswer = user.toLowerCase().trim()
          const correctAnswers = current.answers.map((a) => a.toLowerCase().trim())
          isCorrect = correctAnswers.includes(normalizedAnswer)
        }
        break
      }
      case 'cloze': {
        const clozeAnswers = []
        const blanks = current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          clozeAnswers.push(textAnswers[`${idx}-${i}`])
        }
        userAnswer = clozeAnswers.join(', ')
        if (clozeAnswers.every((a) => a) && current.answers) {
          const normalizedAnswers = clozeAnswers.map((a) => a.toLowerCase().trim())
          const correctAnswers = current.answers.map((a) => a.toLowerCase().trim())
          isCorrect = normalizedAnswers.every((a) => correctAnswers.includes(a))
        }
        break
      }
      default:
        break
    }

    setAnswers((prev) =>
      prev.map((answer, answerIdx) =>
        answerIdx === idx ? { isCorrect, userAnswer } : answer,
      ),
    )
  }, [current, idx, textAnswers, setAnswers])

  const toggleSuggestedAnswer = useCallback(() => {
    setShowSuggestedAnswer((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }, [idx, setShowSuggestedAnswer])

  const handleSelfAssessment = useCallback(
    (isCorrect) => {
      setAnswers((prev) =>
        prev.map((answer, answerIdx) =>
          answerIdx === idx
            ? {
                ...answer,
                selfAssessed: true,
                selfAssessedCorrect: isCorrect,
              }
            : answer,
        ),
      )
    },
    [idx, setAnswers],
  )

  const isAnswered = useCallback(() => {
    if (!current) return false

    switch (current.type) {
      case 'multiple-choice':
      case 'true-false':
        return answers[idx] !== null
      case 'fill-blank':
        return (
          textAnswers[idx] !== undefined &&
          textAnswers[idx] !== '' &&
          answers[idx]?.isCorrect !== undefined
        )
      case 'cloze': {
        const blanks = current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          if (!textAnswers[`${idx}-${i}`]) return false
        }
        return answers[idx]?.isCorrect !== undefined
      }
      case 'short-answer':
        return answers[idx]?.selfAssessed !== undefined
      default:
        return false
    }
  }, [current, answers, textAnswers, idx])

  const goPrevious = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1))
  }, [setIdx])

  const completeQuizSession = useCallback(() => {
    setIncorrectQuestions(getIncorrectQuestions(quiz, answers, textAnswers))
    setIsReviewMode((prev) => !!prev)
  }, [quiz, answers, textAnswers, setIncorrectQuestions, setIsReviewMode])

  const goNext = useCallback(() => {
    if (!isAnswered()) return

    if (idx + 1 >= total) {
      completeQuizSession()
      return
    }

    setIdx((i) => i + 1)
  }, [isAnswered, idx, total, completeQuizSession, setIdx])

  const restartSession = useCallback(() => {
    setAnswers(Array(total).fill(null))
    clearSessionTextState()
    setIdx(0)
    setIsReviewMode(false)
    setIncorrectQuestions([])
  }, [total, clearSessionTextState, setAnswers, setIdx, setIsReviewMode, setIncorrectQuestions])

  const resetTextAnswers = useCallback(() => {
    clearSessionTextState()
  }, [clearSessionTextState])

  const toggleKeepFirstQuestion = useCallback(() => {
    const next = !keepFirstQuestion
    setKeepFirstQuestion(next)

    if (shuffleMode && quiz.length > 0) {
      const baseQuiz = originalQuiz.length > 0 ? originalQuiz : quiz
      const shuffled = shuffleArray(baseQuiz, next)
      setQuiz(shuffled)
      setAnswers(Array(shuffled.length).fill(null))
      setIdx(0)
    }
  }, [keepFirstQuestion, shuffleMode, quiz, originalQuiz, setKeepFirstQuestion, setQuiz, setAnswers, setIdx])

  return {
    clearSessionTextState,
    toggleShuffleMode,
    jumpToQuestion,
    choose,
    handleTextAnswer,
    submitTextAnswer,
    toggleSuggestedAnswer,
    handleSelfAssessment,
    isAnswered,
    goPrevious,
    goNext,
    completeQuizSession,
    restartSession,
    resetTextAnswers,
    toggleKeepFirstQuestion,
  }
}
