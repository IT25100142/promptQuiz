import { useEffect, useCallback } from 'react'
import {
  getAllDecks,
  deleteDeck,
  saveDeck,
  saveLastUsedDeckId,
  getLastUsedDeckId,
} from '../../../shared/services/indexedDB.js'
import { loadQuestionsForDeck } from '../utils/deckQuestionLoader.js'

export function useQuizDeckSync({
  dispatch,
  quiz,
  currentDeckId,
  clearSessionTextState,
  hierarchy,
  selectedDeckForQuiz,
}) {
  const setState = useCallback(
    (payload) => dispatch({ type: 'SET_STATE', payload }),
    [dispatch],
  )

  useEffect(() => {
    let cancelled = false

    const loadDecks = async () => {
      setState({ decksLoadStatus: 'loading', decksLoadError: null })
      try {
        const decks = await getAllDecks()
        if (cancelled) return
        setState({ savedDecks: decks })

        const lastUsedId = await getLastUsedDeckId()
        if (!lastUsedId) {
          setState({ decksLoadStatus: 'ready' })
          return
        }

        const deck = await loadQuestionsForDeck(lastUsedId)
        if (cancelled) return
        if (!deck || deck.questions.length === 0) {
          setState({ decksLoadStatus: 'ready' })
          return
        }

        setState({
          currentDeckId: lastUsedId,
          quiz: deck.questions,
          answers: Array(deck.questions.length).fill(null),
          idx: 0,
          currentQuizId: deck.firstQuizId ?? null,
          decksLoadStatus: 'ready',
        })
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setState({
          decksLoadError: e?.message || 'Failed to load decks',
          decksLoadStatus: 'error',
        })
      }
    }

    loadDecks()
    return () => {
      cancelled = true
    }
  }, [setState])

  const saveCurrentDeck = useCallback(
    async (deckName) => {
      if (!deckName.trim()) {
        throw new Error('Deck name cannot be empty')
      }

      if (quiz.length === 0) {
        throw new Error('No quiz data to save')
      }

      const deckId = await saveDeck(quiz, deckName)
      await saveLastUsedDeckId(deckId)
      setState({ currentDeckId: deckId })

      const updatedDecks = await getAllDecks()
      setState({ savedDecks: updatedDecks })
    },
    [quiz, setState],
  )

  const loadDeck = useCallback(
    async (deckId) => {
      const { questions, firstQuizId } = await loadQuestionsForDeck(deckId)
      if (questions.length === 0) {
        setState({ inputError: 'This deck has no questions yet.' })
        return
      }
      setState({
        currentDeckId: deckId,
        quiz: questions,
        answers: Array(questions.length).fill(null),
        idx: 0,
        currentQuizId: firstQuizId ?? null,
      })
      clearSessionTextState()
    },
    [clearSessionTextState, setState],
  )

  const deleteDeckById = useCallback(
    async (deckId) => {
      await deleteDeck(deckId)
      const updatedDecks = await getAllDecks()
      setState({ savedDecks: updatedDecks })

      if (selectedDeckForQuiz === deckId) {
        setState({ selectedDeckForQuiz: null, deckQuizzes: [] })
      }
      if (currentDeckId === deckId) {
        setState({
          currentDeckId: null,
          quiz: [],
          answers: [],
          idx: 0,
        })
        clearSessionTextState()
      }
    },
    [currentDeckId, selectedDeckForQuiz, clearSessionTextState, setState],
  )

  return { saveCurrentDeck, loadDeck, deleteDeckById }
}
