import { useCallback } from 'react'
import { getDueReviews, getQuestionById } from '../../../shared/services/indexedDB.js'

/**
 * Spaced repetition toggles and review sessions (mistakes + daily due).
 */
export function useQuizReviewActions({
  setIsSpacedRepetition,
  setShowReviewButtons,
  setAppNotice,
  incorrectQuestions,
  setQuiz,
  setAnswers,
  setIdx,
  clearSessionTextState,
  setIsReviewMode,
}) {
  const toggleSpacedRepetition = useCallback(() => {
    setIsSpacedRepetition((v) => !v)
    setShowReviewButtons((v) => !v)
  }, [setIsSpacedRepetition, setShowReviewButtons])

  const startReviewMistakes = useCallback(() => {
    if (incorrectQuestions.length === 0) return

    setQuiz(incorrectQuestions)
    setAnswers(Array(incorrectQuestions.length).fill(null))
    clearSessionTextState()
    setIdx(0)
    setIsReviewMode(true)
  }, [incorrectQuestions, setQuiz, setAnswers, clearSessionTextState, setIdx, setIsReviewMode])

  const startDailyReview = useCallback(async () => {
    try {
      const dueReviews = await getDueReviews()
      if (!dueReviews?.length) {
        setAppNotice({
          tone: 'info',
          message: 'No cards are due for review right now.',
        })
        return
      }

      const questionIds = [
        ...new Set(dueReviews.map((r) => r.questionId).filter(Boolean)),
      ]
      const loaded = await Promise.all(questionIds.map((id) => getQuestionById(id)))
      const questionsToReview = loaded.filter(Boolean)

      if (questionsToReview.length === 0) {
        setAppNotice({
          tone: 'warning',
          message:
            'No question data found for due reviews. Complete a quiz with spaced repetition enabled first.',
        })
        return
      }

      setQuiz(questionsToReview)
      setAnswers(Array(questionsToReview.length).fill(null))
      setIdx(0)
      clearSessionTextState()
      setIsReviewMode(true)
    } catch (err) {
      console.error(err)
      setAppNotice({
        tone: 'error',
        message: 'Could not start daily review. Please try again.',
      })
    }
  }, [setAppNotice, setQuiz, setAnswers, setIdx, clearSessionTextState, setIsReviewMode])

  return { toggleSpacedRepetition, startReviewMistakes, startDailyReview }
}
