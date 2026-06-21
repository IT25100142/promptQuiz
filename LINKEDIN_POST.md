# LinkedIn Post — PromptQuiz

> **Before publishing:** Attach a screenshot or screen recording of the app.

---

## Post (copy below)

---

I built **PromptQuiz** because I was tired of seeing students pay for quiz and flashcard subscriptions just to study.

So I made a free tool that runs entirely in the browser — no account, no subscription, no sending your notes to a server.

**What you can do with it:**

✅ Create and organize study decks (Decks → Quizzes → Questions)  
✅ Practice with 5 question types — multiple choice, true/false, fill-in-the-blank, cloze, and short answer  
✅ Import questions from JSON, plain text, Markdown, or AI-generated output  
✅ Use spaced repetition (SM-2) — rate how well you remembered each card and get smart review scheduling  
✅ Review mistakes and shuffle questions when you want a harder session  
✅ Use the **AI Prompt Builder** — copy a prompt to ChatGPT, Claude, or Gemini, paste the response back, and turn it into quiz cards (no API keys)  
✅ Export and import your full library as JSON — your backup, your data  
✅ Work offline after load — everything is stored locally in **IndexedDB**  
✅ Quick actions with **⌘K / Ctrl+K** Command HUD (search decks, export, theme toggle)  
✅ **Zen mode** for distraction-free studying  
✅ **Dark & light mode** with a polished glass-style UI, smooth animations, and card flip transitions  

**How the database works (no server needed):**

Instead of a cloud database, PromptQuiz stores everything locally in your browser using **IndexedDB** — a built-in database that works offline.

The app uses a database called **PromptQuizDB** with 4 stores:

📁 **decks** — your main folders (e.g. "React", "Database Systems")  
📄 **quizzes** — quiz sets inside each deck  
❓ **questions** — individual cards with type, text, answers, and order  
📅 **reviewSchedule** — SM-2 spaced repetition data (next review date, interval, ease factor)

Flow: **Deck → Quiz → Questions**, with review timing saved per question.

When you create or import a deck, the app writes to IndexedDB instantly. When you study, it reads from there — no login, no API calls. You can also **export your whole library as JSON** and import it later on another device or after clearing browser data.

Your study data stays on **your device**. That's the point.

**Why I built it this way:**  
Students shouldn't need a credit card to revise for exams. I wanted something private, practical, and free — especially for learners who paste notes from lectures and want to turn them into quizzes fast.

I'm **Sankalpa KMCP**, a first-year IT undergrad at **SLIIT**, interested in AI and building tools that solve real student problems.

Built with **React 19**, **Tailwind CSS v4**, and **Vite** — 100% client-side, no backend.

🔗 **Live demo:** [https://IT25100142.github.io/promptQuiz/](https://IT25100142.github.io/promptQuiz/) · **Repo:** [github.com/IT25100142/promptQuiz](https://github.com/IT25100142/promptQuiz)

📎 **Attach a screenshot or screen recording before posting.**

#BuildInPublic #ReactJS #StudentDeveloper #SLIIT #FreeEducation #WebDevelopment #SpacedRepetition #OfflineFirst #EdTech

---

**Sankalpa KMCP**
