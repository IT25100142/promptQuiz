import { describe, it, expect } from 'vitest'
import { safeParseQuizJson, SAMPLE_QUIZ } from './helpers.js'

const aiStyleBlock = `What does OOP stand for?
A. Object-Oriented Programming
B. Objective Oriented Protocol
C. Object Origin Programming
D. Ordered Object Programming
*A

[T/F] Procedural programming is a top-down approach.
*True

[FIB] A class is a _______ for creating objects.
*blueprint`

describe('safeParseQuizJson', () => {
  it('parses valid JSON array', () => {
    const json = JSON.stringify(SAMPLE_QUIZ)
    const result = safeParseQuizJson(json)
    expect(result.ok).toBe(true)
    expect(result.value).toHaveLength(SAMPLE_QUIZ.length)
  })

  it('rejects empty input', () => {
    const result = safeParseQuizJson('   ')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('parses AI-style plain text (unnumbered MCQ and typed lines)', () => {
    const result = safeParseQuizJson(aiStyleBlock)
    expect(result.ok).toBe(true)
    expect(result.value).toHaveLength(3)
    expect(result.value[0].type).toBe('multiple-choice')
    expect(result.value[0].question).toContain('OOP')
    expect(result.value[1].type).toBe('true-false')
    expect(result.value[1].answer).toBe(true)
    expect(result.value[2].type).toBe('fill-blank')
    expect(result.value[2].question).toContain('___')
    expect(result.value[2].answers[0]).toBe('blueprint')
  })
})
