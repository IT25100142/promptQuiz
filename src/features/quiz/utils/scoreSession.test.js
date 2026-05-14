import { describe, it, expect } from 'vitest'
import {
  getIncorrectQuestions,
  questionIsCorrect,
  countCorrectInSession,
} from './scoreSession.js'

const mcqQuiz = [
  {
    type: 'multiple-choice',
    question: 'Q1',
    options: ['a', 'b'],
    answerIndex: 0,
  },
  {
    type: 'multiple-choice',
    question: 'Q2',
    options: ['a', 'b'],
    answerIndex: 1,
  },
]

describe('scoreSession', () => {
  it('marks wrong MCQ as incorrect', () => {
    const answers = [0, 0]
    const incorrect = getIncorrectQuestions(mcqQuiz, answers, {})
    expect(incorrect).toHaveLength(1)
    expect(incorrect[0].question).toBe('Q2')
  })

  it('questionIsCorrect matches session score', () => {
    const answers = [0, 1]
    const textAnswers = {}
    expect(questionIsCorrect(mcqQuiz[0], 0, answers, textAnswers)).toBe(true)
    expect(questionIsCorrect(mcqQuiz[1], 1, answers, textAnswers)).toBe(true)
    expect(countCorrectInSession(mcqQuiz, answers, textAnswers)).toBe(2)
  })

  it('session completion lists incorrect after wrong second answer', () => {
    const answers = [0, 0]
    const incorrect = getIncorrectQuestions(mcqQuiz, answers, {})
    expect(incorrect.length).toBe(1)
    expect(countCorrectInSession(mcqQuiz, answers, {})).toBe(1)
  })
})
