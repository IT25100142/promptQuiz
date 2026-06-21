# PromptQuiz

**A privacy-first, offline study app for active recall and spaced repetition — built entirely in the browser.**

PromptQuiz is a single-page React application that lets you create quiz decks from JSON or plain text, practice with rich question types, schedule reviews with the SM-2 algorithm, and sync content with external LLMs through a copy-paste AI Prompt Builder. No accounts, no backend, no API keys — your decks live in **IndexedDB** on your device.

The interface has been refined with a **premium glassmorphism design system**: ambient mesh backgrounds, frosted navigation, fluid card transitions, and polished dark/light themes powered by **Tailwind CSS v4**.

---

## Why PromptQuiz?

| Principle | What it means |
|-----------|----------------|
| **Offline-first** | Full functionality without a network connection after first load |
| **Privacy-first** | No server uploads; study data never leaves your browser |
| **Developer-friendly** | Clean React architecture, Zod validation, Vitest tests, documented in [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) |
| **AI-assisted, not AI-dependent** | Generate prompts for Gemini, Claude, or ChatGPT — paste structured responses back in |

---

## Core Features

### Active recall sessions
Run interactive quiz sessions with five question types (multiple choice, true/false, fill-in-the-blank, cloze, short answer). Navigate forward and backward, shuffle cards, track score and progress, review mistakes, and use **Zen mode** for distraction-free study.

### IndexedDB persistence (`PromptQuizDB`)
Decks, quizzes, questions, and review schedules are stored locally in a relational-like IndexedDB schema. Export and import your entire library as validated JSON snapshots.

### SM-2 spaced repetition
Rate recall quality (1–5) after each answer. The SuperMemo-2 engine in `src/shared/services/sm2.js` calculates optimal review intervals and stores schedules in the `reviewSchedule` object store.

### AI Prompt Builder
Open the in-app modal, configure topic and question types, copy a formatted prompt to your preferred LLM, then paste the response back. The parser validates output and inserts questions into your deck — no API integration required.

### Library backup and portability
Export your full library from `/decks` or the Command HUD (`⌘K` → `>export`). Import restores decks with strict Zod schema validation.

### Command HUD
Press `Ctrl+K` / `⌘K` to search decks, jump to quizzes, toggle theme, export data, or enable focus mode.

---

## Design & UI

PromptQuiz uses a cohesive **Tailwind CSS v4** design system defined in `src/index.css`:

| Element | Implementation |
|---------|----------------|
| **Typography** | DM Sans (UI) + Instrument Serif (question headings) |
| **Glassmorphism** | `premium-glass`, `glass-nav`, `toast-glass` utilities with backdrop blur and inset highlights |
| **Ambient depth** | `bg-premium-mesh` gradients + animated `ambient-orb` background elements |
| **Motion** | `fade-in`, `scale-in`, `slide-in-up`, card flip transitions, glow-pulse indicators |
| **Interactive polish** | `quiz-option` hover slides, gradient `btn-primary` CTAs, pill badges, focus rings |
| **Dark mode** | Class-based `.dark` toggle with full light/dark token parity |
| **Accessibility** | `prefers-reduced-motion` support |

Key UI surfaces: floating glass navigation (`Layout.jsx`), 3D flip quiz cards with technical grid overlay (`QuizView.jsx`), and glass toast notifications.

---

## Quick Start

**Requirements:** Node.js 20+, npm 9+

```bash
git clone <your-repository-url>
cd promptQuiz
npm install
npm run dev
```

Open **http://localhost:5173** — the app redirects `/` to `/decks`.

If you hit peer dependency errors with React 19:

```bash
npm install --legacy-peer-deps
```

### Production build

```bash
npm run build
npm run preview   # serve /dist at http://localhost:4173
```

---

## Routes

| Path | Page | Purpose |
|------|------|---------|
| `/` | → `/decks` | Redirect to library |
| `/decks` | DecksPage | Library dashboard, import/export, study launch |
| `/create-deck` | CreateDeckPage | Paste or import questions into a new deck |
| `/quiz` | QuizPage | Active recall session |
| `/results` | ResultsPage | Score summary and restart |

---

## Typical Workflow

1. **Create a deck** — Go to `/create-deck`, paste JSON or AI block text, submit.
2. **Study** — From `/decks`, click **Study** on a quiz.
3. **Answer and rate** — Complete questions; rate recall quality for SM-2 scheduling.
4. **Review** — View results at `/results`; restart or review mistakes.
5. **Backup** — Export library JSON from `/decks` regularly.

### AI-assisted deck creation

1. Click **AI Builder** in the header.
2. Set topic, question count, and types → copy the generated prompt.
3. Send to an external LLM (Gemini, Claude, ChatGPT).
4. Paste the response → validated and saved to your deck.

