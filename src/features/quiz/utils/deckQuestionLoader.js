import {
  getDeckById,
  getQuizzesByDeckId,
  getQuestionsByQuizId,
} from '../../../shared/services/indexedDB.js'

/**
 * Loads all questions for a deck: prefers legacy `deck.questions`, otherwise
 * merges questions from all quizzes (quiz order by id, then question `order`).
 */
export async function loadQuestionsForDeck(deckId) {
  const deck = await getDeckById(deckId)
  if (!deck) return { questions: [], firstQuizId: null }

  if (Array.isArray(deck.questions) && deck.questions.length > 0) {
    return { questions: deck.questions, firstQuizId: null }
  }

  const quizzes = await getQuizzesByDeckId(deckId)
  if (!quizzes.length) {
    return { questions: [], firstQuizId: null }
  }

  const orderedQuizzes = [...quizzes].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  const allQuestions = []
  let firstQuizId = null

  for (const q of orderedQuizzes) {
    if (firstQuizId == null) firstQuizId = q.id
    const qs = await getQuestionsByQuizId(q.id)
    allQuestions.push(...qs)
  }

  return { questions: allQuestions, firstQuizId }
}
