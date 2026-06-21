# Project Context

> **Purpose of this document:** Help developers and AI coding agents understand PromptQuiz quickly, accurately, and safely before making changes.  
> **Last verified against codebase:** June 2026  
> **Primary sources:** `package.json`, `src/App.jsx`, `src/shared/services/indexedDB.js`, `vite.config.js`, `.github/workflows/deploy.yml`, `README.md`  
> **Live demo:** https://IT25100142.github.io/promptQuiz/

---

## 1. Project Overview

**Project name:** PromptQuiz (`prompt-quiz` in `package.json`)

**Summary:** PromptQuiz is a high-performance, single-page React study application for **active recall** and **spaced repetition**. Users organize study material in a **folder-and-file hierarchy** (decks → quizzes → questions), create content granularly or via bulk import, run quiz sessions in the browser, and persist progress locally in IndexedDB.

**Problem it solves:** Provides an offline-first flashcard/quiz tool with flexible import formats, self-assessment scoring, SM-2 spaced repetition scheduling, and an in-app AI Prompt Builder that helps users generate LLM prompts for external tools (Gemini, Claude, ChatGPT) and paste structured responses back into the app.

**Target audience:** Developers, students, and educators who want a local, privacy-friendly study tool without a backend account system.

**Core purpose:** Build, store, practice, and review question decks entirely in the browser.

**Development status:** Version `1.0.0` in `package.json`. Public release–ready frontend SPA with GitHub Pages deployment via GitHub Actions. Orphan components and duplicate modules were removed in a pre-release cleanup (see Section 14).

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
| GitHub Actions | CI/CD — lint/build/test on deploy workflow | `.github/workflows/deploy.yml` |
| GitHub Pages | Static hosting for production build | `.github/workflows/deploy.yml`, `vite.config.js` (`base`) |

**Not present in codebase:**

- Backend framework/runtime (Express, Node server, etc.)
- Server-side database (PostgreSQL, MongoDB, etc.)
- ORM (Prisma, Drizzle, etc.)
- Authentication/authorization library
- State management library (Redux, Zustand, etc.) — uses React Context + useReducer
- Form library (React Hook Form, Formik, etc.)
- GraphQL, WebSockets, RPC
- Third-party API integrations (no LLM API calls from the app)
- Environment variable files (`.env`, `.env.example`) — only Vite built-in `import.meta.env.BASE_URL` is used

---

## 3. Project Structure

```
promptQuiz/
├── index.html                    # HTML entry; SPA route-restore script for GitHub Pages
├── package.json                  # Dependencies and npm scripts
├── package-lock.json             # npm lockfile
├── vite.config.js                # Vite + React + Tailwind; base '/promptQuiz/'
├── vitest.config.js              # Vitest config (jsdom, setup file)
├── eslint.config.js              # ESLint 9 flat config
├── README.md                     # User-facing project documentation
├── PROJECT_CONTEXT.md            # This file — agent/developer context
├── LINKEDIN_POST.md              # Author social post draft (tracked in git)
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions → build → GitHub Pages
├── public/
│   ├── favicon.svg
│   └── 404.html                  # GitHub Pages SPA fallback for deep links
└── src/
    ├── main.jsx                  # React root mount (StrictMode)
    ├── App.jsx                   # Router (basename from BASE_URL) + QuizProvider
    ├── index.css                 # Tailwind v4 + glassmorphism theme/animations
    ├── components/               # Active shared UI (Layout, QuizView, modals, error boundary)
    │   ├── Layout.jsx
    │   ├── QuizView.jsx
    │   ├── CommandHUD.jsx
    │   ├── CardOverviewModal.jsx
    │   ├── RouteErrorBoundary.jsx
    │   ├── CreateFolderModal.jsx
    │   ├── CreateQuizModal.jsx
    │   ├── AddQuestionsModal.jsx
    │   ├── QuestionImportForm.jsx
    │   └── DeckQuizList.jsx
    ├── contexts/
    │   └── QuizContext.jsx       # Three-slice context provider
    ├── pages/                    # Route-level page components (4 pages)
    ├── features/
    │   ├── ai/
    │   │   └── AiPromptBuilderModal.jsx
    │   ├── quiz/
    │   │   ├── components/Progress/   # ProgressBar, QuizProgress
    │   │   ├── hooks/                 # Reducer, session, deck sync, hierarchy, question import
    │   │   ├── utils/                 # Scoring, shuffle, metrics
    │   │   └── constants/
    │   └── ui/
    │       └── display/
    │           └── MarkdownRenderer.jsx
    ├── shared/
    │   ├── schemas/              # Zod validation schemas
    │   ├── services/             # IndexedDB + SM-2 algorithm
    │   ├── utils/                # parsers.js (source of truth), helpers.js, formatters
    │   └── hooks/                # useLocalStorage
    └── test/
        └── setup.js              # Vitest setup (fake-indexeddb, cleanup)
```

