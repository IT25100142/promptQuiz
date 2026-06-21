# Project Context

> **Purpose of this document:** Help developers and AI coding agents understand PromptQuiz quickly, accurately, and safely before making changes.  
> **Last verified against codebase:** June 2026  
> **Primary sources:** `package.json`, `src/App.jsx`, `src/shared/services/indexedDB.js`, `README.md`

---

## 1. Project Overview

**Project name:** PromptQuiz (`prompt-quiz` in `package.json`)

**Summary:** PromptQuiz is a high-performance, single-page React study application for **active recall** and **spaced repetition**. Users create interactive quiz decks from structured JSON or plain-text formats, run quiz sessions in the browser, and persist progress locally in IndexedDB.

**Problem it solves:** Provides an offline-first flashcard/quiz tool with flexible import formats, self-assessment scoring, SM-2 spaced repetition scheduling, and an in-app AI Prompt Builder that helps users generate LLM prompts for external tools (Gemini, Claude, ChatGPT) and paste structured responses back into the app.

**Target audience:** Developers, students, and educators who want a local, privacy-friendly study tool without a backend account system.

**Core purpose:** Build, store, practice, and review question decks entirely in the browser.

**Development status:** Appears actively developed. Version `1.0.0` in `package.json`. README is detailed. Some feature components exist but are not wired into routes (see Section 14).

**Project type:** **Frontend SPA only** — no backend server, no REST/GraphQL API, no mobile native app, no database server. All persistence is client-side (IndexedDB + localStorage).

---

## 2. Tech Stack

| Technology | Role | Identified in |
|------------|------|---------------|
| JavaScript (ES modules) | Primary language | `package.json` (`"type": "module"`), all `src/**/*.jsx` |
| React 19 | UI framework (Hooks, Context, useReducer) | `package.json`, `src/main.jsx` |
| React DOM 19 | Rendering | `package.json`, `src/main.jsx` |
| React Router DOM 7 | Client-side routing (`BrowserRouter`) | `package.json`, `src/App.jsx` |
| Vite 8 | Build tool and dev server | `package.json`, `vite.config.js` |
| Tailwind CSS v4 | Styling (via `@tailwindcss/vite` compiler) | `package.json`, `src/index.css`, `vite.config.js` |
| Zod v4 (alpha) | Schema validation for questions and library snapshots | `package.json`, `src/shared/schemas/quizQuestions.js` |
| IndexedDB (native browser API) | Primary persistent storage | `src/shared/services/indexedDB.js` |
| localStorage | Theme, zen mode, last deck ID | `src/components/Layout.jsx`, `src/shared/services/indexedDB.js` |
| Vitest 4 | Test runner | `package.json`, `vitest.config.js` |
| jsdom | DOM environment for tests | `package.json`, `vitest.config.js` |
| @testing-library/react | Component testing | `package.json`, test files |
| @testing-library/user-event | User interaction simulation | `package.json`, test files |
| @testing-library/jest-dom | DOM matchers | `src/test/setup.js` |
| fake-indexeddb | IndexedDB mock in tests | `package.json`, `src/test/setup.js` |
| ESLint 9 (flat config) | Linting | `eslint.config.js` |
| eslint-plugin-react | React lint rules | `eslint.config.js` |
| eslint-plugin-react-hooks | Hooks lint rules | `eslint.config.js` |
| eslint-plugin-jsx-a11y | Accessibility lint rules | `eslint.config.js` |
| eslint-plugin-react-refresh | Vite HMR compatibility | `eslint.config.js` |
| npm | Package manager | `package-lock.json`, README |

**Not present in codebase:**

- Backend framework/runtime (Express, Node server, etc.)
- Server-side database (PostgreSQL, MongoDB, etc.)
- ORM (Prisma, Drizzle, etc.)
- Authentication/authorization library
- State management library (Redux, Zustand, etc.) — uses React Context + useReducer
- Form library (React Hook Form, Formik, etc.)
- GraphQL, WebSockets, RPC
- Third-party API integrations (no LLM API calls from the app)
- CI/CD configuration files
- Deployment platform config (Netlify, Vercel, etc.)
- Environment variable files (`.env`, `.env.example`)

---

## 3. Project Structure

```
promptQuiz/
├── index.html                    # HTML entry; mounts React at #root
├── package.json                  # Dependencies and npm scripts
├── package-lock.json             # npm lockfile
├── vite.config.js                # Vite + React + Tailwind plugins; port 5173
├── vitest.config.js              # Vitest config (jsdom, setup file)
├── eslint.config.js              # ESLint 9 flat config
├── README.md                     # User-facing project documentation
├── PROJECT_CONTEXT.md            # This file — agent/developer context
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                  # React root mount (StrictMode)
    ├── App.jsx                   # Router + QuizProvider
    ├── index.css                 # Tailwind v4 + custom theme/animations
    ├── components/               # Legacy/shared UI (Layout, QuizView, modals)
    ├── contexts/
    │   └── QuizContext.jsx       # Three-slice context provider
    ├── pages/                    # Route-level page components
    ├── features/                 # Domain modules (ai, decks, quiz, ui, questions)
    ├── shared/
    │   ├── schemas/              # Zod validation schemas
    │   ├── services/             # IndexedDB + SM-2 algorithm
    │   ├── utils/                # Parsers, helpers, formatters
    │   └── hooks/                # useLocalStorage
    └── test/
        └── setup.js              # Vitest setup (fake-indexeddb, cleanup)
```

