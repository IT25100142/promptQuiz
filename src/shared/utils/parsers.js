/**
 * Sanitizes input text by normalizing carriage returns, control characters, and trailing whitespace.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeInput(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Automatically detects the format of the raw text: 'markdown', 'csv', or 'ai-block'.
 * @param {string} text 
 * @returns {string}
 */
export function detectFormat(text) {
  const normalized = text.trim();
  if (normalized.startsWith('#') || normalized.includes('\n#') || normalized.includes('\n##')) {
    return 'markdown';
  }
  
  // CSV / Semi-structured detection
  if (normalized.toLowerCase().includes('question:') && 
      (normalized.includes('\nAnswer:') || normalized.includes('\n*'))) {
    return 'csv';
  }

  // Default to AI Block format
  return 'ai-block';
}

/**
 * Parses true/false questions from block lines.
 */
function parseTrueFalseBlock(lines) {
  const firstLine = lines[0].replace(/^\[T\/F\]\s*/i, '').trim();
  let answer = true;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('*')) {
      const val = line.substring(1).trim().toLowerCase();
      answer = val === 'true' || val === 't' || val === 'yes' || val === 'y';
      break;
    }
  }

  return {
    type: 'true-false',
    question: firstLine,
    answer
  };
}

/**
 * Parses fill in the blank questions from block lines.
 */
function normalizeFibUnderscores(questionText) {
  return questionText.replace(/_{2,}/g, '___')
}

function parseFillBlankBlock(lines) {
  const firstLine = normalizeFibUnderscores(lines[0].replace(/^\[FIB\]\s*/i, '').trim());
  let answers = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('*')) {
      answers = [line.substring(1).trim()];
      break;
    }
  }

  return {
    type: 'fill-blank',
    question: firstLine,
    answers
  };
}

/**
 * Parses cloze deletion questions from block lines.
 */
function parseClozeBlock(lines) {
  const firstLine = lines[0].replace(/^\[CLOZE\]\s*/i, '').trim();
  let answers = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('*')) {
      answers = line.substring(1).split(',').map(a => a.trim()).filter(Boolean);
      break;
    }
  }

  return {
    type: 'cloze',
    question: firstLine,
    answers
  };
}

/**
 * Parses short answer questions from block lines.
 */
function parseShortAnswerBlock(lines) {
  const firstLine = lines[0].replace(/^\[SA\]\s*/i, '').trim();
  let suggestedAnswer = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('*')) {
      suggestedAnswer = line.substring(1).trim();
      break;
    }
  }

  return {
    type: 'short-answer',
    question: firstLine,
    suggestedAnswer
  };
}

/**
 * Parses multiple choice questions from block lines.
 */
function parseMultipleChoiceBlock(lines) {
  const question = lines[0].replace(/^\d+\.\s*/, '').trim();
  const options = [];
  let answerIndex = 0;
  let answer = '';
  let asteriskOptionIndex = -1;
  let asteriskAnswerValue = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^[A-E]\.\s*/i.test(line)) {
      // Option line (e.g. "A. option text")
      const optText = line.replace(/^[A-E]\.\s*/i, '').trim();
      options.push(optText);
    } else if (line.startsWith('*')) {
      // Correct answer line (e.g. "*B" or "*Cascading Style Sheets")
      const ansVal = line.substring(1).trim();
      if (/^[A-E]$/i.test(ansVal)) {
        // Correct choice is designated by letter
        asteriskOptionIndex = ansVal.toUpperCase().charCodeAt(0) - 65;
      } else {
        // Correct choice is designated by exact text matching
        asteriskAnswerValue = ansVal;
      }
    } else if (options.length < 5) {
      // Option line without prefix
      // If it starts with *, it shouldn't hit here due to startsWith('*') check
      options.push(line);
    }
  }

  if (asteriskOptionIndex >= 0 && asteriskOptionIndex < options.length) {
    answerIndex = asteriskOptionIndex;
    answer = options[answerIndex];
  } else if (asteriskAnswerValue) {
    const matchedIdx = options.findIndex(opt => opt.toLowerCase() === asteriskAnswerValue.toLowerCase());
    if (matchedIdx !== -1) {
      answerIndex = matchedIdx;
      answer = options[answerIndex];
    } else {
      // Add custom answer to options if not found
      answerIndex = options.length;
      options.push(asteriskAnswerValue);
      answer = asteriskAnswerValue;
    }
  } else if (options.length > 0) {
    // Fallback default
    answer = options[0];
    answerIndex = 0;
  }

  return {
    type: 'multiple-choice',
    question,
    options,
    answer,
    answerIndex
  };
}

/**
 * Parses AI Block text.
 */
function parseAIBlockFormat(text) {
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const questions = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const head = lines[0];
    let qObj = null;

    if (/^\[T\/F\]/i.test(head)) {
      qObj = parseTrueFalseBlock(lines);
    } else if (/^\[FIB\]/i.test(head)) {
      qObj = parseFillBlankBlock(lines);
    } else if (/^\[CLOZE\]/i.test(head)) {
      qObj = parseClozeBlock(lines);
    } else if (/^\[SA\]/i.test(head)) {
      qObj = parseShortAnswerBlock(lines);
    } else {
      qObj = parseMultipleChoiceBlock(lines);
    }

    if (qObj) {
      questions.push(qObj);
    }
  }

  return questions;
}

