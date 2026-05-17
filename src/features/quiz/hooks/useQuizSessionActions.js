import { useCallback } from 'react'
import { shuffleArray } from '../utils/shuffleQuiz.js'
import { getIncorrectQuestions } from '../utils/scoreSession.js'

export function useQuizSessionActions({
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
}) {
  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [dispatch],
  )

  const clearSessionTextState = useCallback(() => {
    setState({ textAnswers: {}, showSuggestedAnswer: {} })
  }, [setState])

  const toggleShuffleMode = useCallback(() => {
    const next = !shuffleMode
    setState({ shuffleMode: next })

    if (next) {
      setState({
        originalQuiz: [...quiz],
        quiz: shuffleArray(quiz, keepFirstQuestion),
        answers: Array(quiz.length).fill(null),
        idx: 0,
      })
    } else if (originalQuiz.length > 0) {
      setState({
        quiz: originalQuiz,
        answers: Array(originalQuiz.length).fill(null),
        idx: 0,
      })
    }
  }, [
    shuffleMode,
    quiz,
    keepFirstQuestion,
    originalQuiz,
    setState,
  ])

  const jumpToQuestion = useCallback(
    (questionIndex) => {
      if (questionIndex >= 0 && questionIndex < quiz.length) {
        setState({ idx: questionIndex })
      }
    },
    [quiz.length, setState],
  )

  const choose = useCallback(
    (answerIdx) => {
      const next = [...answers]
      next[idx] = answerIdx
      setState({ answers: next })
    },
    [idx, answers, setState],
  )

  const handleTextAnswer = useCallback(
    (value, blankIndex = null) => {
      const key = blankIndex !== null ? `${idx}-${blankIndex}` : idx
      setState({ textAnswers: { ...textAnswers, [key]: value } })
    },
    [idx, textAnswers, setState],
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

    const nextAnswers = answers.map((answer, answerIdx) =>
      answerIdx === idx ? { isCorrect, userAnswer } : answer,
    )
    setState({ answers: nextAnswers })
  }, [current, idx, textAnswers, answers, setState])

  const toggleSuggestedAnswer = useCallback(() => {
    setState({
      showSuggestedAnswer: {
        ...showSuggestedAnswer,
        [idx]: !showSuggestedAnswer[idx],
      },
    })
  }, [idx, showSuggestedAnswer, setState])

  const handleSelfAssessment = useCallback(
    (isCorrect) => {
      const nextAnswers = answers.map((answer, answerIdx) =>
        answerIdx === idx
          ? {
              ...answer,
              selfAssessed: true,
              selfAssessedCorrect: isCorrect,
            }
          : answer,
      )
      setState({ answers: nextAnswers })
    },
    [idx, answers, setState],
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
    setState({ idx: Math.max(0, idx - 1) })
  }, [idx, setState])

  const completeQuizSession = useCallback(() => {
    setState({
      incorrectQuestions: getIncorrectQuestions(quiz, answers, textAnswers),
    })
  }, [quiz, answers, textAnswers, setState])

  const goNext = useCallback(() => {
    if (!isAnswered()) return

    if (idx + 1 >= total) {
      completeQuizSession()
      return
    }

    setState({ idx: idx + 1 })
  }, [isAnswered, idx, total, completeQuizSession, setState])

  const restartSession = useCallback(() => {
    clearSessionTextState()
    setState({
      answers: Array(total).fill(null),
      idx: 0,
      isReviewMode: false,
      incorrectQuestions: [],
    })
  }, [total, clearSessionTextState, setState])

  const resetTextAnswers = useCallback(() => {
    clearSessionTextState()
  }, [clearSessionTextState])

  const toggleKeepFirstQuestion = useCallback(() => {
    const next = !keepFirstQuestion
    setState({ keepFirstQuestion: next })

    if (shuffleMode && quiz.length > 0) {
      const baseQuiz = originalQuiz.length > 0 ? originalQuiz : quiz
      const shuffled = shuffleArray(baseQuiz, next)
      setState({
        quiz: shuffled,
        answers: Array(shuffled.length).fill(null),
        idx: 0,
      })
    }
  }, [
    keepFirstQuestion,
    shuffleMode,
    quiz,
    originalQuiz,
    setState,
  ])

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
