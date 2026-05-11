import { useMemo, useState, useEffect } from 'react'
import { 
  saveDeck, 
  getAllDecks, 
  getDeckById, 
  deleteDeck, 
  saveLastUsedDeckId,
  getLastUsedDeckId,
  clearLastUsedDeckId,
  saveReviewSchedule,
  getReviewSchedule,
  updateReviewSchedule,
  getDueReviews,
  deleteReviewSchedule
} from './utils/indexedDB.js'

import InputView from './components/InputView.jsx'
import QuizView from './components/QuizView.jsx'
import ResultsView from './components/ResultsView.jsx'
import Header from './components/Header.jsx'
import ProgressIndicator from './components/ProgressIndicator.jsx'
import QuestionAnswer from './components/QuestionAnswer.jsx'

const SAMPLE_QUIZ = [
  {
    question: 'What does HTTP stand for?',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Protocol', 
      'Hyper Transfer Type Protocol',
      'Home Tool Transfer Protocol',
    ],
    answer: 'HyperText Transfer Protocol',
  },
  {
    question: 'Which React hook is used to store local component state?',
    options: ['useMemo', 'useState', 'useEffect', 'useRef'],
    answer: 'useState',
  },
  {
    question: 'What does Vite primarily improve during development?',
    options: ['Database backups', 'Dev server startup speed', 'Image compression', 'Server billing'],
    answer: 'Dev server startup speed',
  },
]

// Helper functions
function normalizeOption(option) {
  return String(option ?? '').trim()
}

function resolveAnswerIndex(item, options) {
  if (Number.isInteger(item?.answerIndex)) {
    return item.answerIndex
  }

  const normalizedAnswer = normalizeOption(item?.answer)
  const normalizedOptions = options.map(normalizeOption)

  const index = normalizedOptions.indexOf(normalizedAnswer)
  return index === -1 ? 0 : index
}

