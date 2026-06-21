# PromptQuiz

[![Deploy to GitHub Pages](https://github.com/IT25100142/promptQuiz/actions/workflows/deploy.yml/badge.svg)](https://github.com/IT25100142/promptQuiz/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Open_Source-blue.svg)](#license)

**A privacy-first, offline study app for active recall and spaced repetition — built entirely in the browser.**

[**Live Demo**](https://IT25100142.github.io/promptQuiz/) · [**Report Bug**](https://github.com/IT25100142/promptQuiz/issues) · [**Request Feature**](https://github.com/IT25100142/promptQuiz/issues)

PromptQuiz is a free single-page React application that lets students create quiz decks from JSON or plain text, practice with rich question types, schedule reviews with the SM-2 algorithm, and sync content with external LLMs through a copy-paste AI Prompt Builder. No accounts, no subscriptions, no backend — your decks live in **IndexedDB** on your device.

The interface features a **premium glassmorphism design system**: ambient mesh backgrounds, frosted navigation, fluid card transitions, and polished dark/light themes powered by **Tailwind CSS v4**.

---

## Screenshots & Demo

> Drop your media into `docs/screenshots/` and `docs/assets/`, then replace the placeholders below.

### Live walkthrough

<!-- Option A: embed a GIF -->
<!-- ![PromptQuiz demo](docs/assets/demo.gif) -->

<!-- Option B: link to a screen recording -->
**[Add screen recording here](docs/assets/demo.mp4)** — _Replace with your `.mp4`, `.webm`, or YouTube/Loom link_

### Library dashboard

<!-- ![Library dashboard — light mode](docs/screenshots/decks-light.png) -->
_Placeholder: `docs/screenshots/decks-light.png`_

### Quiz session

<!-- ![Active quiz with glass card UI](docs/screenshots/quiz-session.png) -->
_Placeholder: `docs/screenshots/quiz-session.png`_

### Dark mode

<!-- ![Dark mode library view](docs/screenshots/decks-dark.png) -->
_Placeholder: `docs/screenshots/decks-dark.png`_

---

## Why PromptQuiz?

| Principle | What it means |
| :--- | :--- |
| **Free for students** | No paywalls or subscriptions — study without a credit card |
| **Offline-first** | Full functionality without a network connection after first load |
| **Privacy-first** | No server uploads; study data never leaves your browser |
| **Developer-friendly** | Clean React architecture, Zod validation, Vitest tests, documented in [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) |
| **AI-assisted, not AI-dependent** | Generate prompts for Gemini, Claude, or ChatGPT — paste structured responses back in |

---

## Core Features

| Feature | Description |
| :--- | :--- |
| **Active recall sessions** | Five question types, navigation, shuffle, Zen mode, mistake review |
| **IndexedDB persistence** | Decks → Quizzes → Questions hierarchy in `PromptQuizDB` |
| **SM-2 spaced repetition** | Rate recall quality (1–5); smart review scheduling per card |
| **AI Prompt Builder** | Copy prompts to external LLMs; paste responses back — no API keys |
| **Library backup** | Export/import full library as validated JSON snapshots |
| **Command HUD** | `Ctrl+K` / `⌘K` — search decks, export, toggle theme, focus mode |

---

## Quick Start

**Requirements:** Node.js 20+, npm 9+

```bash
git clone https://github.com/IT25100142/promptQuiz.git
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
npm run preview   # http://localhost:4173/promptQuiz/
```

---

## Deployment

PromptQuiz deploys automatically to **GitHub Pages** at **[https://IT25100142.github.io/promptQuiz/](https://IT25100142.github.io/promptQuiz/)**.

### Automatic deploys

Pushes to the **`main`** branch trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which:

1. Installs dependencies with `npm ci`
2. Runs `npm run build`
3. Deploys the `dist` folder via `actions/deploy-pages@v4`

### One-time GitHub setup (required — site stays blank without this)

GitHub Pages must serve the **built** app, not the raw source on `main`.

**Option A — recommended:** Settings → Pages → **Source: GitHub Actions**

**Option B — branch deploy:** Settings → Pages → **Deploy from a branch** → branch **`gh-pages`**, folder **`/ (root)`**

The workflow builds with Vite and publishes `dist/` to both the `gh-pages` branch and the GitHub Actions Pages artifact on every push to `main`.

> **Blank page?** Your Pages source is still set to the `main` branch. Switch to **GitHub Actions** or **`gh-pages`** as above, then hard-refresh the live URL.

### SPA routing

Direct links to `/decks`, `/quiz`, and other routes work on GitHub Pages via:

- `base: '/promptQuiz/'` in `vite.config.js`
- `basename={import.meta.env.BASE_URL}` on `BrowserRouter`
- `public/404.html` + restore script in `index.html`

---

## Routes

| Path | Page | Purpose |
| :--- | :--- | :--- |
| `/` | → `/decks` | Redirect to library |
| `/decks` | DecksPage | Library dashboard, import/export |
| `/create-deck` | CreateDeckPage | Create or import a deck |
| `/quiz` | QuizPage | Active recall session |
| `/results` | ResultsPage | Score summary and restart |

---

## Typical Workflow

1. **Create a deck** — Go to `/create-deck`, paste JSON or AI block text, submit.
2. **Study** — From `/decks`, click **Study** on a quiz.
3. **Answer and rate** — Complete questions; rate recall for SM-2 scheduling.
4. **Review** — View results at `/results`; restart or review mistakes.
5. **Backup** — Export library JSON from `/decks` regularly.

### AI-assisted deck creation

1. Click **AI Builder** in the header.
2. Set topic, question count, and types → copy the generated prompt.
3. Send to an external LLM (Gemini, Claude, ChatGPT).
4. Paste the response → validated and saved to your deck.

**Tip:** Use blank-line-separated blocks with `*` marking correct answers — designed for LLM output.

---

## Design & UI

| Element | Implementation |
| :--- | :--- |
| **Typography** | DM Sans (UI) + Instrument Serif (headings) |
| **Glassmorphism** | `premium-glass`, `glass-nav`, `toast-glass` utilities |
| **Motion** | Card flip, fade-in, scale-in, glow-pulse indicators |
| **Dark mode** | Class-based `.dark` toggle with full token parity |

Key surfaces: floating glass navigation (`Layout.jsx`), 3D flip quiz cards (`QuizView.jsx`), Command HUD.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| UI | React 19, React Router 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Build | Vite 8 |
| Storage | IndexedDB + localStorage |
| Validation | Zod v4 |
| Testing | Vitest 4, Testing Library, fake-indexeddb |
| Linting | ESLint 9 (flat config), jsx-a11y |

**Not included:** Backend server, REST/GraphQL API, authentication, or third-party LLM API calls.

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

For full schema, hooks, and contributor guidelines, see [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

---

## Question Types & Import Formats

**Types:** `multiple-choice`, `true-false`, `fill-blank`, `cloze`, `short-answer`

**Import formats:** JSON array, AI block text (recommended), Markdown headers, CSV-style lists.

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

Schema definitions: [`src/shared/schemas/quizQuestions.js`](src/shared/schemas/quizQuestions.js)

---

## NPM Scripts

| Command | Description |
| :--- | :--- |
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

Ten test files cover schemas, parsers, IndexedDB, scoring, context, and page flows.

> IndexedDB warnings in some route tests are expected in Node/jsdom and do not fail the suite.

---

## Project Structure

```text
promptQuiz/
├── .github/workflows/deploy.yml
├── README.md
├── PROJECT_CONTEXT.md
├── public/404.html           # GitHub Pages SPA fallback
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── components/         # Layout, QuizView, CommandHUD
│   ├── contexts/           # QuizContext (three-slice provider)
│   ├── pages/
│   ├── features/           # ai, quiz, ui modules
│   └── shared/             # schemas, services, utils
└── vitest.config.js
```

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| Blank `/quiz` page | Start a quiz from `/decks` first |
| Parse errors | JSON must be an array; text blocks need one blank line between questions |
| Data lost on browser clear | Export library JSON regularly from `/decks` |
| 404 on refresh (GitHub Pages) | Ensure Pages source is **GitHub Actions** and workflow succeeded |
| Missing styles | Confirm `@tailwindcss/vite` is in `vite.config.js` |

---

## Contributing

1. Run `npm run lint` and `npm test` before submitting changes.
2. Co-locate tests as `*.test.js` / `*.test.jsx` beside source files.
3. New question types require Zod schema updates and parser changes in `parsers.js`.
4. Read [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) before modifying state or IndexedDB.

Contributions, issues, and feature requests are welcome.

---

## Author

**Sankalpa KMCP**

First-year IT undergraduate at **SLIIT**, building practical, privacy-first tools at the intersection of web development and AI-assisted learning.

[![GitHub](https://img.shields.io/badge/GitHub-IT25100142-181717?logo=github)](https://github.com/IT25100142)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sankalpa_KMCP-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sankalpa-k-m-c-p-2a900b3ba/)

- GitHub: [github.com/IT25100142](https://github.com/IT25100142)
- LinkedIn: [linkedin.com/in/sankalpa-k-m-c-p-2a900b3ba](https://www.linkedin.com/in/sankalpa-k-m-c-p-2a900b3ba/)

---

## License

Open-source. Add a `LICENSE` file before public distribution.
