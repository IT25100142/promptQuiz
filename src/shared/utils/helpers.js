export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Sample quiz data for testing
export const SAMPLE_QUIZ = [
  {
    type: 'multiple-choice',
    question: 'What does HTTP stand for?',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Protocol', 
      'Hyper Transfer Type Protocol',
      'Home Tool Transfer Protocol',
    ],
    answer: 'HyperText Transfer Protocol',
    answerIndex: 0,
  },
  {
    type: 'multiple-choice',
    question: 'Which React hook is used to store local component state?',
    options: ['useMemo', 'useState', 'useEffect', 'useRef'],
    answer: 'useState',
    answerIndex: 1,
  },
  {
    type: 'multiple-choice',
    question: 'What does Vite primarily improve during development?',
    options: ['Database backups', 'Dev server startup speed', 'Image compression', 'Server billing'],
    answer: 'Dev server startup speed',
    answerIndex: 1,
  },
]

// Safely parse quiz JSON with error handling
export function safeParseQuizJson(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, error: 'No input provided. Please paste your quiz questions.' }
  }

  const trimmedText = text.trim()
  if (!trimmedText) {
    return { ok: false, error: 'No input provided. Please paste your quiz questions.' }
  }

  // Try JSON parsing first
  try {
    const parsed = JSON.parse(trimmedText)
    if (Array.isArray(parsed)) {
      return { ok: true, value: parsed }
    } else {
      return { ok: false, error: 'Input must be an array of questions' }
    }
  } catch (error) {
    // Not valid JSON, try text format
  }

  // Try text format parsing
  try {
    const lines = trimmedText.split('\n')
    const firstLine = lines[0]?.trim()
    
    if (firstLine?.toLowerCase().includes('question') || 
        firstLine?.toLowerCase().includes('option')) {
      const parsed = parseCSVFormat(lines)
      if (parsed.ok) return parsed
    }
    
    if (firstLine?.toLowerCase().includes('#')) {
      const parsed = parseMarkdownFormat(trimmedText)
      if (parsed.ok) return parsed
    }
    
    const parsed = parseTextFormat(trimmedText)
    if (parsed.ok) return parsed
    
  } catch (error) {
    return { ok: false, error: 'Failed to parse text format. Please check your question formatting and see examples in the sidebar.' }
  }

  return { ok: false, error: 'Could not parse input. Please check your format and see examples in the sidebar.' }
}

// Calculate quiz score
export function getScore(quiz, answers) {
  if (!Array.isArray(quiz) || !Array.isArray(answers)) {
    return 0
  }

  return answers.reduce((total, answer, idx) => {
    if (answer === null || answer === undefined) return total
    
    const question = quiz[idx]
    if (!question) return total
    
    let isCorrect = false
    
    switch (question.type) {
      case 'multiple-choice':
        isCorrect = answer === question.answerIndex
        break
      case 'true-false':
        isCorrect = answer !== null && ((answer === 1 ? question.answer : !question.answer))
        break
      case 'fill-blank':
      case 'cloze':
        isCorrect = answer?.isCorrect === true
        break
      case 'short-answer':
        isCorrect = answer?.selfAssessedCorrect === true
        break
      default:
        // Legacy format
        isCorrect = question.answerIndex === answer || 
                   (question.type === 'fill-blank' && answer === question.answer) ||
                   (question.type === 'cloze' && answer === question.answer)
    }
    
    return total + (isCorrect ? 1 : 0)
  }, 0)
}

// Format sample JSON for display
export function formatSampleJson() {
  return JSON.stringify(SAMPLE_QUIZ, null, 2)
}

// Parse CSV format
export function parseCSVFormat(lines) {
  try {
    const questions = []
    let currentQuestion = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // Simple CSV parsing - would need to be more sophisticated for real CSV
      if (trimmed.toLowerCase().includes('question')) {
        if (currentQuestion) {
          questions.push(currentQuestion)
        }
        currentQuestion = {
          question: trimmed,
          options: [],
          answer: '',
          type: 'multiple-choice'
        }
      } else if (trimmed.match(/^[a-d]\./i)) {
        // Option line
        const option = trimmed.replace(/^[a-d]\./i, '').trim()
        if (currentQuestion) {
          currentQuestion.options.push(option)
        }
      } else if (trimmed.startsWith('*')) {
        // Answer line
        const answer = trimmed.substring(1).trim()
        if (currentQuestion) {
          currentQuestion.answer = answer
          const answerIndex = currentQuestion.options.findIndex(opt => 
            opt.toLowerCase() === answer.toLowerCase()
          )
          if (answerIndex !== -1) {
            currentQuestion.answerIndex = answerIndex
          }
        }
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion)
    }
    
    return questions.length > 0 ? { ok: true, value: questions } : { ok: false, error: 'No valid questions found in CSV format' }
  } catch (error) {
    return { ok: false, error: 'Failed to parse CSV format' }
  }
}