### Directory explanations

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Top-level route components: DecksPage, CreateDeckPage, QuizPage, ResultsPage. HomePage exists but is **not routed**. |
| `src/components/` | Shared UI used by active routes: Layout, QuizView, CommandHUD, modals, navigation. Some duplicates exist in `features/`. |
| `src/contexts/` | Global state via three memoized context slices (session, library, shell). |
| `src/features/ai/` | AI Prompt Builder modal and prompt generation services. |
| `src/features/decks/` | Deck/quiz browser components (partially unused — see Section 14). |
| `src/features/quiz/` | Quiz reducer, hooks, scoring, progress, results subcomponents. |
| `src/features/questions/` | Question editor component (not currently imported by routes). |
| `src/features/ui/` | Reusable UI primitives (buttons, inputs, modals, MarkdownRenderer). |
| `src/shared/services/` | IndexedDB CRUD and SM-2 spaced repetition math. |
| `src/shared/schemas/` | Zod schemas for questions and library export/import. |
| `src/shared/utils/` | Text/JSON parsers and legacy helper utilities. |

### How major parts connect

```
index.html → main.jsx → App.jsx
                              ├── QuizProvider (QuizContext.jsx)
                              │     └── useQuiz() → quizReducer + hooks
                              └── BrowserRouter → Layout → Outlet (pages)
                                        ├── IndexedDB (persistence)
                                        ├── parsers + Zod (validation)
                                        └── localStorage (preferences)
```

---

## 4. Core Features

### Deck Library Dashboard

**Purpose:** Browse, organize, and manage saved deck folders and their quizzes.

**How it works:** On load, `useQuizDeckSync` fetches all decks from IndexedDB into context. DecksPage displays decks, nested quizzes, question counts, review stats, and a 7-day activity matrix. Users can start a quiz, add quizzes inline, delete decks, and import/export library snapshots.

**Important files:**
- `src/pages/DecksPage.jsx`
- `src/features/quiz/hooks/useQuizDeckSync.js`
- `src/shared/services/indexedDB.js`

**Related data models:** `decks`, `quizzes`, `questions`, `reviewSchedule`

---

### Deck Creation and Import

**Purpose:** Create new decks by pasting questions in JSON or plain-text formats.

**How it works:** User enters deck name/description and raw question text on CreateDeckPage. `parseRawInput()` auto-detects format (AI block, markdown, CSV). Zod validates structure. A deck, default quiz, and questions are written to IndexedDB. User is redirected to `/decks`.

**Important files:**
- `src/pages/CreateDeckPage.jsx`
- `src/shared/utils/parsers.js`
- `src/shared/schemas/quizQuestions.js`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`

**Related data models:** `decks`, `quizzes`, `questions`

---

### Active Quiz Session

**Purpose:** Run an interactive recall session with navigation, scoring, and optional shuffle.

**How it works:** User starts a quiz from DecksPage or creation flow. Questions load into session state. QuizPage renders QuizView with current question, answer inputs (MCQ, T/F, fill-blank, cloze, short-answer), progress, card overview modal, and optional zen mode. On completion, navigates to `/results`.

**Important files:**
- `src/pages/QuizPage.jsx`
- `src/components/QuizView.jsx`
- `src/features/quiz/hooks/useQuizSessionActions.js`
- `src/features/quiz/hooks/useQuizNavigation.js`
- `src/features/quiz/utils/scoreSession.js`

**Related data models:** Session state in React (not persisted until SM-2 rating or deck save)

---

### Quiz Results and Review

**Purpose:** Show post-session accuracy, type breakdown, and options to restart or review mistakes.

**How it works:** ResultsPage reads session state (score, quiz array). Displays accuracy percentage and question-type counts. Restart resets session and returns to `/quiz`. Review-mistakes mode reloads incorrect questions into a new session.

**Important files:**
- `src/pages/ResultsPage.jsx`
- `src/features/quiz/hooks/useQuizReviewActions.js`
- `src/features/quiz/utils/scoreSession.js`

---

### Spaced Repetition (SM-2)

**Purpose:** Schedule optimal review intervals based on self-assessment quality ratings.

**How it works:** When spaced repetition is enabled, after answering a question the user rates recall quality (1–5). QuizView writes/updates `reviewSchedule` in IndexedDB using `calculateNextReview()` from SM-2. Daily review loads due cards via `getDueReviews()`. DecksPage shows review stats and activity matrix.

**Important files:**
- `src/shared/services/sm2.js`
- `src/shared/services/indexedDB.js` (review schedule CRUD)
- `src/components/QuizView.jsx`
- `src/features/quiz/hooks/useQuizReviewActions.js`

**Related data models:** `reviewSchedule`

**External services:** None

---

### AI Prompt Builder

**Purpose:** Generate copy-paste prompts for external LLMs and import pasted responses as questions.

**How it works:** Modal opened from Layout header. User configures topic, question count, and types. App generates a formatted prompt string (no API call). User copies prompt to external LLM, pastes response back. `parseRawInput()` + Zod validation import questions into selected or new deck.

**Important files:**
- `src/features/ai/AiPromptBuilderModal.jsx`
- `src/features/ai/services/aiPromptGenerator.js`
- `src/shared/utils/parsers.js`

**External services:** User's choice of external LLM (not integrated in code)

---

### Library Backup and Restore

**Purpose:** Export and import full library as JSON for portability and disaster recovery.

**How it works:** Export builds a snapshot via `exportLibrarySnapshot()` with `schemaVersion: 1`. Import validates with Zod `librarySnapshotSchema` and replaces all existing decks by default (`mode: 'replace'`). Available from DecksPage and Command HUD (`>export`).

**Important files:**
- `src/shared/services/indexedDB.js` (`exportLibrarySnapshot`, `importLibrarySnapshot`)
- `src/shared/schemas/quizQuestions.js` (`librarySnapshotSchema`)
- `src/pages/DecksPage.jsx`
- `src/components/CommandHUD.jsx`

---

### Command HUD (⌘K Palette)

**Purpose:** Quick navigation and actions via keyboard.

**How it works:** Ctrl/Cmd+K opens modal. Search decks/quizzes by name. Prefix `>` filters actions: toggle zen mode, export library, toggle theme, clear session.

**Important files:**
- `src/components/CommandHUD.jsx`
- `src/components/Layout.jsx`

---

## 5. Application Flow

### Main user journey: First deck → first quiz → results

1. User opens app at `/` → redirected to `/decks`.
2. User clicks **New Deck** or navigates to `/create-deck`.
3. User pastes questions (JSON or text), submits → deck + quiz + questions saved to IndexedDB → redirect to `/decks`.
4. User clicks **Study** on a quiz → questions loaded into session state → navigate to `/quiz`.
5. User answers questions, navigates forward/back, optionally rates SM-2 quality.
6. On last question completion → `completeQuizSession()` → navigate to `/results`.
7. User reviews score, restarts, or returns to library.

### AI-assisted creation flow

1. User opens **AI Builder** from header (any page).
2. Configures topic, count, question types → copies generated prompt.
3. Sends prompt to external LLM manually.
4. Pastes LLM output into modal → parsed and validated → saved to deck.

### Frontend flow

```
App.jsx
  └── QuizProvider (initDB on mount)
        └── Layout (theme, toast, AI modal, Command HUD)
              └── Outlet → Page component
                    └── useQuizSession / useQuizLibrary / useQuizShell
