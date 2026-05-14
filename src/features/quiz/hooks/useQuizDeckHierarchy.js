import { useState } from 'react'
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

/**
 * Deck / quiz folder hierarchy and CRUD (IndexedDB-backed).
 */
export function useQuizDeckHierarchy({
  setQuiz,
  setAnswers,
  setIdx,
  setSavedDecks,
}) {
  const [currentQuizId, setCurrentQuizId] = useState(null)
  const [deckQuizzes, setDeckQuizzes] = useState([])
  const [selectedDeckForQuiz, setSelectedDeckForQuiz] = useState(null)
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false)

  const createNewDeck = async (deckName) => {
    if (!deckName.trim()) {
      throw new Error('Deck name cannot be empty')
    }

    const deckId = await createDeck(deckName.trim())
    const updatedDecks = await getAllDecks()
    setSavedDecks(updatedDecks)
    return deckId
  }

  const createNewQuiz = async (deckId, quizName) => {
    if (!deckId) {
      throw new Error('Please select a deck first')
    }
    if (!quizName.trim()) {
      throw new Error('Quiz name cannot be empty')
    }

    const quizId = await createQuiz(deckId, quizName.trim())
    await loadDeckQuizzes(deckId)
    return quizId
  }

  const loadDeckQuizzes = async (deckId) => {
    const quizzes = await getQuizzesByDeckId(deckId)
    setDeckQuizzes(quizzes)
    setSelectedDeckForQuiz(deckId)
    return quizzes
  }

  const loadQuizQuestions = async (quizId) => {
    const questions = await getQuestionsByQuizId(quizId)
    setQuiz(questions)
    setAnswers(Array(questions.length).fill(null))
    setIdx(0)
    setCurrentQuizId(quizId)
    return questions
  }

  const addQuestionsToQuiz = async (quizId, deckId, questions) => {
    if (!quizId || questions.length === 0) {
      throw new Error('No questions to add')
    }

    await addQuestions(quizId, deckId, questions)
    await loadQuizQuestions(quizId)
  }

  const updateQuizQuestion = async (questionId, updates) => {
    await updateQuestion(questionId, updates)
    if (currentQuizId) {
      await loadQuizQuestions(currentQuizId)
    }
  }

  const deleteQuizQuestion = async (questionId) => {
    await deleteQuestion(questionId)
    if (currentQuizId) {
      await loadQuizQuestions(currentQuizId)
    }
  }

  const deleteQuizById = async (quizId) => {
    await deleteQuiz(quizId)
    if (selectedDeckForQuiz) {
      await loadDeckQuizzes(selectedDeckForQuiz)
    }
    if (currentQuizId === quizId) {
      setCurrentQuizId(null)
      setQuiz([])
      setAnswers([])
      setIdx(0)
    }
  }

  const updateDeckInfo = async (deckId, updates) => {
    await updateDeck(deckId, updates)
    const updatedDecks = await getAllDecks()
    setSavedDecks(updatedDecks)
  }

  const updateQuizInfo = async (quizId, updates) => {
    await updateQuiz(quizId, updates)
    if (selectedDeckForQuiz) {
      await loadDeckQuizzes(selectedDeckForQuiz)
    }
  }

  return {
    currentQuizId,
    deckQuizzes,
    selectedDeckForQuiz,
    isCreatingDeck,
    isCreatingQuiz,
    setCurrentQuizId,
    setDeckQuizzes,
    setSelectedDeckForQuiz,
    setIsCreatingDeck,
    setIsCreatingQuiz,
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
  }
}
