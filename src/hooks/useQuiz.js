import { useState, useMemo, useEffect } from 'react'
import { 
  getAllDecks, 
  getDeckById, 
  saveDeck, 
  saveLastUsedDeckId,
  getLastUsedDeckId,
  clearLastUsedDeckId,
  saveReviewSchedule,
  getReviewSchedule,
  updateReviewSchedule,
  getDueReviews,
  deleteReviewSchedule
} from '../utils/indexedDB.js'

export function useQuiz() {
  const [view, setView] = useState('input')
  const [rawJson, setRawJson] = useState('')
  const [inputError, setInputError] = useState('')
  const [quiz, setQuiz] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  
  // Deck management state
  const [savedDecks, setSavedDecks] = useState([])
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [showAIPromptBuilder, setShowAIPromptBuilder] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [parseMessage, setParseMessage] = useState('')
  
  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [incorrectQuestions, setIncorrectQuestions] = useState([])
  const [isSpacedRepetition, setIsSpacedRepetition] = useState(false)
  const [showReviewButtons, setShowReviewButtons] = useState(false)
  const [reviewSchedule, setReviewSchedule] = useState([])
  
  const current = quiz[idx]
  const total = quiz.length
  const answeredCount = useMemo(() => {
    return answers.filter(answer => answer !== null).length
  }, [answers])
  const score = useMemo(() => {
    return answers.reduce((total, answer, idx) => {
      if (answer === null) return total
      
      const question = quiz[idx]
      if (!question) return total
      
      const isCorrect = question.answerIndex === answer || 
                     (question.type === 'fill-blank' && answer === question.answer) ||
                     (question.type === 'cloze' && answer === question.answer)
      
      return total + (isCorrect ? 1 : 0)
    }, 0)
  }, [quiz, answers])
  const progress = useMemo(() => total > 0 ? (answeredCount / total) * 100 : 0, [answeredCount, total])
  const preview = useMemo(() => {
    const text = (rawJson ?? '').trim()
    if (!text) return { ok: false, error: 'No input provided' }

    // Try JSON parsing first
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return { ok: true, value: parsed }
      }
    } catch (error) {
      // Not valid JSON, try text format
    }

    // Try text format parsing
    try {
      const lines = text.split('\n')
      const firstLine = lines[0]?.trim()
      
      if (firstLine?.toLowerCase().includes('question') || 
          firstLine?.toLowerCase().includes('option')) {
        const parsed = parseCSVFormat(lines)
        if (parsed.ok) return parsed
      }
      
      if (firstLine?.toLowerCase().includes('#')) {
        const parsed = parseMarkdownFormat(text)
        if (parsed.ok) return parsed
      }
      
      const parsed = parseTextFormat(text)
      if (parsed.ok) return parsed
      
    } catch (error) {
      return { ok: false, error: 'Failed to parse text format. Please check your syntax.' }
    }
  }, [rawJson])

  // Load saved decks on mount
  useEffect(() => {
    const loadDecks = async () => {
      const decks = await getAllDecks()
      setSavedDecks(decks)
      
      // Load last used deck
      const lastUsedId = await getLastUsedDeckId()
      if (lastUsedId) {
        const deck = await getDeckById(lastUsedId)
        if (deck) {
          setCurrentDeckId(lastUsedId)
          setQuiz(deck.questions)
          setAnswers(Array(deck.questions.length).fill(null))
          setIdx(0)
        }
      }
    }
    
    loadDecks()
  }, [])

  // Load review schedule on mount
  useEffect(() => {
    const loadReviewSchedule = async () => {
      const schedule = await getReviewSchedule()
      setReviewSchedule(schedule)
    }
    
    loadReviewSchedule()
  }, [])

  const toggleSpacedRepetition = () => {
    setIsSpacedRepetition(!isSpacedRepetition)
    setShowReviewButtons(!isSpacedRepetition)
  }

  const loadSample = () => {
    setRawJson(JSON.stringify(SAMPLE_QUIZ, null, 2))
    setParseMessage('')
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(rawJson)
      setRawJson(JSON.stringify(parsed, null, 2))
      setInputError('')
    } catch (error) {
      setInputError('Invalid JSON format')
    }
  }

  const clearQuiz = () => {
    setRawJson('')
    setInputError('')
    setParseMessage('')
  }

  const startQuiz = () => {
    if (preview.ok) {
      setQuiz(preview.value)
      setAnswers(Array(preview.value.length).fill(null))
      setIdx(0)
      setCurrentDeckId(null)
      setShowAIPromptBuilder(false)
      setIsReviewMode(false)
      setView('quiz')
      setParseMessage('')
    } else {
      setInputError('Please fix JSON errors before starting quiz')
    }
  }

  const choose = (optionIdx) => {
    const newAnswers = [...answers]
    newAnswers[idx] = optionIdx
    setAnswers(newAnswers)
  }

  const goNext = () => {
    if (idx + 1 < total) {
      setIdx(idx + 1)
    }
  }

  const restartSession = () => {
    setIdx(0)
    setAnswers(Array(total).fill(null))
    setShowReviewButtons(false)
  }

  const isAnswered = () => {
    return answers[idx] !== null
  }

  const startDailyReview = async () => {
    const dueReviews = await getDueReviews()
    if (dueReviews.length > 0) {
      const allQuestions = []
      for (const review of dueReviews) {
        const deck = await getDeckById(review.deckId)
        if (deck) {
          allQuestions.push(...deck.questions)
        }
      }
      
      setQuiz(allQuestions)
      setAnswers(Array(allQuestions.length).fill(null))
      setIdx(0)
      setIsReviewMode(true)
      setView('quiz')
    }
  }

  const saveCurrentDeck = async () => {
    if (quiz.length > 0) {
      const deckName = `Deck ${new Date().toISOString().split('T')[0]}`
      const deckId = await saveDeck(deckName, quiz)
      setCurrentDeckId(deckId)
      await saveLastUsedDeckId(deckId)
      setSavedDecks([...savedDecks, { id: deckId, name: deckName, questions: quiz, createdAt: new Date() }])
    }
  }

  const loadDeck = async (deckId) => {
    const deck = await getDeckById(deckId)
    if (deck) {
      setQuiz(deck.questions)
      setAnswers(Array(deck.questions.length).fill(null))
      setIdx(0)
      setCurrentDeckId(deckId)
      setView('quiz')
      await saveLastUsedDeckId(deckId)
    }
  }

  const deleteDeckById = async (deckId) => {
    await deleteDeck(deckId)
    setSavedDecks(savedDecks.filter(deck => deck.id !== deckId))
    if (currentDeckId === deckId) {
      setCurrentDeckId(null)
      setQuiz([])
      setAnswers([])
      setIdx(0)
      setView('input')
    }
  }

  const generateAIQuiz = async () => {
    if (!aiPrompt.trim()) {
      setInputError('Please enter a prompt for AI quiz generation')
      return
    }

    setIsGeneratingAI(true)
    setParseMessage('')

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates multiple-choice quiz questions based on user prompts. Generate questions in JSON format with question, options array, and answerIndex indicating correct answer.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI quiz')
      }

      const data = await response.json()
      const aiResponseText = data.choices[0]?.message?.content || ''
      
      setAiResponse(aiResponseText)
      
      // Clean up AI response
      let cleanedResponse = aiResponseText.trim()
      
      // Remove common AI introductory phrases
      const introPatterns = [
        /^Here are your questions?:?\s*/i,
        /^Here are the questions?:?\s*/i,
        /^Questions?:?\s*/i,
        /^Sure, here are the questions?:?\s*/i,
        /^Certainly, here are the questions?:?\s*/i,
      ]
      
      introPatterns.forEach(pattern => {
        cleanedResponse = cleanedResponse.replace(pattern, '')
      })
      
      // Remove common AI concluding phrases
      const outroPatterns = [
        /\s*I hope this helps!?\s*$/i,
        /\s*Let me know if you need anything else!\s*$/i,
        /\s*Feel free to ask if you need more questions!\s*$/i,
      ]
      
      outroPatterns.forEach(pattern => {
        cleanedResponse = cleanedResponse.replace(pattern, '')
      })

      const parsed = safeParseQuizJson(cleanedResponse)
      
      if (parsed.ok) {
        setQuiz(parsed.value)
        setAnswers(Array(parsed.value.length).fill(null))
        setIdx(0)
        setCurrentDeckId(null)
        setShowAIPromptBuilder(false)
        setIsReviewMode(false)
        setView('quiz')
        setParseMessage(`Successfully loaded ${parsed.value.length} questions`)
      } else {
        // Try to extract partial questions for better error reporting
        const lines = cleanedResponse.split('\n').filter(line => line.trim())
        const questionCount = lines.filter(line => /^\d+\./.test(line)).length
        setParseMessage(`Could not parse AI response. Found ${questionCount} potential questions. Error: ${parsed.error}`)
      }
    } catch (error) {
      setParseMessage(`Failed to generate AI quiz: ${error.message}`)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleImport = async (file) => {
    const text = await file.text()
    const ext = file.name.toLowerCase().split('.').pop()
    
    let parsed
    if (ext === 'json') {
      try {
        const json = JSON.parse(text)
        if (Array.isArray(json)) {
          parsed = { ok: true, value: json }
        }
      } catch (error) {
        parsed = { ok: false, error: 'Invalid JSON file' }
      }
    } else if (ext === 'csv') {
      parsed = parseCSVFormat(text.split('\n'))
    } else if (ext === 'md' || ext === 'markdown') {
      parsed = parseMarkdownFormat(text)
    } else {
      parsed = { ok: false, error: 'Unsupported file format. Please use JSON, CSV, or Markdown files.' }
    }

    if (parsed.ok) {
      setQuiz(parsed.value)
      setAnswers(Array(parsed.value.length).fill(null))
      setIdx(0)
      setCurrentDeckId(null)
      setShowAIPromptBuilder(false)
      setIsReviewMode(false)
      setView('quiz')
      setParseMessage(`Successfully imported ${parsed.value.length} questions`)
    } else {
      setParseMessage(`Import error: ${parsed.error}`)
    }
  }

  return {
    // State
    view, setView,
    rawJson, setRawJson,
    inputError, setInputError,
    quiz, setQuiz,
    idx, setIdx,
    answers, setAnswers,
    savedDecks, setSavedDecks,
    currentDeckId, setCurrentDeckId,
    showAIPromptBuilder, setShowAIPromptBuilder,
    aiPrompt, setAiPrompt,
    aiResponse, setAiResponse,
    isGeneratingAI, setIsGeneratingAI,
    parseMessage, setParseMessage,
    isReviewMode, setIsReviewMode,
    incorrectQuestions, setIncorrectQuestions,
    isSpacedRepetition, setIsSpacedRepetition,
    showReviewButtons, setShowReviewButtons,
    reviewSchedule, setReviewSchedule,
    
    // Computed values
    current,
    total,
    answeredCount,
    score,
    progress,
    preview,
    
    // Actions
    toggleSpacedRepetition,
    loadSample,
    formatJson,
    clearQuiz,
    startQuiz,
    choose,
    goNext,
    restartSession,
    isAnswered,
    startDailyReview,
    saveCurrentDeck,
    loadDeck,
    deleteDeckById,
    generateAIQuiz,
    handleImport,
  }
}
