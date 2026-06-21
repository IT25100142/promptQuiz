import { useCallback } from 'react'
import { SAMPLE_QUIZ } from '../../../shared/utils/helpers.js'
import { validateQuizQuestions } from '../../../shared/schemas/quizQuestions.js'

export function useQuizJsonInput({
  dispatch,
  rawJson,
  preview,
  clearSessionTextState,
}) {
  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [dispatch],
  )

  const loadSample = useCallback(() => {
    setState({ rawJson: JSON.stringify(SAMPLE_QUIZ, null, 2), inputError: '' })
  }, [setState])

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(rawJson)
      setState({ rawJson: JSON.stringify(parsed, null, 2), inputError: '' })
    } catch {
      setState({ inputError: 'Invalid JSON format' })
    }
  }, [rawJson, setState])

  const clearQuiz = useCallback(() => {
    setState({
      rawJson: '',
      quiz: [],
      answers: [],
      idx: 0,
      inputError: '',
      currentDeckId: null,
    })
    clearSessionTextState()
  }, [setState, clearSessionTextState])

  const startQuiz = useCallback(() => {
    if (!preview.ok) {
      setState({ inputError: preview.error })
      return false
    }
    const validated = validateQuizQuestions(preview.value)
    if (!validated.ok) {
      setState({ inputError: validated.error })
      return false
    }
    setState({
      quiz: validated.value,
      answers: Array(validated.value.length).fill(null),
      idx: 0,
      inputError: '',
      isReviewMode: false,
    })
    clearSessionTextState()
    return true
  }, [preview, setState, clearSessionTextState])

  const prepareForEdit = useCallback(() => {
    setState({ inputError: '' })
  }, [setState])

  return { loadSample, formatJson, clearQuiz, startQuiz, prepareForEdit }
}
