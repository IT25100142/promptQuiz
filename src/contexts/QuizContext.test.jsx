import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QuizProvider, useQuizSession, useQuizLibrary } from './QuizContext.jsx';
import { closeDB } from '../shared/services/indexedDB.js';

// A test consumer component to read session slice
function SessionConsumer() {
  const session = useQuizSession();
  return (
    <div>
      <span data-testid="session-idx">{session.idx}</span>
      <button data-testid="next-btn" onClick={session.goNext}>Next</button>
      <button data-testid="prev-btn" onClick={session.goPrevious}>Prev</button>
      <button data-testid="set-quiz-btn" onClick={() => {
        session.setQuiz([
          { type: 'true-false', question: 'Q1', answer: true },
          { type: 'true-false', question: 'Q2', answer: false }
        ]);
      }}>Set Quiz</button>
    </div>
  );
}

// A test consumer component to read library slice
function LibraryConsumer() {
  const library = useQuizLibrary();
  const isLoading = library.decksLoadStatus === 'loading';
  return (
    <div>
      {isLoading ? (
        <span data-testid="library-loading">Loading...</span>
      ) : (
        <span data-testid="library-ready">Ready</span>
      )}
      <span data-testid="decks-count">{library.savedDecks?.length || 0}</span>
    </div>
  );
}

describe('QuizProvider Context Slices', () => {
  beforeEach(async () => {
    // Start with a clean DB
    await closeDB();
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('PromptQuizDB');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  afterEach(async () => {
    await closeDB();
  });

  it('renders loading status initially and becomes ready after loading decks', async () => {
    render(
      <QuizProvider>
        <LibraryConsumer />
      </QuizProvider>
    );

    // Should show loading status initially or transition to ready quickly
    expect(screen.getByTestId('library-loading')).toBeInTheDocument();

    // Eventually loading finished and shows ready status
    await waitFor(() => {
      expect(screen.getByTestId('library-ready')).toBeInTheDocument();
    });
    expect(screen.getByTestId('decks-count')).toHaveTextContent('0');
  });

  it('exposes correct isolated slices and triggers navigation actions', async () => {
    render(
      <QuizProvider>
        <SessionConsumer />
      </QuizProvider>
    );

    expect(screen.getByTestId('session-idx')).toHaveTextContent('0');

    // Load mock questions
    await act(async () => {
      screen.getByTestId('set-quiz-btn').click();
    });

    // Advance to next index
    await act(async () => {
      screen.getByTestId('next-btn').click();
    });
    expect(screen.getByTestId('session-idx')).toHaveTextContent('1');

    // Go back to previous index
    await act(async () => {
      screen.getByTestId('prev-btn').click();
    });
    expect(screen.getByTestId('session-idx')).toHaveTextContent('0');
  });

  it('throws an error when hooks are consumed outside of QuizProvider', () => {
    // Suppress console.error logging from React error boundary warnings for expected throws
    const originalConsoleError = console.error;
    console.error = () => {};

    const renderOutsideSession = () => render(<SessionConsumer />);
    const renderOutsideLibrary = () => render(<LibraryConsumer />);

    expect(renderOutsideSession).toThrow('useQuizSession must be used within a QuizProvider');
    expect(renderOutsideLibrary).toThrow('useQuizLibrary must be used within a QuizProvider');

    console.error = originalConsoleError;
  });
});