```

### Data flow (create deck)

```
Raw text → parseRawInput() → validateQuestionStructure() (Zod)
  → createDeck() → createQuiz() → addQuestions() → IndexedDB
  → getAllDecks() → context.savedDecks updated
```

### Data flow (quiz session)

```
getQuestionsByQuizId() → session.quiz
User answers → session.answers / textAnswers
SM-2 rating → calculateNextReview() → reviewSchedule store
completeQuizSession() → ResultsPage reads score from context
```

### Authentication flow

**Not applicable.** No authentication in this project.

### Error handling flow

- Parse/validation errors → toast via `shell.showToast()` or `appNotice` state.
- IndexedDB failures → thrown errors caught in page/hook handlers, logged with `console.error`, user-facing toast.
- Empty quiz at `/quiz` → inline empty state with link to create deck.
- RouteErrorBoundary exists (`src/components/RouteErrorBoundary.jsx`) but is **not wired** into App.jsx.

---

## 6. Architecture Explanation

### High-level architecture

Pure **client-side SPA**. No server layer. Business logic lives in hooks and service modules. UI is split between route pages and reusable components. Persistence is abstracted behind `indexedDB.js`.

```
User
  ↓
Page / Component (React)
  ↓
Context Hook (useQuizSession / useQuizLibrary / useQuizShell)
  ↓
Feature Hook (useQuizDeckHierarchy, useQuizSessionActions, etc.)
  ↓
Service Layer (indexedDB.js, sm2.js, parsers.js)
  ↓
Browser Storage (IndexedDB / localStorage)
```

### Frontend architecture

- **Routing:** React Router 7 with nested layout route (`Layout` wraps all pages).
- **State:** Single `useReducer` in `useQuizState.js`, split into three memoized context values to limit re-renders.
- **Feature folders:** Domain code under `src/features/{ai,decks,quiz,questions,ui}`.
- **Legacy components:** `src/components/` holds actively used UI; overlaps with `features/ui/` and `features/quiz/components/`.

### Backend architecture

**None.** This is a static frontend application.

### Database architecture

IndexedDB database `PromptQuizDB` (version 2) with four object stores modeling a hierarchy:

```
decks (1) ──→ (many) quizzes ──→ (many) questions
                                      ↓
                              (1) reviewSchedule per question
```

### API architecture

**None.** No HTTP endpoints. All operations are direct IndexedDB transactions.

### Design patterns

- **Context slicing:** Three contexts instead of one large context (performance).
- **Reducer + hook composition:** `quizReducer` for state; specialized hooks for deck sync, session actions, review, JSON input.
- **Service module:** `indexedDB.js` encapsulates all persistence.
- **Schema-first validation:** Zod schemas shared between import, export, and preview.
- **Discriminated union:** Question types validated via Zod `discriminatedUnion('type', ...)`.

### Architectural weaknesses / unusual decisions

1. **Dual parser implementations:** `parsers.js` and `helpers.js` both parse text formats — maintenance burden.
2. **Duplicate UI components:** Two MarkdownRenderer implementations; duplicate ProgressBar/QuizProgress.
3. **Orphan feature components:** Several components in `features/` are not imported anywhere.
4. **SM-2 writes in QuizView:** Review schedule updates happen inside a UI component rather than a dedicated service hook.
5. **No error boundary in router:** RouteErrorBoundary exists but unused.
6. **Zod v4 alpha:** Production dependency on pre-release Zod.

---

## 7. Database and Data Models

**Database type:** IndexedDB (browser-native, client-side)

**Library:** Native IndexedDB API wrapped in `src/shared/services/indexedDB.js` (no ORM)

**Database name:** `PromptQuizDB`  
**Version:** `2` (defined in `indexedDB.js`)

**Migration:** Handled in `request.onupgradeneeded` — creates stores and indexes if missing. No explicit data migration logic between versions beyond store creation.

---

### decks

**Purpose:** Top-level folder grouping quizzes (like a study subject or course module).

**Defined in:** `src/shared/services/indexedDB.js` (`onupgradeneeded`)

**Important fields:**
- `id` — auto-increment primary key
- `name` — deck display name
- `date` — ISO timestamp of creation
- `description` — optional text

**Indexes:** `name`, `date`

**Relationships:**
- Has many `quizzes` (via `quizzes.deckId`)

**Used by:**
- `src/pages/DecksPage.jsx`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`
- `src/shared/services/indexedDB.js` (CRUD)

