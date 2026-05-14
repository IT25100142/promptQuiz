import { useCallback } from 'react'
import { SAMPLE_QUIZ } from '../../../shared/utils/helpers.js'

/**
 * Raw JSON / paste input helpers (sample, format, clear, start from preview).
 */
export function useQuizJsonInput({
  rawJson,
  setRawJson,
  setInputError,
  setQuiz,
  setAnswers,
  setIdx,
  setCurrentDeckId,
  preview,
  clearSessionTextState,
  setIsReviewMode,
}) {
  const loadSample = useCallback(() => {
    setRawJson(JSON.stringify(SAMPLE_QUIZ, null, 2))
    setInputError('')
  }, [setRawJson, setInputError])

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(rawJson)
      setRawJson(JSON.stringify(parsed, null, 2))
      setInputError('')
    } catch {
      setInputError('Invalid JSON format')
    }
  }, [rawJson, setRawJson, setInputError])

  const clearQuiz = useCallback(() => {
    setRawJson('')
    setQuiz([])
    setAnswers([])
    setIdx(0)
    setInputError('')
    setCurrentDeckId(null)
    clearSessionTextState()
  }, [
    setRawJson,
    setQuiz,
    setAnswers,
    setIdx,
    setInputError,
    setCurrentDeckId,
    clearSessionTextState,
  ])

  const startQuiz = useCallback(() => {
    if (!preview.ok) {
      setInputError(preview.error)
      return false
    }
    setQuiz(preview.value)
    setAnswers(Array(preview.value.length).fill(null))
    setIdx(0)
    setInputError('')
    setIsReviewMode(false)
    clearSessionTextState()
    return true
  }, [preview, setQuiz, setAnswers, setIdx, setInputError, setIsReviewMode, clearSessionTextState])

  const prepareForEdit = useCallback(() => {
    setInputError('')
  }, [setInputError])

  return { loadSample, formatJson, clearQuiz, startQuiz, prepareForEdit }
}