### Directory explanations

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Top-level route components: `DecksPage`, `CreateDeckPage` (bulk import), `QuizPage`, `ResultsPage`. |
| `src/components/` | Active shared UI: `Layout`, `QuizView`, `CommandHUD`, library modals (`CreateFolderModal`, `CreateQuizModal`, `AddQuestionsModal`), `QuestionImportForm`, `DeckQuizList`, `RouteErrorBoundary`. |
| `src/contexts/` | Global state via three memoized context slices (session, library, shell). |
| `src/features/ai/` | `AiPromptBuilderModal.jsx` — LLM prompt generation and response import (no API calls). |
| `src/features/quiz/` | Quiz reducer, hooks, scoring utilities, and progress subcomponents. |
| `src/features/ui/display/` | `MarkdownRenderer.jsx` — canonical XSS-aware markdown renderer. |
| `src/shared/services/` | IndexedDB CRUD and SM-2 spaced repetition math. |
| `src/shared/schemas/` | Zod schemas for questions and library export/import. |
| `src/shared/utils/` | `parsers.js` (single source of truth for parsing); `helpers.js` (cx, SAMPLE_QUIZ, re-exports). |

### How major parts connect

```
index.html → main.jsx → App.jsx (basename from BASE_URL)
                              ├── QuizProvider (QuizContext.jsx)
                              │     └── useQuiz() → quizReducer + hooks
                              └── BrowserRouter → Layout → RouteErrorBoundary → Outlet (pages)
                                        ├── IndexedDB (persistence)
                                        ├── parsers.js + Zod (validation)
                                        └── localStorage (preferences)
```

---

## 4. Core Features

### Deck Library Dashboard

**Purpose:** Browse, organize, and manage saved deck folders and their nested quizzes.

**How it works:** On load, `useQuizDeckSync` fetches all decks from IndexedDB into context. `DecksPage` displays decks in a bento layout, nested quizzes via `DeckQuizList`, question counts, review stats, and a 7-day activity matrix. Users can:

- Create an **empty folder** via `CreateFolderModal` (**New Folder** button)
- Create **quizzes inside a deck** via `CreateQuizModal` (**Add Quiz** button)
- **Append questions** to an existing quiz via `AddQuestionsModal` (**Add Questions** on each quiz row)
- **Bulk import** deck + quiz + questions in one step via `/create-deck` (**Bulk Import** button / nav **Import**)
- Start a quiz (**Study**), delete a quiz, delete a deck, and import/export library snapshots

**Important files:**
- `src/pages/DecksPage.jsx`
- `src/components/DeckQuizList.jsx`
- `src/components/CreateFolderModal.jsx`
- `src/components/CreateQuizModal.jsx`
- `src/components/AddQuestionsModal.jsx`
- `src/features/quiz/hooks/useQuizDeckSync.js`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`
- `src/shared/services/indexedDB.js`

**Related data models:** `decks`, `quizzes`, `questions`, `reviewSchedule`

---

### Folder and Quiz Management (Granular Hierarchy)

**Purpose:** Let users build a library incrementally — empty folders first, then multiple named quizzes per folder, then questions appended over time.

**How it works:**

1. **Empty folder:** `CreateFolderModal` collects folder name + optional description → `library.createEmptyDeck()` → `library.loadDecks()`.
2. **Quiz shell:** `CreateQuizModal` (opened from `DecksPage` with a `deckId`) collects quiz name + description → `library.createNewQuiz()`.
3. **Quiz list UI:** `DeckQuizList` renders each quiz with question count and actions: **Study**, **Add Questions**, **Delete**.
4. **Quiz delete:** `library.deleteQuizById(quizId)` with user confirmation; cascades question + review schedule cleanup in IndexedDB.

**Important files:**
- `src/components/CreateFolderModal.jsx`
- `src/components/CreateQuizModal.jsx`
- `src/components/DeckQuizList.jsx`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`

**Related data models:** `decks`, `quizzes`

---

### Bulk Import (Create Deck Page)

**Purpose:** One-shot import path — create a new folder, default quiz, and all questions in a single submission.

**How it works:** User navigates to `/create-deck` (header/nav label: **Import**). User enters deck name/description and pastes raw question text. The shared `useQuestionImport` hook validates input via `parseAndValidateRawInput()`. On submit: `createNewDeck()` → `createNewQuiz()` (default name `{deckName} - Quiz 1`) → `addQuestionsToQuiz()` → redirect to `/decks`.

