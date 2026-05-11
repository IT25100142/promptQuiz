import { useMemo, useState } from 'react'

const SAMPLE_QUIZ = [
  {
    question: 'What does HTTP stand for?',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Protocol',
      'Hyper Transfer Type Protocol',
      'Home Tool Transfer Protocol',
    ],
    answer: 'HyperText Transfer Protocol',
  },
  {
    question: 'Which React hook is used to store local component state?',
    options: ['useMemo', 'useState', 'useEffect', 'useRef'],
    answer: 'useState',
  },
  {
    question: 'What does Vite primarily improve during development?',
    options: ['Database backups', 'Dev server startup speed', 'Image compression', 'Server billing'],
    answer: 'Dev server startup speed',
  },
]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function normalizeOption(option) {
  return String(option ?? '').trim()
}

function resolveAnswerIndex(item, options) {
  if (Number.isInteger(item?.answerIndex)) {
    return item.answerIndex
  }

  if (Number.isInteger(item?.answer)) {
    const zeroBased = item.answer
    const oneBased = item.answer - 1
    if (zeroBased >= 0 && zeroBased < options.length) return zeroBased
    if (oneBased >= 0 && oneBased < options.length) return oneBased
  }

  if (typeof item?.answer === 'string') {
    const answer = item.answer.trim()
    return options.findIndex((option) => option === answer)
  }

  return -1
}

function safeParseQuizJson(raw) {
  const text = (raw ?? '').trim()
  if (!text) {
    return { ok: false, error: 'Paste a JSON array to begin.' }
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That does not look like valid JSON. Please paste a JSON array.' }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Expected a JSON array of questions.' }
  }

  if (parsed.length === 0) {
    return { ok: false, error: 'Add at least one question to start a quiz.' }
  }

  const normalized = parsed.map((item, idx) => {
    const question = typeof item?.question === 'string' ? item.question.trim() : ''
    const options = Array.isArray(item?.options) ? item.options.map(normalizeOption) : []
    const uniqueOptions = new Set(options)
    const answerIndex = resolveAnswerIndex(item, options)

    if (!question) {
      return { ok: false, error: `Item ${idx + 1}: "question" must be a non-empty string.` }
    }
    if (options.length !== 4) {
      return { ok: false, error: `Item ${idx + 1}: "options" must contain exactly 4 choices.` }
    }
    if (options.some((option) => !option)) {
      return { ok: false, error: `Item ${idx + 1}: every option must contain text.` }
    }
    if (uniqueOptions.size !== options.length) {
      return { ok: false, error: `Item ${idx + 1}: options must be unique.` }
    }
    if (answerIndex < 0 || answerIndex >= options.length) {
      return {
        ok: false,
        error: `Item ${idx + 1}: "answer" must match an option or "answerIndex" must be 0-3.`,
      }
    }

    return {
      ok: true,
      value: {
        id: `${idx}-${question.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}`,
        question,
        options,
        answerIndex,
      },
    }
  })

  const firstError = normalized.find((item) => !item.ok)
  if (firstError && !firstError.ok) return firstError

  return { ok: true, value: normalized.map((item) => item.value) }
}

function formatSampleJson() {
  return JSON.stringify(SAMPLE_QUIZ, null, 2)
}

function getScore(quiz, answers) {
  return answers.reduce((total, answer, idx) => {
    if (answer === quiz[idx]?.answerIndex) return total + 1
    return total
  }, 0)
}

