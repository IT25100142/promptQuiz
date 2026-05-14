import { questionIsCorrect } from './scoreSession.js'

export function countAnswered(answers) {
  return answers.filter((a) => a !== null).length
}

/** @param {Record<string, string>} [textAnswers] keyed by question index (and cloze `${idx}-${n}`) */
export function computeScore(quiz, answers, textAnswers = {}) {
  return quiz.reduce(
    (total, question, i) =>
      total + (questionIsCorrect(question, i, answers, textAnswers) ? 1 : 0),
    0,
  )
}

export function progressPercent(answeredCount, total) {
  return total > 0 ? (answeredCount / total) * 100 : 0
}