**Important files:**
- `src/pages/CreateDeckPage.jsx`
- `src/components/QuestionImportForm.jsx`
- `src/features/quiz/hooks/useQuestionImport.js`
- `src/shared/utils/parsers.js`
- `src/shared/schemas/quizQuestions.js`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`

**Related data models:** `decks`, `quizzes`, `questions`

---

### Append Questions to Existing Quiz

**Purpose:** Import additional questions into an existing quiz without replacing prior cards.

**How it works:** From `DecksPage`, user clicks **Add Questions** on a quiz row → `AddQuestionsModal` opens with `deckId` + `quizId`. User pastes text; `useQuestionImport` validates live. On submit, `appendToQuiz()` calls `library.addQuestionsToQuiz()`, which uses IndexedDB `addQuestions()` to append after existing rows (`order = existingCount + index`). `DecksPage` refreshes local quiz/count maps via `fetchQuizzes(deckId)` on success.

**Important files:**
- `src/components/AddQuestionsModal.jsx`
- `src/components/QuestionImportForm.jsx`
- `src/features/quiz/hooks/useQuestionImport.js`
- `src/features/quiz/hooks/useQuizDeckHierarchy.js`

**Related data models:** `questions`, `reviewSchedule` (unchanged on append; new questions have no schedule until studied with SM-2)

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

**How it works:** Modal opened from Layout header. User configures topic, question count, and types. App generates a formatted prompt string (no API call). User copies prompt to external LLM, pastes response back. Target selection:

- **Deck:** existing deck or new deck name
- **Quiz:** existing quiz in selected deck (append) or new quiz (default when deck has no quizzes)

Import uses `useQuestionImport` → `appendToQuiz()` → `library.addQuestionsToQuiz()`. Existing quiz imports **append** questions; new quiz imports create a shell then add questions.

**Important files:**
- `src/features/ai/AiPromptBuilderModal.jsx`
- `src/features/quiz/hooks/useQuestionImport.js`
- `src/components/QuestionImportForm.jsx`
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

### Main user journey: First folder → first quiz → first questions → study → results

1. User opens app at `/` → redirected to `/decks`.
2. **Option A — Granular path:**
   - User clicks **New Folder** → `CreateFolderModal` → empty deck saved.
   - User clicks **Add Quiz** on a deck → `CreateQuizModal` → empty quiz saved.
   - User clicks **Add Questions** on a quiz → `AddQuestionsModal` → questions appended.
3. **Option B — Bulk import path:**
   - User clicks **Bulk Import** or nav **Import** → `/create-deck`.
   - User pastes questions → deck + default quiz + all questions saved in one step → redirect to `/decks`.
4. User clicks **Study** on a quiz → questions loaded into session state → navigate to `/quiz`.
5. User answers questions, navigates forward/back, optionally rates SM-2 quality.
6. On last question completion → `completeQuizSession()` → navigate to `/results`.
7. User reviews score, restarts, or returns to library.

### AI-assisted creation flow

1. User opens **AI Builder** from header (any page).
2. Configures topic, count, question types → copies generated prompt.
3. Sends prompt to external LLM manually.
4. Pastes LLM output into modal → `useQuestionImport` validates.
5. Selects target deck and target quiz (existing append or new quiz).
6. Questions saved via `appendToQuiz()` → modal closes → library refreshed.

### Frontend flow

```
App.jsx
  └── QuizProvider (initDB on mount)
        └── Layout (theme, toast, AI modal, Command HUD)
              └── Outlet → Page component
                    └── useQuizSession / useQuizLibrary / useQuizShell
```

### Data flow (bulk import via CreateDeckPage)

```
Raw text → parseAndValidateRawInput() (useQuestionImport)
  → createNewDeck() → createNewQuiz() → addQuestionsToQuiz() → IndexedDB
  → getAllDecks() → context.savedDecks updated
```

### Data flow (append questions to existing quiz)

```
Raw text → parseAndValidateRawInput() (useQuestionImport)
  → addQuestions() with order = existingCount + index → IndexedDB
  → loadDeckQuizzes(deckId) → context.deckQuizzes updated
  → DecksPage.fetchQuizzes(deckId) → local questionsCountMap updated
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
- Render errors in routed pages → caught by `RouteErrorBoundary` wrapping `<Outlet />` in `Layout.jsx`.

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

- **Routing:** React Router 7 with nested layout route (`Layout` wraps all pages). `BrowserRouter` uses `basename` derived from `import.meta.env.BASE_URL` for GitHub Pages subpath hosting.
- **State:** Single `useReducer` in `useQuizState.js`, split into three memoized context values to limit re-renders.
- **Feature folders:** Domain code under `src/features/{ai,quiz,ui}`.
- **Shared components:** `src/components/` holds actively used layout, library modals, and quiz UI; `src/features/` holds domain modules and canonical `MarkdownRenderer`.

### Import pipeline architecture

All paste-based question ingestion flows through `src/features/quiz/hooks/useQuestionImport.js`:

```
Raw text
  ↓
parseAndValidateRawInput()  ← parseRawInput() + validateQuestionStructure() (Zod)
  ↓
Consumer-specific persistence
  ├── AddQuestionsModal        → appendToQuiz() → addQuestionsToQuiz() → addQuestions() [append order]
  ├── AiPromptBuilderModal     → appendToQuiz() (existing or new quiz target)
  └── CreateDeckPage (bulk)    → getValidatedQuestions() → createNewDeck + createNewQuiz + addQuestionsToQuiz
```

Shared UI for the textarea + validation banner: `src/components/QuestionImportForm.jsx`.

Deck/quiz CRUD orchestration (non-import): `src/features/quiz/hooks/useQuizDeckHierarchy.js` — exposed on `useQuizLibrary()` as `createEmptyDeck`, `createNewQuiz`, `addQuestionsToQuiz`, `deleteQuizById`, etc.