---

### quizzes

**Purpose:** A quiz file within a deck; contains an ordered set of questions.

**Defined in:** `src/shared/services/indexedDB.js`

**Important fields:**
- `id` — auto-increment primary key
- `deckId` — foreign key to `decks.id`
- `name` — quiz name
- `date` — ISO timestamp
- `description` — optional text

**Indexes:** `name`, `deckId`, `date`

**Relationships:**
- Belongs to `decks`
- Has many `questions` (via `questions.quizId`)

**Used by:**
- `src/pages/DecksPage.jsx`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`

---

### questions

**Purpose:** Individual quiz items with type-specific fields.

**Defined in:** `src/shared/services/indexedDB.js`, validated by `src/shared/schemas/quizQuestions.js`

**Important fields:**
- `id` — auto-increment primary key
- `quizId` — foreign key to `quizzes.id`
- `deckId` — foreign key to `decks.id` (denormalized for queries)
- `order` — sort sequence within quiz
- `type` — one of: `multiple-choice`, `true-false`, `fill-blank`, `cloze`, `short-answer`
- `question` — question stem text
- `date` — ISO timestamp
- `options`, `answer`, `answerIndex` — multiple-choice
- `answer` (boolean) — true-false
- `answers` (string[]) — fill-blank, cloze
- `suggestedAnswer` — short-answer

**Indexes:** `quizId`, `deckId`, `order`

**Validation rules (Zod):**
- MCQ: min 2 options, valid answerIndex
- Fill-blank: must contain `___`
- Cloze: must contain `{0}` style placeholders
- Short-answer: requires suggestedAnswer

**Used by:**
- `src/components/QuizView.jsx`
- `src/shared/services/indexedDB.js`
- All quiz session/scoring utilities

---

### reviewSchedule

**Purpose:** SM-2 spaced repetition metadata per question.

**Defined in:** `src/shared/services/indexedDB.js`

**Important fields:**
- `id` — auto-increment primary key
- `questionId` — unique reference to `questions.id`
- `deckId` — denormalized deck reference
- `interval` — days until next review
- `easeFactor` — SM-2 ease multiplier (default 2.5)
- `nextReviewDate` — ISO date string
- `createdDate` — ISO timestamp
- `lastReviewedDate` — ISO timestamp (optional)

**Indexes:** `questionId` (unique), `nextReviewDate`, `deckId`

**Relationships:**
- One schedule entry per question (unique index on `questionId`)

**Used by:**
- `src/components/QuizView.jsx` (SM-2 rating writes)
- `src/features/quiz/hooks/useQuizReviewActions.js` (daily review)
- `src/pages/DecksPage.jsx` (stats matrix)

---

## 8. API Routes and Endpoints

**This project has no API routes or HTTP endpoints.**

It is a purely client-side application. All data operations are performed via:

- IndexedDB transactions in `src/shared/services/indexedDB.js`
- React context state in memory during quiz sessions
- Browser file download/upload for JSON library snapshots (no server upload)

If a backend is added in the future, document new endpoints here.

---

## 9. Important Components, Modules, and Services

### src/main.jsx

**Purpose:** Application entry point.

**Responsibilities:**
- Mount React root with StrictMode
- Import global CSS

**Used by:** `index.html`

---

### src/App.jsx

**Purpose:** Root component defining routes and global provider.

**Responsibilities:**
- Wrap app in `QuizProvider`
- Define all routes and legacy redirects
- Nest pages inside `Layout`

**Used by:** `src/main.jsx`

**Notes:** Routes: `/`, `/decks`, `/create-deck`, `/create` (redirect), `/quiz`, `/results`

---

### src/contexts/QuizContext.jsx

**Purpose:** Global state provider with three context slices.

**Responsibilities:**
- Call `initDB()` on mount
- Expose `useQuizSession`, `useQuizLibrary`, `useQuizShell`
- Add toast compatibility layer on shell slice

**Depends on:** `useQuizState.js`, `indexedDB.js`

**Used by:** All pages and Layout

---

### src/features/quiz/hooks/useQuizState.js

**Purpose:** Central state orchestrator composing reducer and feature hooks.

**Responsibilities:**
- Run `quizReducer`
- Compose session, library, and shell memoized objects
- Wire deck hierarchy, deck sync, JSON input, review, and session action hooks

**Depends on:** Multiple hooks in `src/features/quiz/hooks/`

**Used by:** `QuizContext.jsx`

---

### src/features/quiz/hooks/quizReducer.js

**Purpose:** Reducer for global quiz application state.

**Responsibilities:**
- Manage quiz session, library, UI shell state via action types
- `SET_STATE` for bulk updates; specific actions for common mutations

**Used by:** `useQuizState.js`

---

### src/shared/services/indexedDB.js

**Purpose:** Complete IndexedDB persistence layer (~980 lines).

**Responsibilities:**
- Open/manage `PromptQuizDB` connection
- CRUD for decks, quizzes, questions, review schedules
- Export/import library snapshots
- localStorage helpers for last used deck ID
- Review stats and activity timestamps

**Exports:** `initDB`, deck/quiz/question CRUD, review schedule functions, `exportLibrarySnapshot`, `importLibrarySnapshot`, test utilities `closeDB`, `resetDBPromise`

**Used by:** Hooks, pages, QuizView, CommandHUD, tests

**Notes:** Single shared `dbOpenPromise` for connection reuse

---

### src/shared/services/sm2.js

**Purpose:** SuperMemo-2 algorithm implementation.

**Responsibilities:**
- Calculate next interval, ease factor, and review date from quality rating (1–5)

**Inputs:** `{ interval, easeFactor, quality }`  
**Outputs:** `{ interval, easeFactor, nextReviewDate }`

**Used by:** `QuizView.jsx`, tests

---

### src/shared/schemas/quizQuestions.js

**Purpose:** Zod schemas for all question types and library snapshots.

**Responsibilities:**
- Define per-type question schemas
- Export `validateQuestionStructure`, `validateQuizQuestions`, `validateLibrarySnapshot`

**Used by:** CreateDeckPage, AiPromptBuilderModal, indexedDB import/export, useQuizState preview

---

### src/shared/utils/parsers.js

**Purpose:** Primary multi-format text parser for deck creation and AI import.

**Responsibilities:**
- `sanitizeInput`, `detectFormat`, `parseRawInput`
- Parse AI block, markdown, and CSV formats into question objects

**Used by:** `CreateDeckPage.jsx`, `AiPromptBuilderModal.jsx`, tests

---

### src/shared/utils/helpers.js

**Purpose:** Legacy utilities and alternate parser (`safeParseQuizJson`).

**Responsibilities:**
- `cx()` class name helper
- `SAMPLE_QUIZ` demo data
- `safeParseQuizJson()` — JSON + text parsing (parallel to parsers.js)
- Additional parse functions: `parseTextFormat`, `parseCSVFormat`, `parseMarkdownFormat`, etc.

**Used by:** `useQuizState.js`, `useQuizJsonInput.js`, various components for `cx()`

**Notes:** Changes to import formats may require updates here AND in `parsers.js`

---

### src/components/Layout.jsx

**Purpose:** App shell with navigation, theme, toast, AI modal, Command HUD.

**Responsibilities:**
- Sticky header with nav links
- Dark/light theme toggle (localStorage `theme`)
- Global toast auto-dismiss (3s)
- Render `AiPromptBuilderModal` and `CommandHUD`

**Used by:** `App.jsx` as layout route element

---

### src/components/QuizView.jsx

**Purpose:** Main interactive quiz UI (~660 lines).

**Responsibilities:**
- Render all question types
- Handle answer selection, text input, self-assessment
- SM-2 rating and direct IndexedDB review schedule writes
- Zen mode, card overview, keyboard shortcuts
- Navigation and quiz completion

**Depends on:** `sm2.js`, `indexedDB.js`, `useLocalStorage`, `useKeyPress`

**Used by:** `QuizPage.jsx`

---

### src/features/ai/AiPromptBuilderModal.jsx

**Purpose:** Modal for LLM prompt generation and response import.

**Responsibilities:**
- Generate prompt from user config
- Copy to clipboard
- Parse pasted LLM output and save to deck/quiz

**Used by:** `Layout.jsx`

---

### src/pages/DecksPage.jsx

**Purpose:** Library dashboard (~580 lines).

**Responsibilities:**
- Display decks, quizzes, question counts, review stats
- 7-day review activity heatmap matrix
- Inline quiz creation, study launch, delete
- Import/export library JSON files

**Used by:** Route `/decks`

---

### src/components/CommandHUD.jsx

**Purpose:** Keyboard command palette.

**Responsibilities:**
- Search decks/quizzes
- Action commands (export, theme, zen, clear session)
- Keyboard navigation (arrow keys, enter)

**Used by:** `Layout.jsx`

---

## 10. Environment Variables and Configuration

### Environment variables

**No environment variables are used in this project.**

No `.env`, `.env.example`, or `import.meta.env` references were found.

| Variable | Purpose | Required | Example Safe Value | Where Used |
|----------|---------|----------|-------------------|------------|
| *(none)* | — | — | — | — |

### localStorage keys (client configuration)

| Key | Purpose | Required | Example Safe Value | Where Used |
|-----|---------|----------|-------------------|------------|
| `theme` | Light/dark mode preference | No | `"dark"` | `src/components/Layout.jsx` |
| `promptquiz_zen_mode` | Quiz focus/zen layout | No | `"true"` (JSON boolean) | `src/components/QuizView.jsx`, `CommandHUD.jsx` |
| `promptquiz_last_deck_id` | Last active deck ID | No | `"42"` | `src/shared/services/indexedDB.js` |

### Important configuration files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `preview`, `lint`, `test`, `test:watch`) |
| `vite.config.js` | Vite plugins (React, Tailwind); dev server port **5173**, `host: true` |
| `vitest.config.js` | Test environment jsdom, setup file, globals |
| `eslint.config.js` | ESLint flat config; ignores `dist/`; jsx-a11y recommended |
| `index.html` | SPA HTML shell, title "PromptQuiz" |
| `src/index.css` | Tailwind v4 import, dark variant, custom theme tokens, animations |
| `.gitignore` | Ignores `node_modules`, `dist`, `*.local`; allows `README.md` and `PROJECT_CONTEXT.md` |

**Secrets warning:** No API keys are needed today. If backend or LLM integration is added later, use a local `.env` file and add `.env` to `.gitignore`. Never commit real credentials.

---

## 11. Setup and Installation

### Prerequisites

- **Node.js** 20.0.0 or higher (per README)
- **npm** 9.0.0 or higher (per README; project uses `package-lock.json`)

### Installation

```bash
git clone <your-repository-url>
cd promptQuiz
npm install
```

If peer dependency errors occur (common with React 19):

```bash
npm install --legacy-peer-deps
```

### Environment setup

No environment variables required.

### Database setup

IndexedDB is created automatically on first app load via `initDB()` in QuizProvider. No manual migration or seed commands.

### Development server

```bash
npm run dev
```

Open http://localhost:5173

**Notes:**
- Vite dev server runs on port **5173** with `host: true` (`vite.config.js`)
- Windows helper `start.bat` exists but is gitignored

### Tests

```bash
npm test              # run once
npm run test:watch    # watch mode
```

### Linting

```bash
npm run lint
```

### Production build

```bash
npm run build         # output to /dist
npm run preview       # serve /dist locally
```

### Common setup problems

| Issue | Solution |
|-------|----------|
| Peer dependency errors | `npm install --legacy-peer-deps` |
| Blank quiz at `/quiz` | Start a quiz from `/decks` first |
| IndexedDB cleared | Re-import library backup JSON |
| 404 on production refresh | Configure SPA fallback to `/index.html` on host |
| Tailwind styles missing | Ensure `@tailwindcss/vite` is in `vite.config.js` |

---

## 12. Development Workflow

### Common commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm test` | Run tests once |
| `npm run test:watch` | Vitest watch mode |

