export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateQuizData(data) {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Quiz data must be an array' }
  }

  if (data.length === 0) {
    return { valid: false, error: 'Quiz must have at least one question' }
  }

  for (let i = 0; i < data.length; i++) {
    const question = data[i]
    const errors = []

    if (!question.question || typeof question.question !== 'string') {
      errors.push('Question text is required')
    }

    if (question.type === 'multiple-choice') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push('Multiple choice questions must have at least 2 options')
      }

      if (question.answerIndex === undefined || question.answerIndex < 0 || question.answerIndex >= question.options.length) {
        errors.push('Valid answer index is required')
      }
    }

    if (question.type === 'true-false') {
      if (question.answer === undefined || typeof question.answer !== 'boolean') {
        errors.push('True/false questions must have a boolean answer')
      }
    }

    if (errors.length > 0) {
      return { valid: false, error: `Question ${i + 1}: ${errors.join(', ')}` }
    }
  }

  return { valid: true, error: null }
}

export function validateDeck(deck) {
  if (!deck.name || typeof deck.name !== 'string' || deck.name.trim().length === 0) {
    return { valid: false, error: 'Deck name is required' }
  }

  if (!deck.questions || !Array.isArray(deck.questions)) {
    return { valid: false, error: 'Deck must have questions array' }
  }

  return { valid: true, error: null }
}
