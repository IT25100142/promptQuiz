import { describe, it, expect } from 'vitest'
import { safeParseQuizJson, SAMPLE_QUIZ } from './helpers.js'

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
})