### Where to add things

| Change type | Location |
|-------------|----------|
| New page/route | `src/pages/` + register in `src/App.jsx` |
| Reusable UI component | Prefer `src/features/ui/`; avoid duplicating `src/components/` |
| Deck/quiz business logic | `src/features/quiz/hooks/` or `src/shared/services/indexedDB.js` |
| New question type | `quizQuestions.js` (Zod) + `parsers.js` + `helpers.js` + QuizView rendering |
| Persistence changes | `src/shared/services/indexedDB.js` (bump DB_VERSION if schema changes) |
| AI prompt logic | `src/features/ai/` |
| Tests | Co-locate as `*.test.js` or `*.test.jsx` beside source |
| Global styles | `src/index.css` |

### Coding conventions (detected)

- ES modules (`import`/`export`)
- JSX files use `.jsx` extension
- Functional components with hooks
- Context hooks throw if used outside provider
- Unused vars/args prefixed with `_` (ESLint config)
- Feature-based folders under `src/features/`
- No TypeScript — plain JavaScript

### Branching / commit conventions

Not clearly identified from the codebase. No CONTRIBUTING.md or commit lint config found.

### Safest way for AI agents to make changes

1. Read related hooks and `indexedDB.js` before changing any feature.
2. Run `npm run lint` and `npm test` after changes.
3. Do not add backend/API code unless explicitly requested.
4. Do not introduce new state management libraries.
5. Update both parsers if changing import format.
6. Bump IndexedDB version and add migration if changing stores.
7. Preserve three-slice context pattern — do not merge into one context.
8. Prefer extending existing hooks over creating parallel state paths.

