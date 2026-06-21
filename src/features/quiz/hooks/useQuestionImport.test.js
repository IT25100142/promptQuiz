import { describe, it, expect } from 'vitest'
import { parseAndValidateRawInput } from './useQuestionImport.js'

describe('parseAndValidateRawInput', () => {
  it('returns error for empty input', () => {
    const result = parseAndValidateRawInput('')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/paste/i)
  })

  it('parses and validates a true/false block', () => {
    const result = parseAndValidateRawInput('[T/F] React 19 is fully compatible.\n*True')
    expect(result.ok).toBe(true)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].type).toBe('true-false')
  })

  it('returns error when no questions are detected', () => {
    const result = parseAndValidateRawInput('   \n  ')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/paste/i)
  })
})