### Backend architecture

**None.** This is a static frontend application.

### Database architecture

IndexedDB database `PromptQuizDB` (version 2) with four object stores modeling a folder-and-file hierarchy:

```
decks (folder) ──→ (many) quizzes (file) ──→ (many) questions
                                                    ↓
                                        (1) reviewSchedule per question
```

**Cascade deletes (implemented and tested):**

| Delete operation | Cascade chain |
|------------------|---------------|
| `deleteDeck(deckId)` | → `deleteQuiz()` for each nested quiz → `deleteQuestionsByQuizId()` → `deleteReviewSchedulesByQuestionIds()` → question rows removed |
| `deleteQuiz(quizId)` | → `deleteQuestionsByQuizId()` → `deleteReviewSchedulesByQuestionIds()` → quiz row removed |
| `deleteQuestionsByQuizId(quizId)` | → gather question IDs → purge matching `reviewSchedule` rows → delete questions |

No orphaned `reviewSchedule` rows remain after deck or quiz deletion. Covered by `src/shared/services/db.test.js`.

### API architecture

**None.** No HTTP endpoints. All operations are direct IndexedDB transactions.

### Design patterns

- **Context slicing:** Three contexts instead of one large context (performance).
- **Reducer + hook composition:** `quizReducer` for state; specialized hooks for deck sync, session actions, review, JSON input.
- **Service module:** `indexedDB.js` encapsulates all persistence.
- **Schema-first validation:** Zod schemas shared between import, export, and preview.
- **Unified import pipeline:** `useQuestionImport.js` centralizes `parseAndValidateRawInput()` for all paste-import entry points.
- **Discriminated union:** Question types validated via Zod `discriminatedUnion('type', ...)`.

### Architectural weaknesses / unusual decisions

1. **SM-2 writes in QuizView:** Review schedule updates happen inside a UI component rather than a dedicated service hook.
2. **Zod v4 alpha:** Production dependency on pre-release Zod (`^4.0.0-alpha.1`).
3. **GitHub Pages subpath:** `vite.config.js` sets `base: '/promptQuiz/'`; repo renames or user/org Pages URLs require updating `base`, `404.html` `pathSegmentsToKeep`, and router basename together.
4. **No LICENSE file:** README references open source but no license file in repo root.

---

## 7. Database and Data Models

**Database type:** IndexedDB (browser-native, client-side)

**Library:** Native IndexedDB API wrapped in `src/shared/services/indexedDB.js` (no ORM)

**Database name:** `PromptQuizDB`  
**Version:** `2` (defined in `indexedDB.js`)

**Migration:** Handled in `request.onupgradeneeded` — creates stores and indexes if missing. No explicit data migration logic between versions beyond store creation.

**Cascade delete helpers:**

| Function | Role |
|----------|------|
| `deleteReviewSchedulesByQuestionIds(questionIds)` | Looks up `reviewSchedule` rows by `questionId` index and deletes them |
| `deleteQuestionsByQuizId(quizId)` | Purges review schedules for all quiz questions, then deletes question rows |
| `deleteQuiz(quizId)` | Calls `deleteQuestionsByQuizId()`, then deletes quiz row |
| `deleteDeck(deckId)` | Calls `deleteQuiz()` for each nested quiz, then deletes deck row |

Tests: `src/shared/services/db.test.js` (`should delete review schedules when a quiz is deleted`, `should cascade review schedule deletion when a deck is deleted`).

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
- Deleted automatically when parent question is removed via `deleteReviewSchedulesByQuestionIds()` (called from `deleteQuestionsByQuizId()`)

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

**Notes:** Routes: `/`, `/decks`, `/create-deck`, `/create` (redirect), `/quiz`, `/results`. `BrowserRouter` `basename` is derived from Vite `import.meta.env.BASE_URL` (trailing slash stripped) for GitHub Pages at `/promptQuiz/`.

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
- Cascading deletes: `deleteDeck` → `deleteQuiz` → `deleteQuestionsByQuizId` → `deleteReviewSchedulesByQuestionIds`
- Export/import library snapshots
- localStorage helpers for last used deck ID
- Review stats and activity timestamps

**Exports:** `initDB`, deck/quiz/question CRUD, review schedule functions (including `deleteReviewSchedulesByQuestionIds`), `exportLibrarySnapshot`, `importLibrarySnapshot`, test utilities `closeDB`, `resetDBPromise`

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

**Used by:** CreateDeckPage, AddQuestionsModal, AiPromptBuilderModal, `useQuestionImport.js`, indexedDB import/export, useQuizState preview

---

### src/shared/utils/parsers.js

**Purpose:** Single source of truth for multi-format text/JSON parsing.

**Responsibilities:**
- `sanitizeInput`, `detectFormat`, `parseRawInput`, `safeParseQuizJson`
- Parse AI block, markdown, and CSV formats into question objects