---

## 13. Testing and Quality

### Test framework

- **Vitest 4** with jsdom environment
- **@testing-library/react** for component tests
- **fake-indexeddb/auto** for IndexedDB in Node tests

**Setup:** `src/test/setup.js` — imports fake-indexeddb, jest-dom matchers, auto cleanup after each test

### Test files (10 total)

| File | Focus |
|------|-------|
| `src/shared/schemas/quizQuestions.test.js` | Zod schema validation |
| `src/shared/utils/parsers.test.js` | Text format parsing |
| `src/shared/utils/helpers.test.js` | safeParseQuizJson, SAMPLE_QUIZ |
| `src/shared/services/sm2.test.js` | SM-2 algorithm |
| `src/shared/services/db.test.js` | IndexedDB CRUD |
| `src/features/quiz/utils/scoreSession.test.js` | Scoring correctness |
| `src/features/quiz/utils/quizDerivedMetrics.test.js` | Progress/score metrics |
| `src/contexts/QuizContext.test.jsx` | Context provider hooks |
| `src/pages/QuizPage.completion.test.jsx` | Quiz completion flow |
| `src/pages/DecksPage.importExport.test.jsx` | Library import/export |

### How to run

```bash
npm test
npm run test:watch
npm run lint
```

### Coverage

No test coverage reporting configured. Coverage percentage not available.

### Mocking approach

- `fake-indexeddb` for IndexedDB in unit tests
- jsdom for DOM; README notes some route tests may log IndexedDB warnings in Node (handled gracefully)

### Suggested tests to add first

1. Integration test for SM-2 rating write + daily review load
2. QuizView navigation and shuffle mode
3. AiPromptBuilderModal paste-import flow
4. CreateDeckPage end-to-end with all text formats
5. Broken-path regression test if ResultsDisplay is wired up

---

## 14. Known Issues, TODOs, and Incomplete Parts

No `TODO`, `FIXME`, `BUG`, or `HACK` comments were found in source files.

### Incomplete / orphan code

| Item | Location | Issue |
|------|----------|-------|
| HomePage | `src/pages/HomePage.jsx` | Not registered in `App.jsx` router |
| RouteErrorBoundary | `src/components/RouteErrorBoundary.jsx` | Not used in App |
| FolderDeckBrowser | `src/features/decks/components/FolderDeckBrowser/` | No imports found |
| DeckManager | `src/features/decks/components/DeckManager/` | No imports found |
| QuestionEditor | `src/features/questions/components/QuestionEditor/` | No imports found |
| ResultsDisplay | `src/features/quiz/components/Results/ResultsDisplay.jsx` | No imports; **broken import path** for MarkdownRenderer |
| ResultsView | `src/components/ResultsView.jsx` | No imports found |
| aiPromptGenerator | `src/features/ai/services/aiPromptGenerator.js` | May be superseded by inline logic in AiPromptBuilderModal |

### Duplicate components

