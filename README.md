# PromptQuiz

**PromptQuiz** is a single-page React application for **active recall**: build quizzes from JSON or structured plain text, run them in the browser with scoring and progress, and persist **decks → quizzes → questions** locally with **IndexedDB**. An **AI Prompt Builder** helps you generate prompts for external LLMs; pasted model output uses the same parsing and validation pipeline as the manual input view.

---

## Table of contents

1. [Features](#features)  
2. [Tech stack](#tech-stack)  
3. [Prerequisites](#prerequisites)  
4. [Getting started](#getting-started)  
5. [NPM scripts](#npm-scripts)  
6. [Application routes](#application-routes)  
7. [Architecture overview](#architecture-overview)  
8. [State management: three contexts](#state-management-three-contexts)  
9. [Data layer (IndexedDB)](#data-layer-indexeddb)  
10. [Library backup and restore](#library-backup-and-restore)  
11. [Quiz input formats](#quiz-input-formats)  
12. [Question types and JSON shapes](#question-types-and-json-shapes)  
13. [Validation (Zod)](#validation-zod)  
14. [AI Prompt Builder](#ai-prompt-builder)  
15. [Testing and quality](#testing-and-quality)  
16. [Building for production](#building-for-production)  
17. [Privacy and limitations](#privacy-and-limitations)  
18. [Troubleshooting](#troubleshooting)  
19. [Project structure](#project-structure)  

---

## Features

| Area | What you get |
|:---|:---|
| **Quiz session** | Multiple question types, prev/next navigation, optional shuffle and “keep first question”, text input for blanks/cloze/short answer, self-assessment where applicable, progress and score. |
| **Results** | End-of-run summary, review of mistakes, navigation back into practice flows where implemented. |
| **Library** | Hierarchical **decks** (folders) containing **quizzes**, each with an ordered **question** list; browse on **My Decks**, create/edit on **Create**. |
| **Persistence** | All library data in **IndexedDB** (`PromptQuizDB`); optional restore of **last-used deck** on startup. |
| **Import** | **JSON array** of questions, or **plain-text** formats (including AI-style blocks separated by blank lines). Parsing is implemented in `src/shared/utils/helpers.js` (`safeParseQuizJson`, `parseTextFormat`, block parsers). |
| **Validation** | **Zod** schemas in `src/shared/schemas/quizQuestions.js` for starting a quiz, AI parse success path, and snapshot import. |
| **Backup** | **Export library** / **Import library** (JSON snapshot, replace mode) from the **Decks** page. |
| **AI workflow** | Modal **AI Prompt Builder**: configure topic/types/count, copy generated prompt, paste model response, **Parse & Load** after validation. |
| **Accessibility** | `eslint-plugin-jsx-a11y` (recommended rules); labels, keyboard-friendly deck cards, reduced reliance on `autoFocus` in dense forms. |

---

## Tech stack

| Layer | Choice |
|:---|:---|
| UI | **React 19**, **JSX** |
| Routing | **React Router 7** (`BrowserRouter`, `Routes`, `Route`) |
| Styling | **Tailwind CSS 4** (via `@tailwindcss/vite`) |
| Build | **Vite 8** |
| Validation | **Zod 4** |
| Client storage | **IndexedDB** (native API, wrapped in `src/shared/services/indexedDB.js`) |
| Tests | **Vitest 4**, **jsdom**, **Testing Library** (React, user-event, jest-dom) |
| Lint | **ESLint 10** flat config, **React Hooks**, **React Refresh**, **jsx-a11y** |

---

## Prerequisites

- **Node.js** 20+ (LTS recommended; Vite 8 and the toolchain expect a current runtime).
- **npm** 9+ (or compatible client). All scripts below use `npm`.

---

## Getting started

```bash
git clone <your-repo-url>
cd promptQuiz
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

If `npm install` fails with peer-dependency resolution errors in your environment, you can try:

```bash
npm install --legacy-peer-deps
```

---

## NPM scripts

| Command | Purpose |
|:---|:---|
| `npm run dev` | Start Vite dev server with HMR. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally for smoke testing. |
| `npm run lint` | Run ESLint on the repo (`eslint.config.js`). |
| `npm test` | Run **Vitest** once in CI mode (`vitest run`). Test files: `src/**/*.{test,spec}.{js,jsx}` with `src/test/setup.js`. |

---

## Application routes

| Path | Page | Role |
|:---|:---|:---|
| `/` | `HomePage` | Landing, links into create / decks / quiz flows. |
| `/create` | `CreateDeckPage` | Deck/quiz hierarchy editor, JSON input, AI builder entry from layout. |
| `/quiz` | `QuizPage` | Active session for the loaded question list. |
| `/results` | `ResultsPage` | Post-session metrics and review entry points. |
| `/decks` | `DecksPage` | List decks, load into session, delete, **export/import** full library snapshot. |

Global chrome: **`Layout`** wraps routes (header, navigation, modals for saved decks / save / AI builder). **`RouteErrorBoundary`** catches render errors inside routes.

---

## Architecture overview

- **`src/main.jsx`** mounts the app under `StrictMode`, wraps with **`BrowserRouter`**, imports global CSS.
- **`src/App.jsx`** wraps the tree in **`QuizProvider`** and defines **`Routes`**.
- **Feature code** lives under `src/features/` (quiz, decks, questions, AI, UI). **Shared** utilities/schemas/services under `src/shared/`. **Pages** under `src/pages/`. **Contexts** under `src/contexts/`.

Core quiz logic is composed in **`useQuiz`** (`src/features/quiz/hooks/useQuizState.js`): session state, library/JSON/deck sync, review helpers, and UI shell fields (notices, AI modal visibility, parse messages).

---

## State management: three contexts

`QuizProvider` exposes three memoized slices to avoid unnecessary re-renders:

| Hook | Typical contents (conceptual) |
|:---|:---|
| **`useQuizSession()`** | Current `quiz`, `answers`, `idx`, score/progress, review flags, `textAnswers`, navigation handlers (`goNext`, `goPrevious`, …), `setQuiz` / `setAnswers` / `setIdx`, etc. |
| **`useQuizLibrary()`** | `rawJson`, `preview`, `savedDecks`, `currentDeckId`, deck/quiz hierarchy helpers, `startQuiz`, `loadDeck`, `deleteDeck`, `clearQuiz`, … |
| **`useQuizShell()`** | `appNotice` / `setAppNotice`, AI builder visibility, `aiResponse`, `parseMessage`, related setters. |

Pages and layout import only the hooks they need. **`useQuizHandlers(session)`** (`useQuizNavigation.js`) adapts the session object to a small handler bundle used where the older “single quiz state” pattern was used.

---

## Data layer (IndexedDB)

- **Database name:** `PromptQuizDB`  
- **Version:** defined in `indexedDB.js` (schema migrations use `onupgradeneeded`).

**Object stores (conceptual model):**

| Store | Role |
|:---|:---|
| `decks` | Top-level folders; key `id` (auto-increment), indexes e.g. `name`, `date`. |
| `quizzes` | Quizzes belonging to a deck; indexed by `deckId`, `name`, `date`. |
| `questions` | Rows tied to `quizId` / `deckId`, with `order` for sequencing. |
| `reviewSchedule` | Spaced-repetition-style metadata per question (where used). |

The app also persists a **last-used deck** id for optional restore when the app loads (see `useQuizDeckSync`).

---

## Library backup and restore

On **`/decks`**:

- **Export library** downloads a JSON document produced by **`exportLibrarySnapshot()`** (all decks, quizzes, and question payloads; internal ids are stripped in favor of portable fields where applicable).
- **Import library** reads a JSON file, validates with **`validateLibrarySnapshot`** (Zod), then **`importLibrarySnapshot(..., { mode: 'replace' })`**: existing decks are removed, last-used id cleared, then decks from the file are recreated. A confirmation dialog warns that the operation **replaces** the entire local library.

After import, the UI refreshes the in-memory deck list and clears the active quiz session state where wired, with a shell **notice** for success or errors.

---

## Quiz input formats

### 1. JSON array (primary)

Paste a **JSON array** of question objects. The root must be an array (not a single object wrapper). **`safeParseQuizJson`** in `helpers.js` attempts `JSON.parse` first.

### 2. Plain text / “AI style”

When the content is not JSON, the same helper tries **text parsers**:

- **Block mode:** paragraphs separated by **blank lines**. Each block can be:
  - **Multiple choice:** first line = stem; next lines `A.` … `D.` (or `E.`); a line `*A` or `*Full option text` marks the correct answer.
  - **`[T/F]`** + stem, then `*True` / `*False` (or `*T` / `*F`).
  - **`[FIB]`** + stem (blanks may use long `____` runs; they are normalized to `___` for the UI).
  - **`[CLOZE]`** + stem; `*answer` or comma-separated `*a, b` for multiple blanks; underscores may be converted to `{0}`, `{1}` placeholders when needed.
  - **`[SA]`** + stem; `*suggested answer` text.

- **Line mode (fallback):** numbered lines (`1. …`, `2. [T/F] …`) and optional unnumbered MCQ when the line after the stem looks like `A.`.

Legacy **CSV-like** and **Markdown-like** heuristics in `safeParseQuizJson` may still trigger for specific first-line patterns; see `parseCSVFormat` / `parseMarkdownFormat` in `helpers.js`.

---

## Question types and JSON shapes

| `type` | Notes |
|:---|:---|
| `multiple-choice` | `question`, `options[]`, plus `answerIndex` and/or `answer` string. Legacy objects with only `question` + `options` are accepted loosely via Zod union. |
| `true-false` | `question`, boolean `answer` (or equivalent after parse). |
| `fill-blank` | `question` string with `___` segments; often `answers[]` from parsers. |
| `cloze` | `question` with `{0}`, `{1}`, … placeholders after parse; `answers[]`. |
| `short-answer` | `question`; `suggestedAnswer` for self-check copy. |

The in-app **sample** array lives in **`SAMPLE_QUIZ`** in `helpers.js` and is a good reference for JSON shape.

---

## Validation (Zod)

- **`src/shared/schemas/quizQuestions.js`**  
  - **`validateQuizQuestions(data)`** — used when **starting** a quiz from preview and after a successful **AI parse** (before `setQuiz`).  
  - **`validateLibrarySnapshot(data)`** — used on **library import**.  
  - **`librarySnapshotSchema`** expects `schemaVersion: 1` and a `decks` array (may be empty). Quizzes may have empty `questions` arrays on import (those quizzes are skipped for question insertion).

Strict JSON editing still goes through **`safeParseQuizJson`** first; Zod runs on the structured result where the app requires guarantees.

---

## AI Prompt Builder

1. Open the builder from the shell (header / layout entry points when exposed).  
2. Configure **study notes** (optional), **question types**, **count**, and **topic instructions**.  
3. **Generate prompt** — copy the text and send it to your chosen LLM (the app does not call external APIs for generation).  
4. Paste the model reply into the response area and use **Parse & Load**.  
5. Flow: **`parseAIResponse`** (`aiPromptGenerator.js`) strips common boilerplate, runs **`safeParseQuizJson`**, then **`validateQuizQuestions`**; on success, questions load into the session and the modal can close.

---

## Testing and quality

- **Unit / integration tests** live next to sources (`*.test.js`, `*.test.jsx`). Vitest uses **jsdom** and Testing Library **`@testing-library/react`** for component flows (e.g. quiz completion, decks export button with partial IndexedDB mock).  
- **ESLint** enforces React Hooks rules, refresh constraints for Fast Refresh, and accessibility **warnings** (e.g. label associations) via `jsx-a11y` recommended preset, with a few rules tuned in `eslint.config.js`.

```bash
npm test
npm run lint
```

---

## Building for production

```bash
npm run build
```

Output: **`dist/`**. Deploy `dist` as static files behind any static host or CDN. The app uses the **History** API (`BrowserRouter`); configure the server to **fallback to `index.html`** for client-side routes (`/quiz`, `/decks`, etc.).

---

## Privacy and limitations

- **No account system** in this codebase: data stays in **that browser’s IndexedDB** unless you export it.  
- Clearing site data **deletes** local decks unless you have an export.  
- **Import (replace)** overwrites the entire library for that origin.  
- The **AI Prompt Builder** does not embed API keys; you use your own tools for model calls.

---

## Troubleshooting

| Symptom | Things to check |
|:---|:---|
| Blank quiz after navigation | Ensure you **started** the quiz from JSON/text (`startQuiz`) or **loaded a deck** with questions. |
| Parse errors on paste | Confirm **JSON** is a single **array**, or use **blank-line-separated** text blocks matching the AI examples in `generateAIPrompt` / `helpers.js`. |
| Deck list empty after clone | IndexedDB is per-browser profile; use **Export** on the old profile and **Import** on the new one. |
| Routes 404 on refresh in prod | Configure SPA fallback to `index.html`. |

---

## Project structure

High-level map (not every file):

```text
promptQuiz/
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx                 # Entry: Router + StrictMode
    ├── App.jsx                  # QuizProvider + Routes
    ├── index.css
    ├── components/              # Layout, Navigation, QuizView, modals, …
    ├── contexts/
    │   └── QuizContext.jsx      # useQuizSession / Library / Shell
    ├── pages/                   # Home, CreateDeck, Quiz, Results, Decks
    ├── features/
    │   ├── ai/                  # Prompt builder UI + aiPromptGenerator
    │   ├── decks/               # DeckManager, FolderDeckBrowser, DeckList, …
    │   ├── questions/           # QuestionEditor
    │   ├── quiz/                # Hooks (useQuizState, navigation, deck sync, …)
    │   └── ui/                  # Header, shared UI
    ├── shared/
    │   ├── schemas/             # Zod (quizQuestions.js)
    │   ├── services/          # indexedDB.js (CRUD + export/import)
    │   └── utils/             # helpers.js (parse, score, …) + tests
    └── test/
        └── setup.js             # Vitest + jest-dom
```

---

## Contributing

1. Follow existing patterns (context hooks, feature folders).  
2. Run **`npm run lint`** and **`npm test`** before opening a PR.  
3. Prefer focused changes; extend **`safeParseQuizJson` / Zod** together when adding new question shapes so the JSON, text, and AI paths stay aligned.

---

## License

No `LICENSE` file is bundled in this repository; add one if you distribute the project publicly.