**Used by:** `useQuestionImport.js` (`parseAndValidateRawInput` → `parseRawInput`), `CreateDeckPage.jsx`, `AiPromptBuilderModal.jsx`, `helpers.js` (re-export), tests

---

### src/shared/utils/helpers.js

**Purpose:** Shared utilities and thin re-export layer for parsing.

**Responsibilities:**
- `cx()` class name helper
- `SAMPLE_QUIZ` demo data
- `getScore()`, `formatSampleJson()`
- `safeParseQuizJson()` — re-exports from `parsers.js`

**Used by:** `useQuizState.js`, `useQuizJsonInput.js`, various components for `cx()`

**Notes:** Do not duplicate parse logic here — extend `parsers.js` instead.

---

### src/components/Layout.jsx

**Purpose:** App shell with navigation, theme, toast, AI modal, Command HUD, and error boundary.

**Responsibilities:**
- Sticky header with nav links (**My Library**, **Import** → `/create-deck`)
- Header actions: **AI Builder**, **Import** (primary CTA to bulk import)
- Dark/light theme toggle (localStorage `theme`)
- Global toast auto-dismiss (3s)
- Render `AiPromptBuilderModal` and `CommandHUD`
- Wrap `<Outlet />` in `RouteErrorBoundary`

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

### src/features/quiz/hooks/useQuestionImport.js

**Purpose:** Unified paste-import pipeline for all question-ingestion entry points.

**Responsibilities:**
- Export pure function `parseAndValidateRawInput(rawText)` — wraps `parseRawInput()` + `validateQuestionStructure()` (Zod)
- Hook API: `rawText`, `setRawText`, live `validationResult`, `getValidatedQuestions()`, `appendToQuiz(quizId, deckId)`, `isImporting`, `reset()`
- `appendToQuiz()` delegates persistence to `library.addQuestionsToQuiz()` (IndexedDB append semantics)

**Used by:**
- `src/components/AddQuestionsModal.jsx`
- `src/pages/CreateDeckPage.jsx` (validation only; bulk orchestration stays in page)
- `src/features/ai/AiPromptBuilderModal.jsx`

**Tests:** `src/features/quiz/hooks/useQuestionImport.test.js`

---

### src/components/QuestionImportForm.jsx

**Purpose:** Reusable paste textarea + live validation banner.

**Used by:** `AddQuestionsModal.jsx`, `CreateDeckPage.jsx`, `AiPromptBuilderModal.jsx`

---

### src/components/CreateFolderModal.jsx

**Purpose:** Glassmorphism modal to create an empty deck folder (name + optional description).

**Used by:** `DecksPage.jsx`

---

### src/components/CreateQuizModal.jsx

**Purpose:** Glassmorphism modal to create an empty quiz shell inside a deck (`deckId` prop).

**Used by:** `DecksPage.jsx`

---

### src/components/AddQuestionsModal.jsx

**Purpose:** Glassmorphism modal to append validated questions to an existing quiz (`deckId`, `quizId`, `quizName` props).

**Used by:** `DecksPage.jsx`

---

### src/components/DeckQuizList.jsx

**Purpose:** Presentational quiz list for an expanded deck — shows question count and **Study** / **Add Questions** / **Delete** actions.

**Used by:** `DecksPage.jsx`

---

### src/features/ai/AiPromptBuilderModal.jsx

**Purpose:** Modal for LLM prompt generation and response import.

**Responsibilities:**
- Generate prompt from user config (inline — no separate service module)
- Copy to clipboard
- Target deck (existing or new) and target quiz (existing append or new quiz)
- Parse pasted LLM output via `useQuestionImport` and save with `appendToQuiz()`

**Used by:** `Layout.jsx`

---

### src/components/RouteErrorBoundary.jsx

**Purpose:** React error boundary for routed page render failures.

**Responsibilities:**
- Catch unhandled render errors in child routes
- Show recovery UI with link back to `/decks`
- Support dark mode styling

**Used by:** `Layout.jsx` (wraps `<Outlet />`)

---

### src/features/ui/display/MarkdownRenderer.jsx

**Purpose:** Canonical markdown renderer for question text.

**Responsibilities:**
- Escape HTML entities before rendering via `dangerouslySetInnerHTML`
- Support basic markdown formatting (bold, italic, code, links)

**Used by:** `QuizPage.jsx` (passed as prop to `QuizView`)

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

**No custom environment variables are used.** Vite exposes built-in `import.meta.env.BASE_URL` for subpath deployment.

| Variable | Purpose | Required | Example Safe Value | Where Used |
|----------|---------|----------|-------------------|------------|
| `import.meta.env.BASE_URL` | Vite base path for assets and router | Yes (set by Vite) | `"/promptQuiz/"` | `src/App.jsx` (`BrowserRouter` basename) |

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
| `vite.config.js` | Vite plugins (React, Tailwind); `base: '/promptQuiz/'`; dev server port **5173**, `host: true` |
| `vitest.config.js` | Test environment jsdom, setup file, globals |
| `eslint.config.js` | ESLint flat config; ignores `dist/`; jsx-a11y recommended |
| `index.html` | SPA HTML shell; route-restore script for GitHub Pages deep links |
| `public/404.html` | GitHub Pages SPA fallback (redirects deep links to `index.html`) |
| `.github/workflows/deploy.yml` | Push to `main` → `npm ci` → build → deploy to GitHub Pages |
| `src/index.css` | Tailwind v4 import, dark variant, glassmorphism theme tokens, animations |
| `.gitignore` | Ignores `node_modules`, `dist`, `*.local`, most `*.md`; allows `README.md`, `PROJECT_CONTEXT.md`, `LINKEDIN_POST.md` |