| Component | Locations |
|-----------|-----------|
| MarkdownRenderer | `src/components/MarkdownRenderer.jsx` (richer XSS escaping), `src/features/ui/display/MarkdownRenderer.jsx` (simpler) |
| ProgressBar | `src/components/ProgressBar.jsx`, `src/features/quiz/components/Progress/ProgressBar.jsx` |
| QuizProgress | `src/components/QuizProgress.jsx`, `src/features/quiz/components/Progress/QuizProgress.jsx` |

Active quiz route uses `features/ui/display/MarkdownRenderer.jsx` via QuizPage.

### Maintenance risks

1. **Dual parsers:** `parsers.js` vs `helpers.js` — format changes need dual updates
2. **Zod v4 alpha:** `"zod": "^4.0.0-alpha.1"` may have breaking changes
3. **No LICENSE file** despite README mention
4. **No deployment/SPA redirect config** for production hosts
5. **No CI/CD** pipeline in repo

### Console logging

Extensive `console.error` / `console.warn` in catch blocks across pages and services — not structured logging.

### Mock / placeholder data

- `SAMPLE_QUIZ` in `helpers.js` used for demo/load sample feature
- HomePage marketing copy references "thousands of learners" — placeholder marketing text

---

## 15. Security and Privacy Notes

### Data storage

- All quiz data stored locally in browser IndexedDB — no server transmission
- Clearing browser data wipes all decks unless user exported a backup
- No encryption at rest for IndexedDB data

### Authentication and authorization

- **None.** Any user with browser access to the app can read/modify local data.

### Input validation

- Zod validates questions on import and library restore — good defense against malformed data
- Library import in **replace mode** deletes all existing decks before import — destructive operation

### XSS / content rendering

- Question text rendered via `MarkdownRenderer` using `dangerouslySetInnerHTML`
- `src/components/MarkdownRenderer.jsx` escapes HTML entities before rendering (stronger)
- `src/features/ui/display/MarkdownRenderer.jsx` escapes `&`, `<`, `>` but uses regex replacements — review if used with untrusted pasted content
- User-pasted LLM output is stored and rendered — treat as untrusted input

### API security

Not applicable — no API.

### CORS / security headers

Not applicable for local dev. Production static hosting should configure standard security headers (not in repo).

### Secrets exposure

- No secrets found in codebase
- No `.env` files committed
- Do not add API keys to source code if LLM integration is added later

### External resources

- Google Fonts loaded from CDN in `src/index.css` — privacy/network consideration for offline use

### Dependency risks

- Zod v4 alpha — pre-release dependency
- Standard npm audit recommended: `npm audit`

---

## 16. AI Assistant Instructions

### Before editing

1. Read `src/contexts/QuizContext.jsx` and `src/features/quiz/hooks/useQuizState.js` to understand state shape.
2. Read `src/shared/services/indexedDB.js` for any persistence-related change.
3. Check whether the feature uses `parsers.js` or `helpers.js` for parsing.
4. Inspect the target page in `src/pages/` and its imported components.

### Most important files

- `src/App.jsx` — routes
- `src/contexts/QuizContext.jsx` — global state entry
- `src/features/quiz/hooks/useQuizState.js` — state composition
- `src/shared/services/indexedDB.js` — all persistence
- `src/shared/schemas/quizQuestions.js` — validation source of truth
- `src/components/QuizView.jsx` — quiz UI + SM-2 writes

### Handle with care

- `indexedDB.js` — bump `DB_VERSION` and add migration logic for schema changes
- `quizQuestions.js` — changes affect import, export, preview, and session validation
- Both `parsers.js` and `helpers.js` — keep in sync or consolidate
- `quizReducer.js` / `useQuizState.js` — broad impact on all pages
- Library import (`importLibrarySnapshot`) — destructive replace mode

### Conventions to preserve

- Three-slice context: `useQuizSession`, `useQuizLibrary`, `useQuizShell`
- Feature folder structure under `src/features/`
- Zod discriminated union for question types
- ES modules, `.jsx` for React components
- Toast via `shell.showToast(message, type)`

### Avoid without permission

- Adding a backend server or API layer
- Adding authentication
- Introducing Redux, Zustand, or other state libraries
- Replacing IndexedDB with a different storage without migration plan
- Deleting orphan components without confirming they are unused
- Upgrading Zod major version without running all schema tests

### How to add features safely

1. Add route in `App.jsx` if new page needed
2. Add state fields to `quizReducer.js` initialState if needed
3. Expose via appropriate slice in `useQuizState.js`
4. Add IndexedDB functions if persistence needed
5. Add Zod schema if new data shape
6. Add tests co-located with new code
7. Run `npm run lint && npm test`

### How to modify UI safely

- Match existing Tailwind patterns (rounded-2xl/3xl, indigo/slate palette, dark mode classes)
- Use `dark:` variants for theme support
- Prefer `features/ui/` primitives for new shared UI
- Pass MarkdownRenderer as prop to QuizView rather than hardcoding import inside

### How to test after changes

```bash
npm run lint
npm test
npm run build   # verify production build succeeds
```

### Common mistakes to avoid

- Editing only one parser when both are used for similar formats
- Navigating to `/quiz` without loading questions into session first
- Forgetting to update Zod when adding question fields
- Creating a fourth context slice without strong justification
- Using `components/MarkdownRenderer` and `features/ui/display/MarkdownRenderer` interchangeably — they differ

---

## 17. Suggested Improvements

### High Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Consolidate parsers | Dual implementations drift easily | Extract shared parse logic; make `helpers.js` delegate to `parsers.js` | `parsers.js`, `helpers.js` |
| Fix or remove orphan components | Dead code confuses contributors | Audit imports; delete or wire up | `HomePage.jsx`, `features/decks/*`, `ResultsDisplay.jsx` |
| Add SPA fallback deploy config | Production refresh 404 on deep links | Add `_redirects` (Netlify) or `vercel.json` | repo root |
| Fix ResultsDisplay import | Broken path if component is used | Change to `../../../ui/display/MarkdownRenderer.jsx` | `ResultsDisplay.jsx` |