**Tip:** Use blank-line-separated blocks with `*` marking correct answers — designed for LLM output.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, React Router 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Build | Vite 8 |
| Storage | IndexedDB + localStorage |
| Validation | Zod v4 |
| Testing | Vitest 4, Testing Library, fake-indexeddb |
| Linting | ESLint 9 (flat config), jsx-a11y |

**Not included:** Backend server, REST/GraphQL API, authentication, environment variables, or third-party LLM API calls.

---

## Architecture

PromptQuiz is a **pure client-side SPA**. Data flows from user input through parsers and Zod validation into IndexedDB; React context drives the UI.

```mermaid
flowchart TD
    Input[User Input / JSON / LLM Paste] --> Parser[parseRawInput / safeParseQuizJson]
    Parser --> Zod[Zod Schema Validator]
    Zod -->|Valid| IDB[(IndexedDB: PromptQuizDB)]
    Zod -->|Invalid| Toast[Toast / Error State]
    IDB --> Provider[QuizProvider]
    Provider --> Session[useQuizSession]
    Provider --> Library[useQuizLibrary]
    Provider --> Shell[useQuizShell]
    Session --> QuizUI[QuizPage / QuizView]
    Library --> DecksUI[DecksPage / CreateDeckPage]
    Shell --> Layout[Layout / AI Modal / Command HUD]
    QuizUI --> SM2[SM-2 Engine → reviewSchedule]
```

### Three-slice context

`QuizProvider` splits state to minimize re-renders:

- **`useQuizSession`** — Active quiz, answers, navigation, shuffle, SM-2 ratings
- **`useQuizLibrary`** — Deck CRUD, JSON input, IndexedDB sync
- **`useQuizShell`** — Toasts, AI modal, parse messages

Reducer and hooks live in `src/features/quiz/hooks/`. Persistence is centralized in `src/shared/services/indexedDB.js`.

### IndexedDB schema (v2)

```
decks → quizzes → questions
                    ↓
              reviewSchedule (SM-2 metadata per question)
```

For full schema fields, API surface, and contributor guidelines, see [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

---

## Question Types & Import Formats

**Types:** `multiple-choice`, `true-false`, `fill-blank`, `cloze`, `short-answer`

**Import formats:** JSON array, AI block text (recommended), Markdown headers, CSV-style lists.

Example AI block:

```text
[T/F] React 19 works with Vite 8.
*True

[FIB] The hook for side effects is ______.
*useEffect

What does CSS stand for?
A. Creative Style Sheets
B. Cascading Style Sheets
*Cascading Style Sheets
```

JSON and full schema definitions: `src/shared/schemas/quizQuestions.js`

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR (port **5173**) |
| `npm run build` | Production build → `/dist` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest suite once |
| `npm run test:watch` | Vitest watch mode |

---

## Testing

```bash
npm test
npm run lint
```

Tests use **Vitest + jsdom + fake-indexeddb**. Ten test files cover schemas, parsers, IndexedDB, scoring, context, and page flows.

> IndexedDB warnings in some route tests are expected in Node/jsdom and do not fail the suite.

---

## Project Structure

```text
promptQuiz/
├── README.md
├── PROJECT_CONTEXT.md      # Deep technical reference for contributors & AI agents
├── src/
│   ├── App.jsx             # Routes
│   ├── index.css           # Tailwind v4 design system & utilities
│   ├── components/         # Layout, QuizView, CommandHUD, modals
│   ├── contexts/           # QuizContext (three-slice provider)
│   ├── pages/              # Route pages
│   ├── features/           # ai, decks, quiz, ui, questions modules
│   └── shared/
│       ├── schemas/        # Zod validation
│       ├── services/       # indexedDB.js, sm2.js
│       └── utils/          # parsers, helpers
└── vitest.config.js
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank `/quiz` page | Start a quiz from `/decks` first |
| Parse errors | Ensure JSON is an array; text blocks separated by one blank line |
| Data lost on browser clear | Export library JSON regularly from `/decks` |
| 404 on production refresh | Configure SPA fallback to `/index.html` on your host |
| Missing styles | Confirm `@tailwindcss/vite` is in `vite.config.js` |

---

## Contributing

1. Run `npm run lint` and `npm test` before submitting changes.
2. Co-locate tests as `*.test.js` / `*.test.jsx` beside source files.
3. New question types require updates to Zod schemas **and** both parsers (`parsers.js`, `helpers.js`).
4. Read [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) before modifying state, IndexedDB, or import logic.

---

## Author

**Sankalpa KMCP** — First-year IT undergraduate at SLIIT, building practical, privacy-first tools at the intersection of web development and AI-assisted learning.

---

## License

Open-source. Add a `LICENSE` file before public distribution.
