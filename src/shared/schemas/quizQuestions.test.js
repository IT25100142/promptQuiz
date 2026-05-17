import { describe, it, expect } from 'vitest'
import {
  validateQuizQuestions,
  validateLibrarySnapshot,
} from './quizQuestions.js'

describe('validateQuizQuestions', () => {
  it('accepts a valid multiple-choice list', () => {
    const q = [
      {
        type: 'multiple-choice',
        question: 'Pick one',
        options: ['a', 'b'],
        answerIndex: 0,
      },
    ]
    const r = validateQuizQuestions(q)
    expect(r.ok).toBe(true)
    expect(r.value).toEqual(q)
  })

  it('rejects an empty list', () => {
    const r = validateQuizQuestions([])
    expect(r.ok).toBe(false)
  })

  it('rejects non-object entries', () => {
    const r = validateQuizQuestions(['not-an-object'])
    expect(r.ok).toBe(false)
  })
})

describe('validateLibrarySnapshot', () => {
  it('accepts schema v1 with empty decks', () => {
    const snap = { schemaVersion: 1, exportedAt: '2026-01-01', decks: [] }
    const r = validateLibrarySnapshot(snap)
    expect(r.ok).toBe(true)
  })

  it('accepts deck with empty quiz questions', () => {
    const snap = {
      schemaVersion: 1,
      decks: [{ name: 'D', quizzes: [{ name: 'Q', questions: [] }] }],
    }
    const r = validateLibrarySnapshot(snap)
    expect(r.ok).toBe(true)
  })

  it('rejects wrong schema version', () => {
    const r = validateLibrarySnapshot({ schemaVersion: 2, decks: [] })
    expect(r.ok).toBe(false)
  })
})
