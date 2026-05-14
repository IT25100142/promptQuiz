import { useEffect, useCallback } from 'react'
import {
  getAllDecks,
  deleteDeck,
  saveDeck,
  saveLastUsedDeckId,
  getLastUsedDeckId,
} from '../../../shared/services/indexedDB.js'
import { loadQuestionsForDeck } from '../utils/deckQuestionLoader.js'

/**
 * Initial deck list / last-used deck restore, plus save/load/delete deck helpers.
 */
export function useQuizDeckSync({
  hierarchy,
  setSavedDecks,
  setDecksLoadStatus,
  setDecksLoadError,
  setCurrentDeckId,
  setQuiz,
  setAnswers,
  setIdx,
  setInputError,
  quiz,
  currentDeckId,
  clearSessionTextState,
}) {
  useEffect(() => {
    let cancelled = false

    const loadDecks = async () => {
      setDecksLoadStatus('loading')
      setDecksLoadError(null)
      try {
        const decks = await getAllDecks()
        if (cancelled) return
        setSavedDecks(decks)

        const lastUsedId = await getLastUsedDeckId()
        if (!lastUsedId) {
          setDecksLoadStatus('ready')
          return
        }

        const deck = await loadQuestionsForDeck(lastUsedId)
        if (cancelled) return
        if (!deck || deck.questions.length === 0) {
          setDecksLoadStatus('ready')
          return
        }

        setCurrentDeckId(lastUsedId)
        setQuiz(deck.questions)
        setAnswers(Array(deck.questions.length).fill(null))
        setIdx(0)
        hierarchy.setCurrentQuizId(deck.firstQuizId ?? null)
        setDecksLoadStatus('ready')
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setDecksLoadError(e?.message || 'Failed to load decks')
        setDecksLoadStatus('error')
      }
    }

    loadDecks()
    return () => {
      cancelled = true
    }
  }, [hierarchy.setCurrentQuizId]) // eslint-disable-line react-hooks/exhaustive-deps -- mount + setCurrentQuizId only; omit hierarchy object (legacy useQuizState)

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
      setCurrentDeckId(deckId)

      const updatedDecks = await getAllDecks()
      setSavedDecks(updatedDecks)
    },
    [quiz, setCurrentDeckId, setSavedDecks],
  )

  const loadDeck = useCallback(
    async (deckId) => {
      const { questions, firstQuizId } = await loadQuestionsForDeck(deckId)
      if (questions.length === 0) {
        setInputError('This deck has no questions yet.')
        return
      }
      setCurrentDeckId(deckId)
      setQuiz(questions)
      setAnswers(Array(questions.length).fill(null))
      setIdx(0)
      clearSessionTextState()
      hierarchy.setCurrentQuizId(firstQuizId ?? null)
    },
    [hierarchy, clearSessionTextState, setCurrentDeckId, setQuiz, setAnswers, setIdx, setInputError],
  )

  const deleteDeckById = useCallback(
    async (deckId) => {
      await deleteDeck(deckId)
      setSavedDecks((prev) => prev.filter((d) => d.id !== deckId))
      if (hierarchy.selectedDeckForQuiz === deckId) {
        hierarchy.setSelectedDeckForQuiz(null)
        hierarchy.setDeckQuizzes([])
      }
      if (currentDeckId === deckId) {
        setCurrentDeckId(null)
        setQuiz([])
        setAnswers([])
        setIdx(0)
        clearSessionTextState()
      }
    },
    [currentDeckId, hierarchy, clearSessionTextState, setSavedDecks, setCurrentDeckId, setQuiz, setAnswers, setIdx],
  )

  return { saveCurrentDeck, loadDeck, deleteDeckById }
}
