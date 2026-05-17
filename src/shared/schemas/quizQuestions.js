import { z } from 'zod'

const looseQuestion = z.record(z.string(), z.unknown())

const mcq = z
  .object({
    type: z.literal('multiple-choice'),
    question: z.string(),
    options: z.array(z.string()).min(1),
  })
  .passthrough()

const tf = z
  .object({
    type: z.literal('true-false'),
    question: z.string(),
  })
  .passthrough()

const fib = z
  .object({
    type: z.literal('fill-blank'),
    question: z.string(),
  })
  .passthrough()

const cloze = z
  .object({
    type: z.literal('cloze'),
    question: z.string(),
  })
  .passthrough()

const sa = z
  .object({
    type: z.literal('short-answer'),
    question: z.string(),
  })
  .passthrough()

const legacyMcq = z
  .object({
    question: z.string(),
    options: z.array(z.string()).min(1),
  })
  .passthrough()

export const questionSchema = z.union([mcq, tf, fib, cloze, sa, legacyMcq, looseQuestion])

export const quizArraySchema = z.array(questionSchema).min(1, 'Add at least one question')

const exportQuizSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  questions: z.array(z.record(z.string(), z.unknown())).default([]),
})

const exportDeckSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  quizzes: z.array(exportQuizSchema).default([]),
})

export const librarySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().optional(),
  decks: z.array(exportDeckSchema),
})

export function validateQuizQuestions(data) {
  const result = quizArraySchema.safeParse(data)
  if (result.success) return { ok: true, value: result.data }
  const msg = result.error.issues.map((i) => i.message).join('; ')
  return { ok: false, error: msg || 'Invalid question list' }
}

export function validateLibrarySnapshot(data) {
  const result = librarySnapshotSchema.safeParse(data)
  if (result.success) return { ok: true, value: result.data }
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
}
