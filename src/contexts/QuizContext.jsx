import { createContext, useContext } from 'react'
import { useQuiz } from '../features/quiz/hooks/useQuizState.js'

const QuizContext = createContext()

export function QuizProvider({ children }) {
  const quizState = useQuiz()

  return (
    <QuizContext.Provider value={quizState}>
      {children}
    </QuizContext.Provider>
  )
}

export function useQuizContext() {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider')
  }
  return context
}