export default function App() {
  const [view, setView] = useState('input')
  const [rawJson, setRawJson] = useState('')
  const [inputError, setInputError] = useState('')
  const [quiz, setQuiz] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])

  const current = quiz[idx]
  const total = quiz.length
  const answeredCount = answers.filter((answer) => answer !== null).length
  const selectedIndex = answers[idx] ?? null
  const score = useMemo(() => getScore(quiz, answers), [answers, quiz])
  const percent = total ? Math.round((score / total) * 100) : 0
  const progress = total ? ((idx + 1) / total) * 100 : 0
  const preview = useMemo(() => safeParseQuizJson(rawJson), [rawJson])
  const sampleJson = useMemo(() => formatSampleJson(), [])

  const startQuiz = () => {
    const parsed = safeParseQuizJson(rawJson)
    if (!parsed.ok) {
      setInputError(parsed.error)
      return
    }

    setQuiz(parsed.value)
    setAnswers(Array(parsed.value.length).fill(null))
    setIdx(0)
    setInputError('')
    setView('quiz')
  }

  const loadSample = () => {
    setRawJson(sampleJson)
    setInputError('')
  }

  const formatJson = () => {
    const parsed = safeParseQuizJson(rawJson)
    if (!parsed.ok) {
      setInputError(parsed.error)
      return
    }

    const formatted = parsed.value.map((item) => ({
      question: item.question,
      options: item.options,
      answer: item.options[item.answerIndex],
    }))

    setRawJson(JSON.stringify(formatted, null, 2))
    setInputError('')
  }

  const choose = (choiceIndex) => {
    if (!current || selectedIndex !== null) return

    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIdx) => (answerIdx === idx ? choiceIndex : answer)),
    )
  }

  const goPrevious = () => {
    setIdx((currentIdx) => Math.max(0, currentIdx - 1))
  }

  const goNext = () => {
    if (selectedIndex === null) return

    if (idx + 1 >= total) {
      setView('results')
      return
    }

    setIdx((currentIdx) => currentIdx + 1)
  }

  const restartSession = () => {
    setAnswers(Array(total).fill(null))
    setIdx(0)
    setView('quiz')
  }

  const editQuiz = () => {
    setView('input')
    setInputError('')
  }

  const clearQuiz = () => {
    setRawJson('')
    setInputError('')
  }

  return (
    <div className="min-h-dvh bg-[#f6f3ee] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-base font-semibold tracking-tight">PromptQuiz</div>
            <div className="text-sm text-slate-600">Active recall from your own JSON</div>
          </div>

          {view === 'input' ? (
            <button
              type="button"
              onClick={loadSample}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Load Sample
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={editQuiz}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Edit JSON
              </button>
              <button
                type="button"
                onClick={restartSession}
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Restart
              </button>
            </div>
          )}
        </header>

        {view === 'input' ? (
          <main className="grid flex-1 items-center gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Paste your quiz JSON
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Use a JSON array with question, four options, and either answer or answerIndex.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={formatJson}
                    disabled={!rawJson.trim()}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Format
                  </button>
                  <button
                    type="button"
                    onClick={clearQuiz}
                    disabled={!rawJson.trim()}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="quiz-json">
                Quiz JSON
              </label>
              <textarea
                id="quiz-json"
                value={rawJson}
                onChange={(event) => {
                  setRawJson(event.target.value)
                  if (inputError) setInputError('')
                }}
                placeholder={sampleJson}
                spellCheck={false}
                aria-invalid={Boolean(inputError)}
                className={cx(
                  'mt-2 h-[420px] w-full resize-y rounded-lg border bg-slate-950 p-4 font-mono text-[12px] leading-5 text-slate-50 shadow-inner outline-none',
                  'placeholder:text-slate-500 focus:ring-2',
                  inputError
                    ? 'border-rose-400 focus:ring-rose-300'
                    : 'border-slate-800 focus:ring-teal-500',
                )}
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite">
                  {inputError ? (
                    <p className="text-sm font-medium text-rose-700">{inputError}</p>
                  ) : rawJson.trim() && preview.ok ? (
                    <p className="text-sm font-medium text-teal-700">
                      Ready: {preview.value.length} question
                      {preview.value.length === 1 ? '' : 's'}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Load the sample or paste your own set.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startQuiz}
                  className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Start Quiz
                </button>
              </div>
            </section>

            <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
              <div className="font-semibold">Accepted answer formats</div>
              <div className="mt-3 space-y-3 leading-6">
                <p>
                  <span className="font-mono text-xs">"answer"</span> can be the exact text of the
                  correct option.
                </p>
                <p>
                  <span className="font-mono text-xs">"answerIndex"</span> can be a number from 0
                  to 3.
                </p>
                <p>Duplicate or blank options are flagged before the quiz starts.</p>
              </div>
            </aside>
          </main>
        ) : null}

        {view === 'quiz' && current ? (
          <main className="flex flex-1 items-center py-6">
            <section className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-teal-700">
                    Question {idx + 1} of {total}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {answeredCount} answered | Score {score}
                  </div>
                </div>
                <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
                  {Math.round(progress)}% through
                </div>
              </div>

              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(progress)}
              >
                <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
              </div>

              <h2 className="mt-8 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                {current.question}
              </h2>

              <div className="mt-6 grid gap-3">
                {current.options.map((option, optionIdx) => {
                  const answered = selectedIndex !== null
                  const isSelected = selectedIndex === optionIdx
                  const isCorrect = optionIdx === current.answerIndex
                  const isWrongSelected = answered && isSelected && !isCorrect

                  const variant = answered
                    ? isCorrect
                      ? 'border-teal-300 bg-teal-50 text-teal-950'
                      : isWrongSelected
                        ? 'border-rose-300 bg-rose-50 text-rose-950'
                        : 'border-slate-200 bg-white text-slate-800'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:bg-teal-50'

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => choose(optionIdx)}
                      disabled={answered}
                      className={cx(
                        'grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold shadow-sm transition',
                        'focus:outline-none focus:ring-2 focus:ring-teal-500',
                        answered ? 'cursor-default' : 'cursor-pointer',
                        variant,
                      )}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200">
                        {String.fromCharCode(65 + optionIdx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 min-h-11" aria-live="polite">
                {selectedIndex !== null ? (
                  selectedIndex === current.answerIndex ? (
                    <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
                      Correct.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                      Correct answer: {current.options[current.answerIndex]}
                    </p>
                  )
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={idx === 0}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={selectedIndex === null}
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {idx + 1 === total ? 'See Results' : 'Next'}
                </button>
              </div>
            </section>
          </main>
        ) : null}

        {view === 'results' ? (
          <main className="flex-1 py-6">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div className="rounded-lg bg-slate-950 p-5 text-white">
                  <div className="text-sm font-semibold text-teal-200">Session complete</div>
                  <div className="mt-4 text-5xl font-semibold tracking-tight">{percent}%</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {score} correct out of {total}
                  </div>
                  <button
                    type="button"
                    onClick={restartSession}
                    className="mt-6 w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  >
                    Try Again
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Review</h2>
                  <div className="mt-4 grid gap-3">
                    {quiz.map((question, questionIdx) => {
                      const selected = answers[questionIdx]
                      const isCorrect = selected === question.answerIndex

                      return (
                        <article
                          key={question.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <h3 className="font-semibold leading-6 text-slate-950">
                              {questionIdx + 1}. {question.question}
                            </h3>
                            <span
                              className={cx(
                                'w-fit rounded-md px-2 py-1 text-xs font-bold',
                                isCorrect
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-rose-100 text-rose-800',
                              )}
                            >
                              {isCorrect ? 'Correct' : 'Review'}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
                            <p>
                              Your answer:{' '}
                              <span className="font-semibold text-slate-950">
                                {selected === null ? 'No answer' : question.options[selected]}
                              </span>
                            </p>
                            {!isCorrect ? (
                              <p>
                                Correct answer:{' '}
                                <span className="font-semibold text-slate-950">
                                  {question.options[question.answerIndex]}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          </main>
        ) : null}
      </div>
    </div>
  )
}
