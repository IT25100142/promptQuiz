import { describe, it, expect } from 'vitest';
import { parseRawInput } from './parsers.js';
import { validateQuestionStructure } from '../schemas/quizQuestions.js';

describe('Multi-Format Ingestion Engine (parsers.js)', () => {
  it('parses an AI block with extra whitespace and normalizes it correctly', () => {
    const rawInput = `
    
    [T/F]    React 19 is   fully supported.   
    *True   
    
    `;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('true-false');
    expect(parsed[0].question).toBe('React 19 is   fully supported.');
    expect(parsed[0].answer).toBe(true);

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });

  it('accurately parses standard MCQ blocks, extracting options and calculating zero-indexed answerIndex', () => {
    const rawInput = `
What is Vite 8?
A. A database
B. A fast bundler and dev server
C. A styling engine
*B
`;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('multiple-choice');
    expect(parsed[0].question).toBe('What is Vite 8?');
    expect(parsed[0].options).toEqual(['A database', 'A fast bundler and dev server', 'A styling engine']);
    expect(parsed[0].answerIndex).toBe(1);
    expect(parsed[0].answer).toBe('A fast bundler and dev server');

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });

  it('accurately parses MCQ blocks with exact answer matching', () => {
    const rawInput = `
What is Tailwind CSS?
A. A testing library
B. A utility-first CSS framework
*A utility-first CSS framework
`;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('multiple-choice');
    expect(parsed[0].answerIndex).toBe(1);
    expect(parsed[0].answer).toBe('A utility-first CSS framework');

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });

  it('fails gracefully and reports descriptive Zod errors on invalid/corrupted layouts', () => {
    // Missing correct answer for MCQ (Vanguard validation should fail minimum options or answer)
    const rawInput = `
What is this?
A. Only one option
`;

    const parsed = parseRawInput(rawInput);
    // Even if parsed, it will fail Zod validation because it has only 1 option
    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(false);
    expect(validation.error).toContain('Multiple choice must have at least 2 options');
  });

  it('parses Markdown format question lists', () => {
    const rawInput = `
# Which hook registers state?
- useMemo
- *useState
- useEffect
`;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('multiple-choice');
    expect(parsed[0].question).toBe('Which hook registers state?');
    expect(parsed[0].options).toEqual(['useMemo', 'useState', 'useEffect']);
    expect(parsed[0].answerIndex).toBe(1);
    expect(parsed[0].answer).toBe('useState');

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });

  it('parses MCQ blocks with [Multiple Choice] type marker on its own line', () => {
    const rawInput = `
[Multiple Choice]
Which of the following Python data types is immutable?
list
dictionary
set
tuple
*tuple
`;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('multiple-choice');
    expect(parsed[0].question).toBe('Which of the following Python data types is immutable?');
    expect(parsed[0].options).toEqual(['list', 'dictionary', 'set', 'tuple']);
    expect(parsed[0].answerIndex).toBe(3);
    expect(parsed[0].answer).toBe('tuple');

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });

  it('parses CSV format question lists', () => {
    const rawInput = `
Question: Which hook executes side effects?
A. useState
B. useEffect
*B
`;

    const parsed = parseRawInput(rawInput);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('multiple-choice');
    expect(parsed[0].question).toBe('Which hook executes side effects?');
    expect(parsed[0].options).toEqual(['useState', 'useEffect']);
    expect(parsed[0].answerIndex).toBe(1);
    expect(parsed[0].answer).toBe('useEffect');

    const validation = validateQuestionStructure(parsed);
    expect(validation.ok).toBe(true);
  });
});