**Secrets warning:** No API keys are needed today. If backend or LLM integration is added later, use a local `.env` file and add `.env` to `.gitignore`. Never commit real credentials.

---

## 11. Setup and Installation

### Prerequisites

- **Node.js** 20.0.0 or higher (per README)
- **npm** 9.0.0 or higher (per README; project uses `package-lock.json`)

### Installation

```bash
git clone https://github.com/IT25100142/promptQuiz.git
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

Open http://localhost:5173/promptQuiz/ (Vite `base` is `/promptQuiz/` in all environments)

**Notes:**
- Vite dev server runs on port **5173** with `host: true` (`vite.config.js`)
- `base: '/promptQuiz/'` applies to dev, preview, and production builds — matches GitHub Pages URL
- Windows helper `start.bat` exists but is gitignored

### Production build and preview

```bash
npm run build         # output to /dist with /promptQuiz/ asset paths
npm run preview       # serve /dist locally — open the URL Vite prints (includes base path)
```

### GitHub Pages deployment

**Live URL:** https://IT25100142.github.io/promptQuiz/

Deployment is automated via `.github/workflows/deploy.yml`:

1. Push to `main` (or manual `workflow_dispatch`)
2. `npm ci` → `npm run build`
3. Upload `dist/` artifact → deploy with `actions/deploy-pages@v4`

**One-time GitHub repo settings:** Settings → Pages → Source: **GitHub Actions**.

**SPA deep-link support:** `public/404.html` + route-restore script in `index.html` (see [spa-github-pages](https://github.com/rafgraph/spa-github-pages)). If the repo name or Pages URL changes, update `vite.config.js` `base`, `404.html` `pathSegmentsToKeep`, and verify router basename.

### Tests

```bash
npm test              # run once
npm run test:watch    # watch mode
```

### Linting

```bash
npm run lint
```

### Common setup problems

| Issue | Solution |
|-------|----------|
| Peer dependency errors | `npm install --legacy-peer-deps` |
| Blank quiz at `/quiz` | Start a quiz from `/decks` first |
| IndexedDB cleared | Re-import library backup JSON |
| 404 on production refresh / deep links | Verify `public/404.html`, `index.html` route-restore script, and `vite.config.js` `base` match repo name |
| Tailwind styles missing | Ensure `@tailwindcss/vite` is in `vite.config.js` |
| Assets 404 on GitHub Pages | Confirm `base: '/promptQuiz/'` matches repo name and Pages URL |

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
| Reusable UI component | Prefer `src/features/ui/` for display primitives; use `src/components/` for layout/session UI |
| Add deck/quiz hierarchy logic | `src/features/quiz/hooks/useQuizDeckHierarchy.js` |
| New question type | `quizQuestions.js` (Zod) + `parsers.js` + `QuizView.jsx` rendering |
| Persistence changes | `src/shared/services/indexedDB.js` (bump DB_VERSION if schema changes) |
| Paste-import / validation UI | `src/features/quiz/hooks/useQuestionImport.js` + `src/components/QuestionImportForm.jsx` |
| AI prompt logic | `src/features/ai/AiPromptBuilderModal.jsx` |
| Tests | Co-locate as `*.test.js` or `*.test.jsx` beside source |
| Global styles | `src/index.css` |
| Deployment / base path | `vite.config.js`, `public/404.html`, `index.html`, `src/App.jsx` |

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
5. Extend `parsers.js` for import format changes — `helpers.js` only re-exports.
6. Bump IndexedDB version and add migration if changing stores.
7. Preserve three-slice context pattern — do not merge into one context.
8. Prefer extending existing hooks over creating parallel state paths.
9. When changing GitHub Pages base path, update `vite.config.js`, `404.html`, and verify router basename together.

---

## 13. Testing and Quality

### Test framework

- **Vitest 4** with jsdom environment
- **@testing-library/react** for component tests
- **fake-indexeddb/auto** for IndexedDB in Node tests

**Setup:** `src/test/setup.js` — imports fake-indexeddb, jest-dom matchers, auto cleanup after each test

### Test files (11 total)

| File | Focus |
|------|-------|
| `src/shared/schemas/quizQuestions.test.js` | Zod schema validation |
| `src/shared/utils/parsers.test.js` | Text format parsing |
| `src/shared/utils/helpers.test.js` | safeParseQuizJson, SAMPLE_QUIZ |
| `src/shared/services/sm2.test.js` | SM-2 algorithm |
| `src/shared/services/db.test.js` | IndexedDB CRUD + cascade delete of `reviewSchedule` |
| `src/features/quiz/hooks/useQuestionImport.test.js` | `parseAndValidateRawInput()` pipeline |
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
5. GitHub Pages base-path smoke test (optional — build + preview with `/promptQuiz/` base)

---

## 14. Known Issues, TODOs, and Incomplete Parts

No `TODO`, `FIXME`, `BUG`, or `HACK` comments were found in source files.

### Pre-release cleanup (completed)

The following orphan/duplicate modules were **removed** before public release:

- Pages: `HomePage.jsx`
- Components: `Navigation.jsx`, `QuizQuestion.jsx`, `QuizToolbar.jsx`, `QuizResults.jsx`, `AnswerButton.jsx`, `SavedDecksModal.jsx`, `SaveDeckModal.jsx`, `ResultsView.jsx`, duplicate `ProgressBar.jsx`, `QuizProgress.jsx`, `MarkdownRenderer.jsx`
- Features: entire `features/decks/`, `features/questions/`, old `AIPromptBuilder` subtree, `aiPromptGenerator.js`, unused `features/ui/forms/` and `features/ui/layout/Header.jsx`, unused `features/quiz/components/Results/`

### Remaining maintenance items

| Item | Issue |
|------|-------|
| Zod v4 alpha | `"zod": "^4.0.0-alpha.1"` in `package.json` — pre-release dependency |
| No LICENSE file | README references open source; no `LICENSE` in repo root |
| ESLint warnings | 4 pre-existing warnings (a11y label in `AiPromptBuilderModal.jsx`, unused vars in `useQuizDeckSync.js`, `parsers.js`, `setup.js`) |
| SM-2 in QuizView | Review schedule writes live in UI component, not a dedicated hook |
| Screenshot placeholders | README references `docs/screenshots/` and `docs/assets/` — folders/media not yet committed |
| Console logging | Extensive `console.error` / `console.warn` in catch blocks — not structured logging |

### Mock / placeholder data

- `SAMPLE_QUIZ` in `helpers.js` used for demo/load sample feature

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
- Canonical renderer: `src/features/ui/display/MarkdownRenderer.jsx` — escapes HTML entities (`&`, `<`, `>`, `"`, `'`) before rendering
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
3. For parsing/import changes, edit `src/shared/utils/parsers.js` only (`helpers.js` re-exports). For import orchestration, prefer extending `src/features/quiz/hooks/useQuestionImport.js`.
4. Inspect the target page in `src/pages/` and its imported components.
5. For deployment/routing changes, check `vite.config.js` `base`, `src/App.jsx` basename, and `public/404.html`.

