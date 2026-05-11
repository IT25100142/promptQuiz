# PromptQuiz

PromptQuiz is a small React app for turning a JSON array of multiple-choice questions into a focused active-recall quiz.

## Features

- Paste or load sample quiz JSON
- Validate question shape before starting
- Accept either `answer` text or `answerIndex`
- Show progress, score, and instant answer feedback
- Review every question at the end of a session

## Quiz JSON format

```json
[
  {
    "question": "What does HTTP stand for?",
    "options": [
      "HyperText Transfer Protocol",
      "High Transfer Text Protocol",
      "Hyper Transfer Type Protocol",
      "Home Tool Transfer Protocol"
    ],
    "answer": "HyperText Transfer Protocol"
  }
]
```

You can also use `answerIndex` with a value from `0` to `3`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```