### Medium Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Consolidate MarkdownRenderer | Two implementations, different XSS handling | Pick one; update all imports | Both MarkdownRenderer files |
| Wire RouteErrorBoundary | Unhandled render errors crash app | Wrap `<Outlet />` in Layout | `Layout.jsx`, `RouteErrorBoundary.jsx` |
| Add CI workflow | No automated lint/test on push | GitHub Actions running lint + test | `.github/workflows/` |
| Pin Zod to stable release | Alpha dependency risk | Evaluate Zod v3 stable or v4 stable when available | `package.json` |
| Extract SM-2 writes from QuizView | UI component doing persistence | Create `useReviewSchedule` hook | `QuizView.jsx`, new hook |

### Low Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Add LICENSE file | README references open-source license | Add MIT or chosen license | repo root |
| Remove console.error noise | Clutter in production console | Centralize error reporting or user toasts only | various pages |
| Re-route or delete HomePage | Orphan landing page | Add `/home` route or delete file | `HomePage.jsx`, `App.jsx` |
| Add test coverage reporting | Visibility into gaps | Configure vitest coverage | `vitest.config.js` |
| Document deployment target | Unknown hosting setup | Add deploy section to README | README.md |

---

## 18. Quick Reference

### Entry points

| Entry | Path |
|-------|------|
| HTML | `index.html` |
| React mount | `src/main.jsx` |
| App + routes | `src/App.jsx` |
| Global state | `src/contexts/QuizContext.jsx` |
| Persistence | `src/shared/services/indexedDB.js` |

### Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm test
npm run lint
npm run build
npm run preview
```

### Routes / pages

| Route | Page |
|-------|------|
| `/` | Redirect → `/decks` |
| `/decks` | DecksPage |
| `/create-deck` | CreateDeckPage |
| `/create` | Redirect → `/create-deck` |
| `/quiz` | QuizPage |
| `/results` | ResultsPage |

### IndexedDB stores

`decks` → `quizzes` → `questions` + `reviewSchedule`

### Question types

`multiple-choice`, `true-false`, `fill-blank`, `cloze`, `short-answer`

### Context hooks

- `useQuizSession()` — active quiz, answers, navigation
- `useQuizLibrary()` — decks, CRUD, JSON input
- `useQuizShell()` — toasts, AI modal, parse messages

### localStorage keys

`theme`, `promptquiz_zen_mode`, `promptquiz_last_deck_id`

### Common tasks

| Task | Where |
|------|-------|
| Add route | `App.jsx` + `src/pages/` |
| Add question type | `quizQuestions.js`, `parsers.js`, `helpers.js`, `QuizView.jsx` |
| Change persistence | `indexedDB.js` |
| Add test | `*.test.js(x)` beside source |
| Change global theme | `src/index.css` |

---

## 19. Glossary

| Term | Meaning |
|------|---------|
| **Deck** | Top-level folder in the library; contains one or more quizzes. Stored in IndexedDB `decks` store. |
| **Quiz** | A named collection of questions within a deck. Stored in `quizzes` store with `deckId` FK. |
| **AI block format** | Plain-text import format: blank-line separated question blocks, `*` marks correct answers, optional type markers `[T/F]`, `[FIB]`, `[CLOZE]`, `[SA]`. |
| **SM-2** | SuperMemo-2 spaced repetition algorithm; schedules review intervals from quality ratings 1–5. Implemented in `sm2.js`. |
| **Quality rating** | User self-assessment during spaced repetition: 1 = no recall, 5 = perfect recall. |
| **Library snapshot** | JSON export of all decks/quizzes/questions with `schemaVersion: 1`. |
| **Three-slice context** | Pattern splitting global state into session, library, and shell contexts to reduce re-renders. |
| **Zen mode** | Focus layout for quiz view; persisted in `promptquiz_zen_mode`. |
| **Command HUD** | ⌘K / Ctrl+K palette for quick navigation and actions. |
| **Replace mode** | Default library import behavior — deletes all existing data before import. |
| **FIB** | Fill-in-the-blank question type; stem must contain `___`. |
| **Cloze** | Cloze deletion question; uses `{0}`, `{1}` placeholders mapped to `answers` array. |
| **MCQ** | Multiple-choice question type. |

---

## 20. Final Notes

### Could not be fully determined

- **Deployment platform:** No Netlify, Vercel, or Docker config in repo. README mentions configuring SPA fallback manually.
- **Orphan components intent:** Unclear if `features/decks/*`, `QuestionEditor`, `HomePage` are WIP or abandoned.
- **Component home long-term:** Both `src/components/` and `src/features/ui/` are active — consolidation strategy not documented.
- **License type:** README says open-source but no LICENSE file exists.

### Assumptions made

- README accurately describes intended behavior; verified key claims against source code.
- `npm` is the intended package manager (lockfile present, no pnpm/yarn/bun lockfiles).
- Project is production-ready at v1.0.0 despite alpha Zod dependency and orphan code.

### Recommended next documentation updates

- Add deployment section once hosting target is chosen
- Document question type JSON examples in PROJECT_CONTEXT when types are added
- Update Section 14 when orphan components are wired or removed
- Add CHANGELOG if release cadence increases

### Manual confirmation needed from maintainers

1. Should `HomePage` be routed at `/` or removed?
2. Are orphan feature components safe to delete?
3. Which MarkdownRenderer should be the canonical implementation?
4. Target deployment platform for SPA redirect configuration?

---

*This document was generated from direct codebase inspection. Re-verify after major refactors.*
