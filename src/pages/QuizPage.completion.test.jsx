import { describe, it, expect } from 'vitest'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuizProvider, useQuizContext } from '../contexts/QuizContext.jsx'
import QuizPage from './QuizPage.jsx'

const twoMcq = [
  {
    type: 'multiple-choice',
    question: 'First?',
    options: ['yes', 'no'],
    answerIndex: 0,
  },
  {
    type: 'multiple-choice',
    question: 'Second?',
    options: ['yes', 'no'],
    answerIndex: 1,
  },
]

function SeedTwoMcq() {
  const ctx = useQuizContext()
  useEffect(() => {
    ctx.setQuiz(twoMcq)
    ctx.setAnswers([null, null])
    ctx.setIdx(0)
    ctx.setIncorrectQuestions([])
    ctx.setIsReviewMode(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- test bootstrap once
  }, [])
  return null
}

function ResultsWithMetrics() {
  const ctx = useQuizContext()
  return (
    <div>
      <div data-testid="results-page">Results</div>
      <span data-testid="session-score">{ctx.score}</span>
      <span data-testid="incorrect-count">{ctx.incorrectQuestions.length}</span>
    </div>
  )
}

describe('Quiz completion flow', () => {
  it('completing last question navigates to results with consistent score', async () => {
    render(
      <QuizProvider>
        <MemoryRouter initialEntries={['/quiz']}>
          <SeedTwoMcq />
          <Routes>
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/results" element={<ResultsWithMetrics />} />
          </Routes>
        </MemoryRouter>
      </QuizProvider>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/No Quiz Available/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByText('yes')[0].closest('button'))

    const nextBtns = screen.getAllByRole('button', { name: /next/i })
    fireEvent.click(nextBtns[nextBtns.length - 1])

    fireEvent.click(screen.getAllByText('yes')[0].closest('button'))

    fireEvent.click(screen.getByRole('button', { name: /see results/i }))

    await waitFor(() => {
      expect(screen.getByTestId('results-page')).toBeInTheDocument()
    })
    expect(screen.getByTestId('session-score')).toHaveTextContent('1')
    expect(screen.getByTestId('incorrect-count')).toHaveTextContent('1')
  })
})
