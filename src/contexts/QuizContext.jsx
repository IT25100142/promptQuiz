import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuiz } from '../features/quiz/hooks/useQuizState.js';
import { initDB } from '../shared/services/indexedDB.js';

const QuizSessionContext = createContext(null);
const QuizLibraryContext = createContext(null);
const QuizShellContext = createContext(null);

export function QuizProvider({ children }) {
  const { session, library, shell } = useQuiz();

  useEffect(() => {
    // On initialization, trigger initDB() as requested
    initDB().catch((err) => {
      console.error('Failed to initialize database in provider:', err);
    });
  }, []);

  // Add compatibility helpers to match Step 7 layout/toast requirements
  const extendedShell = useMemo(() => ({
    ...shell,
    toast: shell.appNotice ? { message: shell.appNotice.message, type: shell.appNotice.tone || 'success' } : null,
    showToast: (message, type = 'success') => {
      shell.setAppNotice({ message, tone: type === 'error' ? 'error' : 'success' });
    }
  }), [shell]);

  return (
    <QuizSessionContext value={session}>
      <QuizLibraryContext value={library}>
        <QuizShellContext value={extendedShell}>
          {children}
        </QuizShellContext>
      </QuizLibraryContext>
    </QuizSessionContext>
  );
}

export function useQuizSession() {
  const ctx = useContext(QuizSessionContext);
  if (!ctx) {
    throw new Error('useQuizSession must be used within a QuizProvider');
  }
  return ctx;
}

export function useQuizLibrary() {
  const ctx = useContext(QuizLibraryContext);
  if (!ctx) {
    throw new Error('useQuizLibrary must be used within a QuizProvider');
  }
  return ctx;
}

export function useQuizShell() {
  const ctx = useContext(QuizShellContext);
  if (!ctx) {
    throw new Error('useQuizShell must be used within a QuizProvider');
  }
  return ctx;
}
