export default function DeckQuizList({
  quizzes = [],
  questionsCountMap = {},
  variant = 'hero',
  disabled = false,
  onStudy,
  onAddQuestions,
  onDelete,
}) {
  const isHero = variant === 'hero';

  if (quizzes.length === 0) {
    return (
      <p className="text-[10px] sm:text-xs italic text-slate-500 dark:text-slate-400 font-mono py-2">
        {isHero ? 'No quizzes in this deck.' : 'EMPTY_STATE'}
      </p>
    );
  }

  const rowClass = isHero
    ? 'group/row flex flex-col gap-3 p-4 rounded-xl premium-glass subpixel-border transition-all duration-300 hover:shadow-premium hover:border-indigo-500/15 dark:hover:bg-slate-800/40'
    : 'group/row flex flex-col gap-2.5 p-3 rounded-lg premium-glass subpixel-border transition-all duration-300 hover:shadow-premium hover:border-indigo-500/15 dark:hover:bg-slate-800/50';

  const nameClass = isHero
    ? 'text-[11px] sm:text-xs font-mono font-semibold tracking-wide text-slate-800 dark:text-slate-200 truncate'
    : 'text-[10px] sm:text-xs font-mono font-semibold tracking-wide text-slate-700 dark:text-slate-300 truncate';

  const countClass = 'shrink-0 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 pill-badge px-2 py-0.5 rounded-full';

  const btnBase = 'rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={isHero ? 'grid grid-cols-1 gap-3' : 'space-y-2'}>
      {quizzes.map((quiz, index) => {
        const count = questionsCountMap[quiz.id] || 0;

        return (
          <div
            key={quiz.id}
            className={`${rowClass} animate-fade-up`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-3 min-w-0">
              <span className={nameClass}>{quiz.name}</span>
              <span className={countClass}>
                {isHero
                  ? `${count} ${count === 1 ? 'card' : 'cards'}`
                  : `[${count}]`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onStudy?.(quiz.id)}
                className={`${btnBase} btn-primary shadow-glow-indigo`}
              >
                Study
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAddQuestions?.(quiz.id, quiz.name)}
                className={`${btnBase} btn-ghost text-slate-700 dark:text-slate-300`}
              >
                Add Questions
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDelete?.(quiz.id, quiz.name, count)}
                className={`${btnBase} btn-danger-ghost`}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
