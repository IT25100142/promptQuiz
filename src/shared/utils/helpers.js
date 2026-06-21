import { safeParseQuizJson as parseQuizInput } from './parsers.js'

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

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

/** Re-export: text/JSON parsing lives in parsers.js */
export function safeParseQuizJson(text) {
  return parseQuizInput(text)
}

export function getScore(quiz, answers) {
  if (!Array.isArray(quiz) || !Array.isArray(answers)) {
    return 0
  }

  return answers.reduce((total, answer, idx) => {
    if (answer === null || answer === undefined) return total

    const question = quiz[idx]
    if (!question) return total

    const isCorrect = (() => {
      switch (question.type) {
        case 'multiple-choice':
          return answer === question.answerIndex
        case 'true-false':
          return answer !== null && (answer === 1 ? question.answer : !question.answer)
        case 'fill-blank':
        case 'cloze':
          return answer?.isCorrect === true
        case 'short-answer':
          return answer?.selfAssessedCorrect === true
        default:
          return (
            question.answerIndex === answer ||
            (question.type === 'fill-blank' && answer === question.answer) ||
            (question.type === 'cloze' && answer === question.answer)
          )
      }
    })()

    return total + (isCorrect ? 1 : 0)
  }, 0)
}

export function formatSampleJson() {
  return JSON.stringify(SAMPLE_QUIZ, null, 2)
}