// Parse Markdown format
export function parseMarkdownFormat(text) {
  try {
    const lines = text.split('\n')
    const questions = []
    let currentQuestion = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      if (trimmed.startsWith('#')) {
        // Question header
        if (currentQuestion) {
          questions.push(currentQuestion)
        }
        currentQuestion = {
          question: trimmed.replace(/^#+\s*/, ''),
          options: [],
          answer: '',
          type: 'multiple-choice'
        }
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        // List item (option)
        const option = trimmed.replace(/^[-*]\s*/, '').trim()
        if (currentQuestion) {
          if (option.startsWith('*')) {
            // Marked as correct answer
            currentQuestion.answer = option.substring(1).trim()
            const answerIndex = currentQuestion.options.length
            currentQuestion.answerIndex = answerIndex
            currentQuestion.options.push(currentQuestion.answer)
          } else {
            currentQuestion.options.push(option)
          }
        }
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion)
    }
    
    return questions.length > 0 ? { ok: true, value: questions } : { ok: false, error: 'No valid questions found in Markdown format' }
  } catch (error) {
    return { ok: false, error: 'Failed to parse Markdown format' }
  }
}

// Parse text format (supports multiple question types)
export function parseTextFormat(text) {
  try {
    const lines = text.split('\n').filter(line => line.trim())
    const questions = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines and continue if we can't parse
      if (!line) continue
      
      let question = null
      
      // True/False
      if (/^\d+\.\s*\[T\/F\]/i.test(line)) {
        question = parseTrueFalse(lines, i)
        if (question) {
          questions.push(question)
          i += question.linesConsumed - 1 // Skip processed lines
        }
      }
      // Fill in Blank
      else if (/^\d+\.\s*\[FIB\]/i.test(line)) {
        question = parseFillBlank(lines, i)
        if (question) {
          questions.push(question)
          i += question.linesConsumed - 1
        }
      }
      // Cloze Deletion
      else if (/^\d+\.\s*\[CLOZE\]/i.test(line)) {
        question = parseCloze(lines, i)
        if (question) {
          questions.push(question)
          i += question.linesConsumed - 1
        }
      }
      // Short Answer
      else if (/^\d+\.\s*\[SA\]/i.test(line)) {
        question = parseShortAnswer(lines, i)
        if (question) {
          questions.push(question)
          i += question.linesConsumed - 1
        }
      }
      // Multiple Choice (default, no marker)
      else if (/^\d+\./.test(line)) {
        question = parseMultipleChoice(lines, i)
        if (question) {
          questions.push(question)
          i += question.linesConsumed - 1 // Skip processed lines
        }
      }
    }
    
    return questions.length > 0 ? { ok: true, value: questions } : { ok: false, error: 'No valid questions found in text format' }
  } catch (error) {
    return { ok: false, error: 'Failed to parse text format' }
  }
}

// Parse multiple choice question
export function parseMultipleChoice(lines, startIndex) {
  const question = {
    type: 'multiple-choice',
    question: '',
    options: [],
    answer: '',
    answerIndex: 0
  }
  
  let i = startIndex
  let foundAnswer = false
  
  // Parse question line
  const questionLine = lines[i].replace(/^\d+\.\s*/, '')
  question.question = questionLine
  i++
  
  // Parse options
  while (i < lines.length && !/^\d+\./.test(lines[i])) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }
    
    if (/^[A-D]\.\s*/.test(line)) {
      // Option with letter prefix
      const option = line.replace(/^[A-D]\.\s*/, '')
      question.options.push(option)
    } else if (line.startsWith('*')) {
      // Correct answer
      const answer = line.substring(1).trim()
      question.answer = answer
      foundAnswer = true
      
      // Check if answer is a single letter (A, B, C, D)
      if (/^[A-D]$/i.test(answer)) {
        const answerIndex = answer.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
        if (answerIndex < question.options.length) {
          question.answerIndex = answerIndex
        } else {
          question.answerIndex = 0
        }
      } else {
        // Check if answer matches option text
        const answerIndex = question.options.findIndex(opt => 
          opt.toLowerCase() === answer.toLowerCase()
        )
        if (answerIndex !== -1) {
          question.answerIndex = answerIndex
        } else {
          question.answerIndex = question.options.length
          question.options.push(answer)
        }
      }
    } else if (question.options.length < 4) {
      // Option without letter prefix
      question.options.push(line)
    }
    
    i++
  }
  
  question.linesConsumed = i - startIndex
  
  if (!foundAnswer && question.options.length > 0) {
    // Default to first option if no answer found
    question.answer = question.options[0]
    question.answerIndex = 0
  }
  
  return question.options.length >= 2 ? question : null
}