### Most important files

- `src/App.jsx` — routes
- `src/contexts/QuizContext.jsx` — global state entry
- `src/features/quiz/hooks/useQuizState.js` — state composition
- `src/shared/services/indexedDB.js` — all persistence
- `src/shared/schemas/quizQuestions.js` — validation source of truth
- `src/shared/utils/parsers.js` — low-level parsing (used by `useQuestionImport`)
- `src/features/quiz/hooks/useQuestionImport.js` — unified paste-import pipeline
- `src/components/QuizView.jsx` — quiz UI + SM-2 writes
- `src/features/ui/display/MarkdownRenderer.jsx` — question text rendering
- `.github/workflows/deploy.yml` — GitHub Pages deployment

### Handle with care

- `indexedDB.js` — bump `DB_VERSION` and add migration logic for schema changes
- `quizQuestions.js` — changes affect import, export, preview, and session validation
- `parsers.js` — low-level parse functions; extend for new formats
- `useQuestionImport.js` — shared import orchestration for all paste-import UIs
- `quizReducer.js` / `useQuizState.js` — broad impact on all pages
- Library import (`importLibrarySnapshot`) — destructive replace mode
- `vite.config.js` `base` + `App.jsx` basename + `404.html` — must stay in sync for GitHub Pages

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
- Upgrading Zod major version without running all schema tests
- Changing `base` in `vite.config.js` without updating SPA fallback files

### How to add features safely

1. Add route in `App.jsx` if new page needed
2. Add state fields to `quizReducer.js` initialState if needed
3. Expose via appropriate slice in `useQuizState.js`
4. Add IndexedDB functions if persistence needed
5. Add Zod schema if new data shape
6. Add tests co-located with new code
7. Run `npm run lint && npm test`

### How to modify UI safely

- Match existing Tailwind patterns (glassmorphism, rounded-2xl/3xl, indigo/slate palette, dark mode classes)
- Use `dark:` variants for theme support
- Use `src/features/ui/display/MarkdownRenderer.jsx` for question text — pass as prop to `QuizView`

### How to test after changes

```bash
npm run lint
npm test
npm run build   # verify production build succeeds
```

### Common mistakes to avoid

- Duplicating parse logic in `helpers.js` instead of extending `parsers.js`
- Navigating to `/quiz` without loading questions into session first
- Forgetting to update Zod when adding question fields
- Creating a fourth context slice without strong justification
- Breaking GitHub Pages by changing repo name without updating `base` and SPA fallback

