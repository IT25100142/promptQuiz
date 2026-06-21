import { describe, it, expect } from 'vitest'
import { countAnswered, computeScore, progressPercent } from './quizDerivedMetrics.js'

describe('quizDerivedMetrics', () => {
  const quiz = [
    { type: 'multiple-choice', answerIndex: 0 },
    { type: 'multiple-choice', answerIndex: 1 },
  ]

  it('countAnswered', () => {
    expect(countAnswered([0, null])).toBe(1)
    expect(countAnswered([0, 1])).toBe(2)
  })

  it('computeScore', () => {
    expect(computeScore(quiz, [0, 1], {})).toBe(2)
    expect(computeScore(quiz, [0, 0], {})).toBe(1)
  })

  it('progressPercent', () => {
    expect(progressPercent(1, 4)).toBe(25)
    expect(progressPercent(0, 0)).toBe(0)
  })
})
