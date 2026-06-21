import { useCallback } from 'react'
import { getDueReviews, getQuestionById } from '../../../shared/services/indexedDB.js'

export function useQuizReviewActions({
  dispatch,
  isSpacedRepetition,
  incorrectQuestions,
  clearSessionTextState,
}) {
  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [dispatch],
  )

  const toggleSpacedRepetition = useCallback(() => {
    const next = !isSpacedRepetition
    setState({
      isSpacedRepetition: next,
      showReviewButtons: next,
    })
  }, [isSpacedRepetition, setState])

  const startReviewMistakes = useCallback(() => {
    if (incorrectQuestions.length === 0) return

    setState({
      quiz: incorrectQuestions,
      answers: Array(incorrectQuestions.length).fill(null),
      idx: 0,
      isReviewMode: true,
    })
    clearSessionTextState()
  }, [incorrectQuestions, setState, clearSessionTextState])

  const startDailyReview = useCallback(async () => {
    try {
      const dueReviews = await getDueReviews()
      if (!dueReviews?.length) {
        setState({
          appNotice: {
            tone: 'info',
            message: 'No cards are due for review right now.',
          },
        })
        return
      }

      const questionIds = [
        ...new Set(dueReviews.map((r) => r.questionId).filter(Boolean)),
      ]
      const loaded = await Promise.all(questionIds.map((id) => getQuestionById(id)))
      const questionsToReview = loaded.filter(Boolean)

      if (questionsToReview.length === 0) {
        setState({
          appNotice: {
            tone: 'warning',
            message:
              'No question data found for due reviews. Complete a quiz with spaced repetition enabled first.',
          },
        })
        return
      }

      setState({
        quiz: questionsToReview,
        answers: Array(questionsToReview.length).fill(null),
        idx: 0,
        isReviewMode: true,
      })
      clearSessionTextState()
    } catch (err) {
      console.error(err)
      setState({
        appNotice: {
          tone: 'error',
          message: 'Could not start daily review. Please try again.',
        },
      })
    }
  }, [setState, clearSessionTextState])

  return { toggleSpacedRepetition, startReviewMistakes, startDailyReview }
}