---

## 17. Suggested Improvements

### High Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Add LICENSE file | README references open source | Add MIT or chosen license | repo root |
| Add screenshot assets | README has placeholder paths | Add images to `docs/screenshots/`, `docs/assets/` | README.md |
| Pin Zod to stable release | Alpha dependency risk | Evaluate Zod v3 stable or v4 stable when available | `package.json` |

### Medium Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Extract SM-2 writes from QuizView | UI component doing persistence | Create `useReviewSchedule` hook | `QuizView.jsx`, new hook |
| Fix ESLint warnings | 3 pre-existing warnings | Address unused vars in `useQuizDeckSync.js`, `parsers.js`, `setup.js` |
| Add lint/test to deploy workflow | Deploy only runs build today | Add `npm run lint && npm test` before build | `.github/workflows/deploy.yml` |
| Add test coverage reporting | Visibility into gaps | Configure vitest coverage | `vitest.config.js` |

### Low Priority

| Improvement | Why | First step | Related files |
|-------------|-----|------------|---------------|
| Remove console.error noise | Clutter in production console | Centralize error reporting or user toasts only | various pages |
| Offline font bundling | Google Fonts CDN in `index.css` | Self-host or use system font stack | `src/index.css` |
| Custom domain for GitHub Pages | Optional branded URL | Configure CNAME + DNS | GitHub Pages settings |

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
npm run dev          # http://localhost:5173/promptQuiz/
npm test             # 43 tests, 11 files
npm run lint
npm run build        # assets prefixed with /promptQuiz/
npm run preview      # test production build locally
```

### Deployment

| Item | Value |
|------|-------|
| Live URL | https://IT25100142.github.io/promptQuiz/ |
| GitHub repo | https://github.com/IT25100142/promptQuiz |
| Workflow | `.github/workflows/deploy.yml` |
| Vite base | `/promptQuiz/` in `vite.config.js` |

### Active component paths

| Component | Path |
|-----------|------|
| Layout | `src/components/Layout.jsx` |
| QuizView | `src/components/QuizView.jsx` |
| MarkdownRenderer | `src/features/ui/display/MarkdownRenderer.jsx` |
| ProgressBar / QuizProgress | `src/features/quiz/components/Progress/` |
| AI Prompt Builder | `src/features/ai/AiPromptBuilderModal.jsx` |
| Create Folder modal | `src/components/CreateFolderModal.jsx` |
| Create Quiz modal | `src/components/CreateQuizModal.jsx` |
| Add Questions modal | `src/components/AddQuestionsModal.jsx` |
| Question import form | `src/components/QuestionImportForm.jsx` |
| Deck quiz list | `src/components/DeckQuizList.jsx` |
| Import pipeline hook | `src/features/quiz/hooks/useQuestionImport.js` |
| Error boundary | `src/components/RouteErrorBoundary.jsx` |

### Routes / pages

| Route | Page |
|-------|------|
| `/` | Redirect → `/decks` |
| `/decks` | DecksPage (library dashboard + modals) |
| `/create-deck` | CreateDeckPage (bulk import — nav label **Import**) |
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
| Add question type | `quizQuestions.js`, `parsers.js`, `QuizView.jsx` |
| Change persistence | `indexedDB.js` |
| Add test | `*.test.js(x)` beside source |
| Change global theme | `src/index.css` |

---

## 19. Glossary

| Term | Meaning |
|------|---------|
| **Deck** | Top-level **folder** in the library; contains one or more quizzes. Created empty via `CreateFolderModal` or alongside bulk import. Stored in IndexedDB `decks` store. |
| **Quiz** | A named collection of questions within a deck (like a file in a folder). Created via `CreateQuizModal` or bulk/AI import. Stored in `quizzes` store with `deckId` FK. |
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

### Author and repository

- **Author:** Sankalpa KMCP (SLIIT, first-year IT)
- **GitHub:** https://github.com/IT25100142
- **Repository:** https://github.com/IT25100142/promptQuiz
- **Live demo:** https://IT25100142.github.io/promptQuiz/

### Could not be fully determined

- **License type:** README says open-source but no LICENSE file exists.
- **Screenshot assets:** README references `docs/screenshots/` and `docs/assets/` — media may not be committed yet.

### Assumptions made

- README accurately describes intended behavior; verified key claims against source code.
- `npm` is the intended package manager (lockfile present, no pnpm/yarn/bun lockfiles).
- GitHub Pages deployment at `/promptQuiz/` matches repo name `promptQuiz` under user `IT25100142`.

### Recommended next documentation updates

- Add LICENSE file and update README license badge link
- Commit screenshot/GIF assets referenced in README
- Update Section 14 when Zod is pinned to stable or ESLint warnings are resolved
- Add CHANGELOG if release cadence increases

### Manual confirmation needed from maintainers

1. Which open-source license to add (MIT suggested)?
2. When to pin Zod from alpha to stable?
3. Whether to add lint/test gates to the deploy workflow?

---

*This document was updated from direct codebase inspection. Re-verify after major refactors.*
