import { useState, useMemo, useCallback } from 'react'
import { parseRawInput } from '../../../shared/utils/parsers.js'
import { validateQuestionStructure } from '../../../shared/schemas/quizQuestions.js'

/**
 * Pure parse + validate pipeline shared by all import entry points.
 * @returns {{ ok: true, questions: object[] } | { ok: false, error: string }}
 */
export function parseAndValidateRawInput(rawText) {
  if (!rawText?.trim()) {
    return { ok: false, error: 'Please paste or type study questions to import.' }
  }

  try {
    const parsed = parseRawInput(rawText)
    if (parsed.length === 0) {
      return {
        ok: false,
        error: 'No valid questions found in pasted text. Please check formatting guidelines.',
      }
    }

    const validation = validateQuestionStructure(parsed)
    if (!validation.ok) {
      return { ok: false, error: validation.error || 'Question validation failed.' }
    }

    return { ok: true, questions: validation.value }
  } catch (err) {
    return { ok: false, error: err.message || 'Formatting validation failed.' }
  }
}

/**
 * Shared import orchestration: live validation + append-to-quiz persistence.
 */
export function useQuestionImport(library) {
  const [rawText, setRawText] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const validationResult = useMemo(() => {
    if (!rawText.trim()) return null
    return parseAndValidateRawInput(rawText)
  }, [rawText])

  const getValidatedQuestions = useCallback(
    (text = rawText) => {
      const result = parseAndValidateRawInput(text)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return result.questions
    },
    [rawText],
  )

  const appendToQuiz = useCallback(
    async (quizId, deckId, text = rawText) => {
      const questions = getValidatedQuestions(text)

      setIsImporting(true)
      try {
        const addedCount = await library.addQuestionsToQuiz(quizId, deckId, questions)
        return { addedCount, questions }
      } finally {
        setIsImporting(false)
      }
    },
    [getValidatedQuestions, library, rawText],
  )

  const reset = useCallback(() => {
    setRawText('')
    setIsImporting(false)
  }, [])

  return {
    rawText,
    setRawText,
    validationResult,
    isImporting,
    getValidatedQuestions,
    appendToQuiz,
    reset,
  }
}
