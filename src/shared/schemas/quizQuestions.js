import { z } from 'zod';

const mcqSchema = z.object({
  type: z.literal('multiple-choice'),
  question: z.string().min(1, 'Question stem is required'),
  options: z.array(z.string()).min(2, 'Multiple choice must have at least 2 options'),
  answer: z.string().min(1, 'Answer option text is required'),
  answerIndex: z.number().int().min(0, 'Answer index must be >= 0'),
});

const tfSchema = z.object({
  type: z.literal('true-false'),
  question: z.string().min(1, 'Question stem is required'),
  answer: z.boolean(),
});

const fibSchema = z.object({
  type: z.literal('fill-blank'),
  question: z.string().refine(
    (q) => q.includes('___'),
    'Fill in the blank question must contain a blank placeholder like ___'
  ),
  answers: z.array(z.string()).min(1, 'At least one correct answer is required'),
});

const clozeSchema = z.object({
  type: z.literal('cloze'),
  question: z.string().refine(
    (q) => /\{[0-9]+\}/.test(q),
    'Cloze question must contain index placeholders like {0}'
  ),
  answers: z.array(z.string()).min(1, 'At least one correct answer is required'),
});

const saSchema = z.object({
  type: z.literal('short-answer'),
  question: z.string().min(1, 'Question stem is required'),
  suggestedAnswer: z.string().min(1, 'Suggested answer is required'),
});

export const strictQuestionSchema = z.discriminatedUnion('type', [
  mcqSchema,
  tfSchema,
  fibSchema,
  clozeSchema,
  saSchema
]);

export const questionSchema = strictQuestionSchema;

export const quizArraySchema = z.array(strictQuestionSchema).min(1, 'Add at least one question');

const exportQuizSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  questions: z.array(strictQuestionSchema).default([]),
});

const exportDeckSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  quizzes: z.array(exportQuizSchema).default([]),
});

export const librarySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().optional(),
  decks: z.array(exportDeckSchema),
});

export function validateQuestionStructure(payload) {
  const result = quizArraySchema.safeParse(payload);
  if (result.success) return { ok: true, value: result.data };
  const errorMsg = result.error.issues
    .map((i) => `[Question ${i.path[0] ?? ''}] ${i.message}`)
    .join('; ');
  return { ok: false, error: errorMsg };
}

export function validateQuizQuestions(data) {
  return validateQuestionStructure(data);
}

export function validateLibrarySnapshot(data) {
  const result = librarySnapshotSchema.safeParse(data);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
