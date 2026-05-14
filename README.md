# PromptQuiz

PromptQuiz is a React app for building and running active-recall quizzes: paste JSON or structured text, validate, quiz yourself with progress and scoring, and optionally keep decks offline in the browser.

## Features

- **Input**: Paste quiz JSON, try a **sample** deck, or use **plain-text / markdown-style** parsers (see `safeParseQuizJson` in `src/shared/utils/helpers.js`) when the pasted content is not strict JSON.
- **Question types** (when present on each item): `multiple-choice`, `true-false`, `fill-blank`, `cloze`, `short-answer` (self-assessed). Legacy items may omit `type` and still work for classic MCQ shapes.
- **Session UI**: Progress, score, navigation, shuffle (optional “keep first question”), and a **results / review** pass at the end of a run.
- **Decks (IndexedDB)**: Folders → quizzes → questions stored locally; **last-used deck** can restore on load.
- **Review**: Retry mistakes, optional **spaced-repetition-style** scheduling hooks (due reviews loaded from IndexedDB), and related notices in the app shell.
- **AI prompt builder** (UI): Helps craft prompts; quiz content still flows through your normal import/save paths.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home / entry |
| `/create` | Create or edit deck content |
| `/quiz` | Active quiz session |
| `/results` | Post-session results |
| `/decks` | Browse and manage saved decks |

## Quiz JSON format

Minimal multiple-choice example:

```json
[
  {
    "type": "multiple-choice",
    "question": "What does HTTP stand for?",
    "options": [
      "HyperText Transfer Protocol",
      "High Transfer Text Protocol",
      "Hyper Transfer Type Protocol",
      "Home Tool Transfer Protocol"
    ],
    "answer": "HyperText Transfer Protocol",
    "answerIndex": 0
  }
]
```

You can use either matching **answer** text or **answerIndex** (`0` … `n-1` for `options`). Other types add fields such as `answers` arrays for blanks/cloze; see sample data in `src/shared/utils/helpers.js`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```