// Parse true/false question
export function parseTrueFalse(lines, startIndex) {
  const question = {
    type: 'true-false',
    question: '',
    answer: true
  }
  
  let i = startIndex
  
  // Parse question line
  const questionLine = lines[i].replace(/^\d+\.\s*\[T\/F\]\s*/i, '')
  question.question = questionLine
  i++
  
  // Look for answer
  while (i < lines.length && !/^\d+\./.test(lines[i])) {
    const line = lines[i].trim()
    if (line.startsWith('*')) {
      const answer = line.substring(1).trim().toLowerCase()
      question.answer = answer === 'true' || answer === 't'
      break
    }
    i++
  }
  
  question.linesConsumed = i - startIndex
  return question
}

// Parse fill in blank question
export function parseFillBlank(lines, startIndex) {
  const question = {
    type: 'fill-blank',
    question: '',
    answers: []
  }
  
  let i = startIndex
  
  // Parse question line
  const questionLine = lines[i].replace(/^\d+\.\s*\[FIB\]\s*/i, '')
  question.question = questionLine.replace('___', '___') // Ensure blank format
  i++
  
  // Look for answer
  while (i < lines.length && !/^\d+\./.test(lines[i])) {
    const line = lines[i].trim()
    if (line.startsWith('*')) {
      const answer = line.substring(1).trim()
      question.answers = [answer]
      break
    }
    i++
  }
  
  question.linesConsumed = i - startIndex
  return question.answers.length > 0 ? question : null
}

// Parse cloze deletion question
export function parseCloze(lines, startIndex) {
  const question = {
    type: 'cloze',
    question: '',
    answers: []
  }
  
  let i = startIndex
  
  // Parse question line
  const questionLine = lines[i].replace(/^\d+\.\s*\[CLOZE\]\s*/i, '')
  question.question = questionLine
  i++
  
  // Look for answers
  while (i < lines.length && !/^\d+\./.test(lines[i])) {
    const line = lines[i].trim()
    if (line.startsWith('*')) {
      const answersText = line.substring(1).trim()
      question.answers = answersText.split(',').map(a => a.trim())
      break
    }
    i++
  }
  
  // Handle different cloze formats
  if (question.answers.length > 0) {
    // If question already has placeholders, use as-is
    if (question.question.includes('{')) {
      // Already has proper format
      return { ...question, linesConsumed: i - startIndex }
    }
    
    // Try to intelligently insert placeholders
    let modifiedQuestion = question.question
    
    // Common patterns for cloze answers
    question.answers.forEach((answer, index) => {
      // Handle multi-word answers
      if (answer.includes(' ')) {
        const answerWords = answer.toLowerCase().split(' ')
        const questionWords = modifiedQuestion.toLowerCase().split(' ')
        
        // Look for consecutive word matches
        for (let j = 0; j <= questionWords.length - answerWords.length; j++) {
          const window = questionWords.slice(j, j + answerWords.length).join(' ')
          if (window === answerWords.join(' ')) {
            // Replace the entire phrase with placeholder
            const words = modifiedQuestion.split(' ')
            words.splice(j, answerWords.length, `{${index}}`)
            modifiedQuestion = words.join(' ')
            break
          }
        }
      } else {
        // Single word answer
        const words = modifiedQuestion.split(' ')
        for (let j = 0; j < words.length; j++) {
          const cleanWord = words[j].replace(/[.,!?;:()[\]'"']/, '').toLowerCase()
          if (cleanWord === answer.toLowerCase() && !words[j].includes('{')) {
            words[j] = `{${index}}`
            modifiedQuestion = words.join(' ')
            break
          }
        }
      }
    })
    
    question.question = modifiedQuestion
  }
  
  question.linesConsumed = i - startIndex
  return question.answers.length > 0 ? question : null
}

// Parse short answer question
export function parseShortAnswer(lines, startIndex) {
  const question = {
    type: 'short-answer',
    question: '',
    suggestedAnswer: ''
  }
  
  let i = startIndex
  
  // Parse question line
  const questionLine = lines[i].replace(/^\d+\.\s*\[SA\]\s*/i, '')
  question.question = questionLine
  i++
  
  // Look for suggested answer
  while (i < lines.length && !/^\d+\./.test(lines[i])) {
    const line = lines[i].trim()
    if (line.startsWith('*')) {
      question.suggestedAnswer = line.substring(1).trim()
      break
    }
    i++
  }
  
  question.linesConsumed = i - startIndex
  return question
}
