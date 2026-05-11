import { useState } from 'react'

export function useQuizHandlers(quizState) {
  const [textAnswers, setTextAnswers] = useState({})
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState({})

  // Text answer handlers
  const handleTextAnswer = (value, blankIndex = null) => {
    if (blankIndex !== null) {
      setTextAnswers(prev => ({
        ...prev,
        [`${quizState.idx}-${blankIndex}`]: value
      }))
    } else {
      setTextAnswers(prev => ({
        ...prev,
        [quizState.idx]: value
      }))
    }
  }

  const submitTextAnswer = () => {
    let isCorrect = false
    let userAnswer = ''
    
    switch (quizState.current?.type) {
      case 'fill-blank':
        userAnswer = textAnswers[quizState.idx] || ''
        if (userAnswer && quizState.current.answers) {
          const normalizedAnswer = userAnswer.toLowerCase().trim()
          const correctAnswers = quizState.current.answers.map(a => a.toLowerCase().trim())
          isCorrect = correctAnswers.includes(normalizedAnswer)
        }
        break
      case 'cloze':
        const clozeAnswers = []
        const blanks = quizState.current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          const answer = textAnswers[`${quizState.idx}-${i}`]
          clozeAnswers.push(answer)
        }
        userAnswer = clozeAnswers.join(', ')
        if (clozeAnswers.every(a => a) && quizState.current.answers) {
          const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
          const correctAnswers = quizState.current.answers.map(a => a.toLowerCase().trim())
          isCorrect = normalizedAnswers.every((a, i) => correctAnswers.includes(a))
        }
        break
    }
    
    quizState.setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIdx) => 
        answerIdx === quizState.idx ? { isCorrect, userAnswer } : answer
      ),
    )
  }

  const toggleSuggestedAnswer = () => {
    setShowSuggestedAnswer(prev => ({
      ...prev,
      [quizState.idx]: !prev[quizState.idx]
    }))
  }

  const handleSelfAssessment = (isCorrect) => {
    quizState.setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIdx) => 
        answerIdx === quizState.idx ? { 
          ...answer, 
          selfAssessed: true, 
          selfAssessedCorrect: isCorrect 
        } : answer
      ),
    )
  }

  const isAnswered = () => {
    if (!quizState.current) return false
    
    switch (quizState.current.type) {
      case 'multiple-choice':
      case 'true-false':
        return quizState.answers[quizState.idx] !== null
      case 'fill-blank':
        return textAnswers[quizState.idx] !== undefined && textAnswers[quizState.idx] !== '' && quizState.answers[quizState.idx]?.isCorrect !== undefined
      case 'cloze':
        const blanks = quizState.current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          if (!textAnswers[`${quizState.idx}-${i}`]) return false
        }
        return quizState.answers[quizState.idx]?.isCorrect !== undefined
      case 'short-answer':
        return quizState.answers[quizState.idx]?.selfAssessed !== undefined
      default:
        return false
    }
  }

  const goPrevious = () => {
    quizState.setIdx((currentIdx) => Math.max(0, currentIdx - 1))
  }

  const goNext = () => {
    if (!isAnswered()) return

    if (quizState.idx + 1 >= quizState.total) {
      // Identify incorrect questions for review
      const incorrect = quizState.quiz.filter((question, questionIdx) => {
        const answer = quizState.answers[questionIdx]
        const textAnswer = textAnswers[questionIdx]
        
        switch (question.type) {
          case 'multiple-choice':
            return answer !== question.answerIndex
          case 'true-false':
            return answer === null || ((answer === 1 ? question.answer : !question.answer)) === false
          case 'fill-blank':
            if (!textAnswer || !question.answers) return false
            const normalizedAnswer = textAnswer.toLowerCase().trim()
            const fillCorrectAnswers = question.answers.map(a => a.toLowerCase().trim())
            return !fillCorrectAnswers.includes(normalizedAnswer)
          case 'cloze':
            const clozeAnswers = []
            const blanks = question.question.split(/\{[^}]+\}/).length - 1
            for (let i = 0; i < blanks; i++) {
              const answer = textAnswers[`${questionIdx}-${i}`]
              clozeAnswers.push(answer)
            }
            if (!clozeAnswers.every(a => a) || !question.answers) return false
            const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
            const clozeCorrectAnswers = question.answers.map(a => a.toLowerCase().trim())
            return !normalizedAnswers.every((a, i) => clozeCorrectAnswers.includes(a))
          case 'short-answer':
            return answer?.selfAssessedCorrect === false
          default:
            return false
        }
      })
      
      quizState.setIncorrectQuestions(incorrect)
      quizState.setView('results')
      return
    }

    quizState.setIdx((currentIdx) => currentIdx + 1)
  }

  const restartSession = () => {
    quizState.setAnswers(Array(quizState.total).fill(null))
    setTextAnswers({})
    setShowSuggestedAnswer({})
    quizState.setIdx(0)
    quizState.setIsReviewMode(false)
    quizState.setView('quiz')
  }

  const startReviewMistakes = () => {
    if (quizState.incorrectQuestions.length === 0) return
    
    quizState.setQuiz(quizState.incorrectQuestions)
    quizState.setAnswers(Array(quizState.incorrectQuestions.length).fill(null))
    setTextAnswers({})
    setShowSuggestedAnswer({})
    quizState.setIdx(0)
    quizState.setIsReviewMode(true)
    quizState.setView('quiz')
  }

  const editQuiz = () => {
    quizState.setView('input')
    quizState.setInputError('')
  }

  const resetTextAnswers = () => {
    setTextAnswers({})
    setShowSuggestedAnswer({})
  }

  return {
    textAnswers,
    showSuggestedAnswer,
    handleTextAnswer,
    submitTextAnswer,
    toggleSuggestedAnswer,
    handleSelfAssessment,
    isAnswered,
    goPrevious,
    goNext,
    restartSession,
    startReviewMistakes,
    editQuiz,
    resetTextAnswers
  }
}
