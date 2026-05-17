import { createContext, useContext } from 'react'
import { useQuiz } from '../features/quiz/hooks/useQuizState.js'

const QuizSessionContext = createContext(null)
const QuizLibraryContext = createContext(null)
const QuizShellContext = createContext(null)

export function QuizProvider({ children }) {
  const { session, library, shell } = useQuiz()

  return (
    <QuizSessionContext.Provider value={session}>
      <QuizLibraryContext.Provider value={library}>
        <QuizShellContext.Provider value={shell}>{children}</QuizShellContext.Provider>
      </QuizLibraryContext.Provider>
    </QuizSessionContext.Provider>
  )
}

export function useQuizSession() {
  const ctx = useContext(QuizSessionContext)
  if (!ctx) {
    throw new Error('useQuizSession must be used within a QuizProvider')
  }
  return ctx
}

export function useQuizLibrary() {
  const ctx = useContext(QuizLibraryContext)
  if (!ctx) {
    throw new Error('useQuizLibrary must be used within a QuizProvider')
  }
  return ctx
}

export function useQuizShell() {
  const ctx = useContext(QuizShellContext)
  if (!ctx) {
    throw new Error('useQuizShell must be used within a QuizProvider')
  }
  return ctx
}
