import { useCallback, useMemo } from 'react'
import {
  createDeck,
  updateDeck,
  getAllDecks,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByDeckId,
  addQuestions,
  getQuestionsByQuizId,
  updateQuestion,
  deleteQuestion,
} from '../../../shared/services/indexedDB.js'

export function useQuizDeckHierarchy({ dispatch }) {
  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [dispatch],
  )

  const loadDeckQuizzes = useCallback(
    async (deckId) => {
      const quizzes = await getQuizzesByDeckId(deckId)
      setState({ deckQuizzes: quizzes, selectedDeckForQuiz: deckId })
      return quizzes
    },
    [setState],
  )

  const loadQuizQuestions = useCallback(
    async (quizId) => {
      const questions = await getQuestionsByQuizId(quizId)
      setState({
        quiz: questions,
        answers: Array(questions.length).fill(null),
        idx: 0,
        currentQuizId: quizId,
      })
      return questions
    },
    [setState],
  )

  const createNewDeck = useCallback(
    async (deckName) => {
      if (!deckName.trim()) {
        throw new Error('Deck name cannot be empty')
      }

      const deckId = await createDeck(deckName.trim())
      const updatedDecks = await getAllDecks()
      setState({ savedDecks: updatedDecks })
      return deckId
    },
    [setState],
  )

  const createNewQuiz = useCallback(
    async (deckId, quizName) => {
      if (!deckId) {
        throw new Error('Please select a deck first')
      }
      if (!quizName.trim()) {
        throw new Error('Quiz name cannot be empty')
      }

      const quizId = await createQuiz(deckId, quizName.trim())
      await loadDeckQuizzes(deckId)
      return quizId
    },
    [loadDeckQuizzes],
  )

  const addQuestionsToQuiz = useCallback(
    async (quizId, deckId, questions) => {
      if (!quizId || questions.length === 0) {
        throw new Error('No questions to add')
      }

      await addQuestions(quizId, deckId, questions)
      await loadQuizQuestions(quizId)
    },
    [loadQuizQuestions],
  )

  const updateQuizQuestion = useCallback(
    async (questionId, updates, currentQuizId) => {
      await updateQuestion(questionId, updates)
      if (currentQuizId) {
        await loadQuizQuestions(currentQuizId)
      }
    },
    [loadQuizQuestions],
  )

  const deleteQuizQuestion = useCallback(
    async (questionId, currentQuizId) => {
      await deleteQuestion(questionId)
      if (currentQuizId) {
        await loadQuizQuestions(currentQuizId)
      }
    },
    [loadQuizQuestions],
  )

  const deleteQuizById = useCallback(
    async (quizId, selectedDeckForQuiz, currentQuizId) => {
      await deleteQuiz(quizId)
      if (selectedDeckForQuiz) {
        await loadDeckQuizzes(selectedDeckForQuiz)
      }
      if (currentQuizId === quizId) {
        setState({
          currentQuizId: null,
          quiz: [],
          answers: [],
          idx: 0,
        })
      }
    },
    [loadDeckQuizzes, setState],
  )

  const updateDeckInfo = useCallback(
    async (deckId, updates) => {
      await updateDeck(deckId, updates)
      const updatedDecks = await getAllDecks()
      setState({ savedDecks: updatedDecks })
    },
    [setState],
  )

  const updateQuizInfo = useCallback(
    async (quizId, updates, selectedDeckForQuiz) => {
      await updateQuiz(quizId, updates)
      if (selectedDeckForQuiz) {
        await loadDeckQuizzes(selectedDeckForQuiz)
      }
    },
    [loadDeckQuizzes],
  )

  return useMemo(
    () => ({
      createNewDeck,
      createNewQuiz,
      loadDeckQuizzes,
      loadQuizQuestions,
      addQuestionsToQuiz,
      updateQuizQuestion,
      deleteQuizQuestion,
      deleteQuizById,
      updateDeckInfo,
      updateQuizInfo,
    }),
    [
      createNewDeck,
      createNewQuiz,
      loadDeckQuizzes,
      loadQuizQuestions,
      addQuestionsToQuiz,
      updateQuizQuestion,
      deleteQuizQuestion,
      deleteQuizById,
      updateDeckInfo,
      updateQuizInfo,
    ],
  )
}