// Markdown renderer component
function MarkdownRenderer({ text, className = '' }) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function App() {
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
  const score = useMemo(() => getScore(quiz, answers), [quiz, answers])
  const progress = useMemo(() => total > 0 ? (answeredCount / total) * 100 : 0, [answeredCount, total])
  const preview = useMemo(() => safeParseQuizJson(rawJson), [rawJson])
  const sampleJson = useMemo(() => formatSampleJson(), [])

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
    setShowSuggestedAnswer(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const submitTextAnswer = () => {
    let isCorrect = false
    let userAnswer = ''
    
    switch (current.type) {
      case 'fill-blank':
        userAnswer = textAnswers[idx] || ''
        if (userAnswer && current.answers) {
          const normalizedAnswer = userAnswer.toLowerCase().trim()
          const correctAnswers = current.answers.map(a => a.toLowerCase().trim())
          isCorrect = correctAnswers.includes(normalizedAnswer)
        }
        break
      case 'cloze':
        const clozeAnswers = []
        const blanks = current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          const answer = textAnswers[`${idx}-${i}`]
          clozeAnswers.push(answer)
        }
        userAnswer = clozeAnswers.join(', ')
        if (clozeAnswers.every(a => a) && current.answers) {
          const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
          const correctAnswers = current.answers.map(a => a.toLowerCase().trim())
          isCorrect = normalizedAnswers.every((a, i) => correctAnswers.includes(a))
        }
        break
    }
    
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIdx) => 
        answerIdx === idx ? { isCorrect, userAnswer } : answer
      ),
    )
  }

  const isAnswered = () => {
    if (!current) return false
    
    switch (current.type) {
      case 'multiple-choice':
      case 'true-false':
        return answers[idx] !== null
      case 'fill-blank':
        return textAnswers[idx] !== undefined && textAnswers[idx] !== '' && answers[idx]?.isCorrect !== undefined
      case 'cloze':
        const blanks = current.question.split(/\{[^}]+\}/).length - 1
        for (let i = 0; i < blanks; i++) {
          if (!textAnswers[`${idx}-${i}`]) return false
        }
        return answers[idx]?.isCorrect !== undefined
      case 'short-answer':
        return answers[idx]?.selfAssessed !== undefined
      default:
        return false
    }
  }

  const goPrevious = () => {
    setIdx((currentIdx) => Math.max(0, currentIdx - 1))
  }

  const goNext = () => {
    if (!isAnswered()) return

    if (idx + 1 >= total) {
      // Identify incorrect questions for review
      const incorrect = quiz.filter((question, questionIdx) => {
        const answer = answers[questionIdx]
        const textAnswer = textAnswers[questionIdx]
        
        switch (question.type) {
          case 'multiple-choice':
            return answer !== question.answerIndex
          case 'true-false':
            return answer === null || ((answer === 1 ? question.answer : !question.answer)) === false
          case 'fill-blank':
            if (!textAnswer || !question.answers) return false
            const normalizedAnswer = textAnswer.toLowerCase().trim()
            const fillCorrectAnswers = question.answers.map(a => a.toLowerCase().trim())
            return !fillCorrectAnswers.includes(normalizedAnswer)
          case 'cloze':
            const clozeAnswers = []
            const blanks = question.question.split(/\{[^}]+\}/).length - 1
            for (let i = 0; i < blanks; i++) {
              const answer = textAnswers[`${questionIdx}-${i}`]
              clozeAnswers.push(answer)
            }
            if (!clozeAnswers.every(a => a) || !question.answers) return false
            const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
            const clozeCorrectAnswers = question.answers.map(a => a.toLowerCase().trim())
            return !normalizedAnswers.every((a, i) => clozeCorrectAnswers.includes(a))
          case 'short-answer':
            return answer?.selfAssessedCorrect === false
          default:
            return false
        }
      })
      
      setIncorrectQuestions(incorrect)
      setView('results')
      return
    }

    // Save review schedule if in spaced repetition mode and current question has review data
    if (isSpacedRepetition && current?.reviewData) {
      // Don't await here to avoid blocking UI
      updateReviewSchedule(current.id, current.reviewData.performanceQuality || 3).catch(error => {
        console.error('Failed to update review schedule:', error)
      })
    }

    setIdx((currentIdx) => currentIdx + 1)
  }

  const handleReviewRating = async (rating) => {
    if (!current) return
    
    // Map rating to performance quality for SM-2
    let performanceQuality = 3 // default "good"
    switch (rating) {
      case 'again':
        performanceQuality = 1 // "difficult"
        break
      case 'good':
        performanceQuality = 4 // "correct"
        break
      case 'easy':
        performanceQuality = 5 // "perfect"
        break
    }
    
    // Update review schedule
    try {
      await updateReviewSchedule(current.id, performanceQuality)
    } catch (error) {
      console.error('Failed to update review schedule:', error)
    }
    
    setShowReviewButtons(false)
    goNext()
  }

  const toggleSpacedRepetition = () => {
    setIsSpacedRepetition(!isSpacedRepetition)
    setShowReviewButtons(!isSpacedRepetition)
  }

  const restartSession = () => {
    setAnswers(Array(total).fill(null))
    setTextAnswers({})
    setShowSuggestedAnswer({})
    setIdx(0)
    setIsReviewMode(false)
    setView('quiz')
  }

  const startReviewMistakes = () => {
    if (incorrectQuestions.length === 0) return
    
    setQuiz(incorrectQuestions)
    setAnswers(Array(incorrectQuestions.length).fill(null))
    setTextAnswers({})
    setShowSuggestedAnswer({})
    setIdx(0)
    setIsReviewMode(true)
    setView('quiz')
  }

  const editQuiz = () => {
    setView('input')
    setInputError('')
  }

  const clearQuiz = () => {
    setRawJson('')
    setInputError('')
  }

  // Deck management functions
  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setSaveError('Please enter a deck name')
      return
    }

    if (quiz.length === 0) {
      setSaveError('No quiz data to save')
      return
    }

    setDeckLoading(true)
    setSaveError('')

    try {
      await saveDeck(quiz, deckName.trim())
      setShowSaveDeck(false)
      setDeckName('')
      
      // Refresh saved decks list
      const decks = await getAllDecks()
      setSavedDecks(decks)
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleLoadDeck = async (deckId) => {
    setDeckLoading(true)
    
    try {
      const deck = await getDeckById(deckId)
      if (deck && deck.questions) {
        setQuiz(deck.questions)
        setAnswers(Array(deck.questions.length).fill(null))
        setTextAnswers({})
        setShowSuggestedAnswer({})
        setIdx(0)
        setCurrentDeckId(deck.id)
        saveLastUsedDeckId(deck.id)
        setShowSavedDecks(false)
        setIsReviewMode(false)
        setView('quiz')
      }
    } catch (error) {
      console.error('Failed to load deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) {
      return
    }

    setDeckLoading(true)
    
    try {
      await deleteDeck(deckId)
      await deleteReviewSchedule(deckId) // Clean up review data
      
      // Refresh saved decks list
      const decks = await getAllDecks()
      setSavedDecks(decks)
      
      // Clear current deck if it was deleted
      if (currentDeckId === deckId) {
        setCurrentDeckId(null)
        clearLastUsedDeckId()
      }
    } catch (error) {
      console.error('Failed to delete deck:', error)
    } finally {
      setDeckLoading(false)
    }
  }

  const loadDailyReview = async () => {
    try {
      const dueReviews = await getDueReviews()
      if (dueReviews.length === 0) {
        setParseMessage('No cards due for review today!')
        return
      }
      
      // Group reviews by deck and shuffle
      const reviewsByDeck = {}
      dueReviews.forEach(review => {
        if (!reviewsByDeck[review.deckId]) {
          reviewsByDeck[review.deckId] = []
        }
        reviewsByDeck[review.deckId].push(review)
      })
      
      // Get all decks to find questions
      const allDecks = await getAllDecks()
      const reviewQuestions = []
      
      for (const deckId in reviewsByDeck) {
        const deck = allDecks.find(d => d.id === parseInt(deckId))
        if (deck && deck.questions) {
          const deckReviewQuestions = reviewsByDeck[deckId].map(review => {
            const question = deck.questions.find(q => q.id === review.questionId)
            return question ? { ...question, reviewData: review } : null
          }).filter(q => q !== null)
          
          reviewQuestions.push(...deckReviewQuestions)
        }
      }
      
      if (reviewQuestions.length === 0) {
        setParseMessage('No valid questions found for review')
        return
      }
      
      // Shuffle and load review questions
      const shuffled = reviewQuestions.sort(() => Math.random() - 0.5)
      setQuiz(shuffled)
      setAnswers(Array(shuffled.length).fill(null))
      setTextAnswers({})
      setShowSuggestedAnswer({})
      setIdx(0)
      setIsReviewMode(true)
      setIsSpacedRepetition(true)
      setDueReviews(dueReviews)
      setShowSavedDecks(false)
      setView('quiz')
      setParseMessage(`Loaded ${shuffled.length} cards for review`)
    } catch (error) {
      console.error('Failed to load daily review:', error)
      setParseMessage('Failed to load review cards')
    }
  }

  const openSaveDeckDialog = () => {
    setDeckName('')
    setSaveError('')
    setShowSaveDeck(true)
  }

  const generateAIPrompt = () => {
    const selectedTypes = Object.entries(selectedQuestionTypes)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type)
    
    if (selectedTypes.length === 0) {
      setParseMessage('Please select at least one question type')
      return
    }

    let formatSpecs = ''
    
    if (selectedTypes.includes('multipleChoice')) {
      formatSpecs += `Multiple Choice Questions (default, no marker):
1. What does HTTP stand for?
A. HyperText Transfer Protocol
B. High Transfer Text Protocol
C. Hyper Transfer Type Protocol
D. Home Tool Transfer Protocol
*B

`
    }
    
    if (selectedTypes.includes('trueFalse')) {
      formatSpecs += `True/False Questions:
2. [T/F] The Earth is flat.
*F

`
    }
    
    if (selectedTypes.includes('fillBlank')) {
      formatSpecs += `Fill in the Blank Questions:
3. [FIB] Water boils at ___ degrees Celsius.
*100

`
    }
    
    if (selectedTypes.includes('cloze')) {
      formatSpecs += `Cloze Deletion Questions:
4. [CLOZE] The capital of France is Paris.
*capital, Paris

`
    }
    
    if (selectedTypes.includes('shortAnswer')) {
      formatSpecs += `Short Answer Questions (self-assess):
5. [SA] Explain what makes a good user interface.
*Suggested: Clear navigation, consistent design, responsive layout, and accessibility features

`
    }

    const notesSection = studyNotes.trim() 
      ? `Base all questions entirely on these study notes:
\`\`\`
${studyNotes.trim()}
\`\`\`

`
      : 'Use your general knowledge on the topic.\n'

    const prompt = `You are a quiz generation engine. Output only properly formatted questions, with no greetings or explanations.

Generate exactly ${numberOfQuestions} questions using the following format specifications:

${formatSpecs}

${notesSection}Topic and instructions: ${topicInstructions || 'General knowledge quiz'}

Requirements:
- Adhere strictly to the format examples above
- Each question must be separated by one blank line
- Use asterisk (*) for correct answers
- Include type markers ([T/F], [FIB], [CLOZE], [SA]) for non-MCQ questions
- Distribute question types among the selected formats
- Output only the quiz text, nothing else
- No introductory or concluding remarks`

    setGeneratedPrompt(prompt)
    setParseMessage('')
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setParseMessage('Copied to clipboard!')
      setTimeout(() => setParseMessage(''), 2000)
    } catch (err) {
      setParseMessage('Failed to copy to clipboard')
    }
  }

  const parseAIResponse = () => {
    if (!aiResponse.trim()) {
      setParseMessage('Please paste AI response first')
      return
    }

    // Clean up AI response - remove common AI prefixes/suffixes
    let cleanedResponse = aiResponse.trim()
    
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
      setTextAnswers({})
      setShowSuggestedAnswer({})
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
  }

  // Clean up AI response - remove common AI prefixes/suffixes
  let cleanedResponse = aiResponse.trim()
  
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
    setTextAnswers({})
    setShowSuggestedAnswer({})
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

  return (
    <div className="min-h-dvh bg-[#f6f3ee] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-base font-semibold tracking-tight">PromptQuiz</div>
              <div className="text-sm text-slate-600">Active recall from your own JSON</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSpacedRepetition}
                className={cx(
                  'rounded-md border px-3 py-2 text-sm font-semibold',
                  isSpacedRepetition 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                )}
              >
                {isSpacedRepetition ? 'SR On' : 'SR Off'}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Saved Decks ({savedDecks.length})
              </button>
              <button
                type="button"
                onClick={() => setShowAIPromptBuilder(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                AI Prompt Builder
              </button>
              <button
                type="button"
                onClick={startDailyReview}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Daily Review
              </button>
            </div>
          </header>
        </div>
          {view === 'input' ? (
            <>
              <button
                type="button"
                onClick={loadSample}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Load Sample
              </button>
              <button
                type="button"
                onClick={() => setShowAIPromptBuilder(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                AI Prompt Builder
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => setShowSavedDecks(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Saved Decks ({savedDecks.length})
              </button>
            </>
          ) : (
            <>
              {quiz.length > 0 && (
                <button
                  type="button"
                  onClick={openSaveDeckDialog}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Save Deck
                </button>
              )}
              <button
                type="button"
                onClick={editQuiz}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Edit Quiz
              </button>
              <button
                type="button"
                onClick={restartSession}
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Restart
              </button>
            </>
          )}
        </div>
          </header>

            {view === 'input' ? (
              <main className="grid flex-1 items-center gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      Paste your quiz JSON or text
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Use a JSON array or text format. Text format supports MCQ, True/False [T/F], Fill in Blank [FIB], Cloze [CLOZE], and Short Answer [SA] questions.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={formatJson}
                      disabled={!rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Format
                    </button>
                    <button
                      type="button"
                      onClick={clearQuiz}
                      disabled={!rawJson.trim()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="quiz-json">
                  Quiz JSON
                </label>
                <textarea
                  id="quiz-json"
                  value={rawJson}
                  onChange={(event) => {
                    setRawJson(event.target.value)
                    if (inputError) setInputError('')
                  }}
                  placeholder={sampleJson}
                  spellCheck={false}
                  aria-invalid={Boolean(inputError)}
                  className={cx(
                    'mt-2 h-[420px] w-full resize-y rounded-lg border bg-slate-950 p-4 font-mono text-[12px] leading-5 text-slate-50 shadow-inner outline-none',
                    'placeholder:text-slate-500 focus:ring-2',
                    inputError
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-slate-800 focus:ring-teal-500',
                    )}
                  />

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div aria-live="polite">
                      {inputError ? (
                        <p className="text-sm font-medium text-rose-700">{inputError}</p>
                      ) : rawJson.trim() && preview.ok ? (
                        <p className="text-sm font-medium text-teal-700">
                          Ready: {preview.value.length} question
                          {preview.value.length === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={startQuiz}
                          className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                          Start Quiz
                        </button>
                      </div>
                    </div>
                </section>

                <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
                  <div className="font-semibold">Accepted answer formats</div>
                  <div className="mt-3 space-y-3 leading-6">
                    <p>
                      <span className="font-mono text-xs">"answer"</span> can be the exact text of the
                      correct option.
                    </p>
                    <p>
                      <span className="font-mono text-xs">"answerIndex"</span> can be a number from 0
                      to 3.
                    </p>
                    <p>Duplicate or blank options are flagged before the quiz starts.</p>
                    <p className="mt-2 font-semibold">Markdown Support:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><span className="font-mono">**bold**</span> for bold text</li>
                      <li><span className="font-mono">*italic*</span> for italic text</li>
                      <li><span className="font-mono">`code`</span> for inline code</li>
                      <li><span className="font-mono">![alt](url)</span> for images</li>
                    </ul>
                    <p className="mt-2 text-xs">Use Import button to add images or load CSV/Markdown files.</p>
                  </aside>
                </main>
            ) : null}
          ) : view === 'quiz' ? (
            <main className="flex flex-1 items-center py-6">
              <section className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                        <div className="text-sm font-semibold text-teal-700">
                          {isReviewMode ? 'Reviewing ' : 'Question '}{idx + 1} of {total}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {answeredCount} answered | Score {score}
                          {isReviewMode && ` | Mistakes: ${incorrectQuestions.length}`}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
                        {Math.round(progress)}% through
                      </div>
                    </div>

                    <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(progress)}
                >
                  <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
                </div>
                  </div>

                  <h2 className="mt-8 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                    <MarkdownRenderer text={current.question} />
                  </h2>

              <div className="mt-6">
                    {/* Multiple Choice */}
                    {current.type === 'multiple-choice' && (
                      <div className="grid gap-3">
                        {current.options.map((option, optionIdx) => {
                          const answered = answers[idx] !== null
                          const isSelected = answers[idx] === optionIdx
                          const isCorrect = optionIdx === current.answerIndex
                          const isWrongSelected = answered && isSelected && !isCorrect

                      const variant = answered
                        ? isCorrect
                          ? 'border-teal-300 bg-teal-50 text-teal-950'
                          : isWrongSelected
                            ? 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-slate-200 bg-white text-slate-800'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          disabled={answered}
                          className={cx(
                            'grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold shadow-sm transition',
                            'focus:outline-none focus:ring-2 focus:ring-teal-500',
                            answered ? 'cursor-default' : 'cursor-pointer',
                            variant,
                          )}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200">
                            {String.fromCharCode(65 + optionIdx)}
                          </span>
                          <span className="text-left">
                            <MarkdownRenderer text={option} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* True/False */}
                {current.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((option, optionIdx) => {
                      const answered = answers[idx] !== null
                      const isSelected = answers[idx] === optionIdx
                      const isCorrect = optionIdx === 1 ? current.answer : !current.answer
                      const isWrongSelected = answered && isSelected && !isCorrect

                      const variant = answered
                        ? isCorrect
                          ? 'border-teal-300 bg-teal-50 text-teal-950'
                          : isWrongSelected
                            ? 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-slate-200 bg-white text-slate-800'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          disabled={answered}
                          className={cx(
                            'min-h-14 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm transition',
                            'focus:outline-none focus:ring-2 focus:ring-teal-500',
                            answered ? 'cursor-default' : 'cursor-pointer',
                            variant,
                          )}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Fill in the Blank */}
                {current.type === 'fill-blank' && (
                  <div className="space-y-4">
                    <div className="text-lg leading-relaxed">
                      {current.question.split('___').map((part, partIdx) => (
                        <span key={partIdx}>
                          {part}
                          {partIdx < current.question.split('___').length - 1 && (
                            <input
                              type="text"
                              value={textAnswers[idx] || ''}
                              onChange={(e) => handleTextAnswer(e.target.value)}
                              disabled={answers[idx] !== null}
                              placeholder="answer"
                              className={cx(
                                'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium',
                                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                                answers[idx] !== null
                                  ? answers[idx]?.isCorrect
                                    ? 'border-teal-300 bg-teal-50 text-teal-950'
                                    : 'border-rose-300 bg-rose-50 text-rose-950'
                                  : 'border-slate-300 bg-white'
                              )}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                    {answers[idx] === null && textAnswers[idx] && (
                      <button
                        type="button"
                        onClick={submitTextAnswer}
                        className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Submit Answer
                      </button>
                    )}
                    {answers[idx] !== null && (
                      <p className={cx(
                        'rounded-lg border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-teal-200 bg-teal-50 text-teal-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct!' : `Correct answer: ${current.answers[0]}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Cloze Deletion */}
                {current.type === 'cloze' && (
                  <div className="space-y-4">
                    <div className="text-lg leading-relaxed">
                      {current.question.split(/\{[^}]+\}/).map((part, partIdx) => (
                        <span key={partIdx}>
                          {part}
                          {partIdx < current.question.split(/\{[^}]+\}/).length - 1 && (
                            <input
                              type="text"
                              value={textAnswers[`${idx}-${partIdx}`] || ''}
                              onChange={(e) => handleTextAnswer(e.target.value, partIdx)}
                              disabled={answers[idx] !== null}
                              placeholder="answer"
                              className={cx(
                                'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium',
                                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                                answers[idx] !== null
                                  ? answers[idx]?.isCorrect
                                    ? 'border-teal-300 bg-teal-50 text-teal-950'
                                    : 'border-rose-300 bg-rose-50 text-rose-950'
                                  : 'border-slate-300 bg-white'
                              )}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                    {answers[idx] === null && (() => {
                      const blanks = current.question.split(/\{[^}]+\}/).length - 1
                      for (let i = 0; i < blanks; i++) {
                        if (!textAnswers[`${idx}-${i}`]) return null
                      }
                      return (
                        <button
                          type="button"
                          onClick={submitTextAnswer}
                          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          Submit Answer
                        </button>
                      )
                    })()}
                    {answers[idx] !== null && (
                      <p className={cx(
                        'rounded-lg border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-teal-200 bg-teal-50 text-teal-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct!' : `Correct answers: ${current.answers.join(', ')}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Short Answer */}
                {current.type === 'short-answer' && (
                  <div className="space-y-4">
                    <textarea
                      value={textAnswers[idx] || ''}
                      onChange={(e) => handleTextAnswer(e.target.value)}
                      disabled={answers[idx]?.selfAssessed !== undefined}
                      placeholder="Type your answer here..."
                      rows={4}
                      className={cx(
                        'w-full rounded-md border px-4 py-3 text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                        answers[idx]?.selfAssessed !== undefined ? 'border-slate-300 bg-slate-50' : 'border-slate-300 bg-white'
                      )}
                    />
                    
                    {!showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                      <button
                        type="button"
                        onClick={toggleSuggestedAnswer}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Reveal Model Answer
                      </button>
                    )}

                    {showSuggestedAnswer[idx] && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-950 mb-2">Model Answer:</p>
                        <p className="text-sm text-amber-800">{current.suggestedAnswer}</p>
                      </div>
                    )}

                    {showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelfAssessment(true)}
                          className="flex-1 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          I was correct
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfAssessment(false)}
                          className="flex-1 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          I still need to review
                        </button>
                      </div>
                    )}

                    {answers[idx]?.selfAssessed !== undefined && (
                      <p className={cx(
                        'rounded-lg border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.selfAssessedCorrect
                          ? 'border-teal-200 bg-teal-50 text-teal-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      )}>
                        {answers[idx]?.selfAssessedCorrect ? 'Self-assessed as correct' : 'Marked for review'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 min-h-11" aria-live="polite">
                {(inputError || importMessage) && (
                  <div className={cx(
                    'rounded-lg border px-4 py-3 text-sm font-semibold',
                    inputError 
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  )}>
                    {inputError || importMessage}
                  </div>
                )}
                {current.type === 'multiple-choice' && answers[idx] !== null ? (
                  answers[idx] === current.answerIndex ? (
                    <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
                      Correct.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                      Correct answer: {current.options[current.answerIndex]}
                    </p>
                  )
                ) : current.type === 'true-false' && answers[idx] !== null ? (
                  ((answers[idx] === 1 ? current.answer : !current.answer)) ? (
                    <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
                      Correct.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                      Correct answer: {current.answer ? 'True' : 'False'}
                    </p>
                  )
                ) : null}
              </div>

              {/* Review Buttons */}
              {answers[idx] !== null && !isSpacedRepetition && (
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewRating('again')}
                    className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    Again (1 min)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewRating('good')}
                    className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    Good (1 day)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewRating('easy')}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    Easy (4 days)
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={idx === 0}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isAnswered()}
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {idx + 1 === total ? 'See Results' : 'Next'}
                </button>
              </div>
            </section>
          </main>
            ) : null}
          ) : view === 'results' ? (
            <main className="flex-1 py-6">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div className="rounded-lg bg-slate-950 p-5 text-white">
                  <div className="text-sm font-semibold text-teal-200">
                    {isReviewMode ? 'Review Complete' : 'Session complete'}
                  </div>
                  <div className="mt-4 text-5xl font-semibold tracking-tight">{percent}%</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {score} correct out of {total}
                  </div>
                  <div className="mt-4 space-y-2">
                    {incorrectQuestions.length > 0 && !isReviewMode && (
                      <button
                        type="button"
                        onClick={startReviewMistakes}
                        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        Review Mistakes ({incorrectQuestions.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={restartSession}
                      className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    >
                      {isReviewMode ? 'Start New Quiz' : 'Try Again'}
                    </button>
                    <button
                      type="button"
                      onClick={editQuiz}
                      className="w-full rounded-md border border-slate-600 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    >
                      Back to Home
                    </button>
                  </div>
                  {incorrectQuestions.length === 0 && !isReviewMode && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                      <p className="text-sm font-semibold text-emerald-800">Perfect round! Nothing to review.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Review</h2>
                  <div className="mt-4 grid gap-3">
                    {quiz.map((question, questionIdx) => {
                      const selected = answers[questionIdx]
                      const textAnswer = textAnswers[questionIdx]
                      
                      let isCorrect = false
                      let userAnswerText = ''
                      let correctAnswerText = ''

                      switch (question.type) {
                        case 'multiple-choice':
                          isCorrect = selected === question.answerIndex
                          userAnswerText = selected === null ? 'No answer' : question.options[selected]
                          correctAnswerText = question.options[question.answerIndex]
                          break
                        case 'true-false':
                          isCorrect = selected !== null && ((selected === 1 ? question.answer : !question.answer))
                          userAnswerText = selected === null ? 'No answer' : (selected === 1 ? 'True' : 'False')
                          correctAnswerText = question.answer ? 'True' : 'False'
                          break
                        case 'fill-blank':
                          if (textAnswer && question.answers) {
                            const normalizedAnswer = textAnswer.toLowerCase().trim()
                            const correctAnswers = question.answers.map(a => a.toLowerCase().trim())
                            isCorrect = correctAnswers.includes(normalizedAnswer)
                          }
                          userAnswerText = textAnswer || 'No answer'
                          correctAnswerText = question.answers?.[0] || 'N/A'
                          break
                        case 'cloze':
                          // For cloze, check if all blanks are filled correctly
                          const clozeAnswers = []
                          const blanks = question.question.split(/\{[^}]+\}/).length - 1
                          for (let i = 0; i < blanks; i++) {
                            const answer = textAnswers[`${questionIdx}-${i}`]
                            clozeAnswers.push(answer)
                          }
                          if (clozeAnswers.every(a => a && question.answers)) {
                            const normalizedAnswers = clozeAnswers.map(a => a.toLowerCase().trim())
                            const correctAnswers = question.answers.map(a => a.toLowerCase().trim())
                            isCorrect = normalizedAnswers.every((a, i) => correctAnswers.includes(a))
                          }
                          userAnswerText = clozeAnswers.length > 0 ? clozeAnswers.join(', ') : 'No answer'
                          correctAnswerText = question.answers?.join(', ') || 'N/A'
                          break
                        case 'short-answer':
                          isCorrect = selected?.selfAssessedCorrect || false
                          userAnswerText = textAnswer || 'No answer'
                          correctAnswerText = question.suggestedAnswer || 'N/A'
                          break
                      }

                      return (
                        <article
                          key={question.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <h3 className="font-semibold leading-6 text-slate-950">
                              {questionIdx + 1}. {question.question}
                              <span className="ml-2 text-xs font-normal text-slate-500">
                                ({question.type.replace('-', ' ')})
                              </span>
                            </h3>
                            <span
                              className={cx(
                                'w-fit rounded-md px-2 py-1 text-xs font-bold',
                                question.type === 'short-answer' && selected?.selfAssessed !== undefined
                                  ? selected?.selfAssessedCorrect
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-amber-100 text-amber-800'
                                  : isCorrect
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-rose-100 text-rose-800',
                              )}
                            >
                              {question.type === 'short-answer' && selected?.selfAssessed !== undefined
                                ? selected?.selfAssessedCorrect ? 'Self-assessed correct' : 'Needs review'
                                : isCorrect
                                  ? 'Correct'
                                  : 'Review'}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                            <p>
                              Your answer:{' '}
                              <span className="font-semibold text-slate-950">
                                {userAnswerText}
                              </span>
                            </p>
                            {question.type !== 'short-answer' && !isCorrect && (
                              <p>
                                Correct answer:{' '}
                                <span className="font-semibold text-slate-950">
                                  {correctAnswerText}
                                </span>
                              </p>
                            )}
                            {question.type === 'short-answer' && (
                              <p>
                                Model answer:{' '}
                                <span className="font-semibold text-slate-950">
                                  {correctAnswerText}
                                </span>
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          </main>
        ) : null}

        {showImagePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Add Image</h3>
              <div className="mt-4">
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                  <div className="mx-auto h-12 w-12 text-slate-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-slate-600">
                      Drag and drop an image here, or click to select
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) handleImageUpload(file)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Select Image
                  </button>
                </div>
                <div
                  className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <p className="text-xs text-slate-600">
                    <strong>Note:</strong> Large images will increase storage size in IndexedDB.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showSaveDeck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Save Deck</h3>
              <div className="mt-4">
                <label htmlFor="deckName" className="block text-sm font-medium text-slate-700">
                  Deck Name
                </label>
                <input
                  type="text"
                  id="deckName"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Enter deck name"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {saveError && (
                  <p className="mt-2 text-sm text-rose-600">{saveError}</p>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveDeck}
                  className="flex-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDeck(false)}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Decks Modal */}
        {showSavedDecks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-2xl max-h-[80vh] rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-950">Saved Decks</h2>
                <button
                  type="button"
                  onClick={() => setShowSavedDecks(false)}
                  className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {savedDecks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">No saved decks yet.</p>
                    <p className="mt-2 text-sm text-slate-500">Create a quiz and save it to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedDecks.map((deck) => (
                      <div
                        key={deck.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-950">{deck.name}</h3>
                            <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-600">
                              <span>{deck.questionCount} questions</span>
                              <span>{new Date(deck.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadDeck(deck.id)}
                              disabled={deckLoading}
                              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeck(deck.id)}
                              disabled={deckLoading}
                              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Prompt Builder Modal */}
        {showAIPromptBuilder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-950">AI Prompt Builder</h2>
                <button
                  type="button"
                  onClick={() => setShowAIPromptBuilder(false)}
                  className="rounded-md p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Study Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="study-notes">
                    Study Notes (optional)
                  </label>
                  <textarea
                    id="study-notes"
                    value={studyNotes}
                    onChange={(e) => setStudyNotes(e.target.value)}
                    placeholder="Paste your lecture notes, book excerpts, or any study material here..."
                    rows={4}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Question Types */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    Question Types (select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                      { key: 'multipleChoice', label: 'Multiple Choice' },
                      { key: 'trueFalse', label: 'True/False' },
                      { key: 'fillBlank', label: 'Fill in Blank' },
                      { key: 'cloze', label: 'Cloze' },
                      { key: 'shortAnswer', label: 'Short Answer' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedQuestionTypes[key]}
                          onChange={(e) => setSelectedQuestionTypes(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="num-questions">
                    Number of Questions
                  </label>
                  <input
                    id="num-questions"
                    type="number"
                    min="1"
                    max="100"
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Topic Instructions */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800" htmlFor="topic-instructions">
                    Topic / Extra Instructions
                  </label>
                  <input
                    id="topic-instructions"
                    type="text"
                    value={topicInstructions}
                    onChange={(e) => setTopicInstructions(e.target.value)}
                    placeholder="e.g., World War II battles, easy difficulty, focus on dates"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Generate Prompt Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={generateAIPrompt}
                    className="rounded-md bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Generate Prompt
                  </button>
                </div>

                {/* Generated Prompt */}
                {generatedPrompt && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-slate-800">
                        Generated Prompt (copy this to your AI)
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedPrompt)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <textarea
                      value={generatedPrompt}
                      readOnly
                      rows={12}
                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                )}

                {/* AI Response Section */}
                {generatedPrompt && (
                  <div className="border-t border-slate-200 pt-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Paste AI Response
                    </label>
                    <textarea
                      value={aiResponse}
                      onChange={(e) => setAiResponse(e.target.value)}
                      placeholder="Paste the response from your AI here..."
                      rows={8}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={parseAIResponse}
                        className="rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Parse & Load
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {parseMessage && (
                  <div className={cx(
                    'rounded-lg border px-4 py-3 text-sm font-semibold',
                    parseMessage.includes('Successfully') || parseMessage.includes('Copied')
                      ? 'border-teal-200 bg-teal-50 text-teal-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  )}>
                    {parseMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
