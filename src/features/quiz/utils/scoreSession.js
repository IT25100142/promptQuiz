/**
 * Single source of truth for whether a question was answered correctly
 * in a completed session (aligned with useQuizNavigation completion logic).
 */
export function questionIsCorrect(question, questionIdx, answers, textAnswers) {
  const answer = answers[questionIdx]
  const textAnswer = textAnswers[questionIdx]

  switch (question.type) {
    case 'multiple-choice':
      return answer === question.answerIndex
    case 'true-false':
      return (
        answer !== null &&
        (answer === 1 ? question.answer : !question.answer) === true
      )
    case 'fill-blank': {
      if (answer && typeof answer === 'object' && 'isCorrect' in answer) {
        return answer.isCorrect === true
      }
      if (!textAnswer || !question.answers) return false
      const normalizedAnswer = textAnswer.toLowerCase().trim()
      const fillCorrectAnswers = question.answers.map((a) => a.toLowerCase().trim())
      return fillCorrectAnswers.includes(normalizedAnswer)
    }
    case 'cloze': {
      if (answer && typeof answer === 'object' && 'isCorrect' in answer) {
        return answer.isCorrect === true
      }
      const clozeAnswers = []
      const blanks = question.question.split(/\{[^}]+\}/).length - 1
      for (let i = 0; i < blanks; i++) {
        clozeAnswers.push(textAnswers[`${questionIdx}-${i}`])
      }
      if (!clozeAnswers.every((a) => a) || !question.answers) return false
      const normalizedAnswers = clozeAnswers.map((a) => a.toLowerCase().trim())
      const clozeCorrectAnswers = question.answers.map((a) => a.toLowerCase().trim())
      return normalizedAnswers.every((a) => clozeCorrectAnswers.includes(a))
    }
    case 'short-answer':
      return answer?.selfAssessedCorrect === true
    default:
      return false
  }
}

export function getIncorrectQuestions(quiz, answers, textAnswers) {
  return quiz.filter(
    (question, questionIdx) =>
      !questionIsCorrect(question, questionIdx, answers, textAnswers),
  )
}

export function countCorrectInSession(quiz, answers, textAnswers) {
  return quiz.reduce(
    (n, question, i) =>
      n + (questionIsCorrect(question, i, answers, textAnswers) ? 1 : 0),
    0,
  )
}