/**
 * Parses Markdown text.
 */
function parseMarkdownFormat(text) {
  // Split by headers (# or ##)
  const segments = text.split(/^#+\s+/m).map(s => s.trim()).filter(Boolean);
  const questions = [];

  for (const seg of segments) {
    const lines = seg.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const question = lines[0];
    const options = [];
    let answer = '';
    let answerIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      if (line.startsWith('-') || line.startsWith('*')) {
        // Strip list prefix
        line = line.replace(/^[-*]\s*/, '').trim();
        if (line.startsWith('*')) {
          // Marked correct (e.g. "- *Option text" or "* *Option text")
          const optVal = line.substring(1).trim();
          answerIndex = options.length;
          options.push(optVal);
          answer = optVal;
        } else {
          options.push(line);
        }
      }
    }

    if (options.length > 0) {
      if (!answer) {
        answer = options[0];
        answerIndex = 0;
      }
      questions.push({
        type: 'multiple-choice',
        question,
        options,
        answer,
        answerIndex
      });
    }
  }

  return questions;
}

/**
 * Parses CSV/Semi-structured format text.
 */
function parseCSVFormat(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  let currentQ = null;

  for (const line of lines) {
    if (line.toLowerCase().startsWith('question:')) {
      if (currentQ && currentQ.options.length >= 2) {
        questions.push(finalizeMCQ(currentQ));
      }
      currentQ = {
        type: 'multiple-choice',
        question: line.substring(9).trim(),
        options: [],
        rawAnswer: ''
      };
    } else if (currentQ && /^[A-E]\.\s*/i.test(line)) {
      const optText = line.replace(/^[A-E]\.\s*/i, '').trim();
      currentQ.options.push(optText);
    } else if (currentQ && (line.startsWith('*') || line.toLowerCase().startsWith('answer:'))) {
      const rawAns = line.replace(/^(\*|answer:)\s*/i, '').trim();
      currentQ.rawAnswer = rawAns;
    }
  }

  if (currentQ && currentQ.options.length >= 2) {
    questions.push(finalizeMCQ(currentQ));
  }

  return questions;
}

function finalizeMCQ(q) {
  let answerIndex = 0;
  let answer = '';
  
  if (/^[A-E]$/i.test(q.rawAnswer)) {
    const idx = q.rawAnswer.toUpperCase().charCodeAt(0) - 65;
    if (idx < q.options.length) {
      answerIndex = idx;
      answer = q.options[idx];
    }
  } else if (q.rawAnswer) {
    const idx = q.options.findIndex(opt => opt.toLowerCase() === q.rawAnswer.toLowerCase());
    if (idx !== -1) {
      answerIndex = idx;
      answer = q.options[idx];
    } else {
      answerIndex = q.options.length;
      q.options.push(q.rawAnswer);
      answer = q.rawAnswer;
    }
  }

  if (q.options.length > 0 && !answer) {
    answer = q.options[0];
    answerIndex = 0;
  }

  return {
    type: 'multiple-choice',
    question: q.question,
    options: q.options,
    answer,
    answerIndex
  };
}

/**
 * Orchestrates multi-format parsing of user input text.
 * @param {string} rawText 
 * @returns {Array<Object>} Parsed question objects before Zod validation.
 */
export function parseRawInput(rawText) {
  const sanitized = sanitizeInput(rawText);
  if (!sanitized) return [];

  const format = detectFormat(sanitized);

  switch (format) {
    case 'markdown':
      return parseMarkdownFormat(sanitized);
    case 'csv':
      return parseCSVFormat(sanitized);
    case 'ai-block':
    default:
      return parseAIBlockFormat(sanitized);
  }
}

/**
 * Safely parse quiz JSON or plain-text input with structured error results.
 * JSON arrays are parsed directly; text formats delegate to parseRawInput.
 * @param {string} text
 * @returns {{ ok: true, value: Array<Object> } | { ok: false, error: string }}
 */
export function safeParseQuizJson(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, error: 'No input provided. Please paste your quiz questions.' }
  }

  const trimmedText = text.trim()
  if (!trimmedText) {
    return { ok: false, error: 'No input provided. Please paste your quiz questions.' }
  }

  try {
    const parsed = JSON.parse(trimmedText)
    if (Array.isArray(parsed)) {
      return { ok: true, value: parsed }
    }
    return { ok: false, error: 'Input must be an array of questions' }
  } catch {
    // Not valid JSON — fall through to text parsing
  }

  try {
    const questions = parseRawInput(trimmedText)
    if (questions.length > 0) {
      return { ok: true, value: questions }
    }
    return {
      ok: false,
      error: 'Could not parse input. Please check your format and see examples in the sidebar.',
    }
  } catch {
    return {
      ok: false,
      error: 'Failed to parse text format. Please check your question formatting and see examples in the sidebar.',
    }
  }
}
