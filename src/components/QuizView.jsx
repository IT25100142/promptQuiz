import { useMemo } from 'react'
import { cx } from '../shared/utils/helpers.js'
import QuizToolbar from './QuizToolbar.jsx'
import ProgressBar from './ProgressBar.jsx'
import CardOverviewModal from './CardOverviewModal.jsx'
import { calculateNextReview } from '../shared/services/sm2.js'
import { initDB } from '../shared/services/db.js'
import { useKeyPress } from '../shared/utils/useKeyPress.js'

export default function QuizView({
  current,
  idx,
  total,
  answeredCount,
  score,
  progress,
  isReviewMode,
  incorrectQuestions,
  answers,
  textAnswers,
  showSuggestedAnswer,
  choose,
  handleTextAnswer,
  submitTextAnswer,
  toggleSuggestedAnswer,
  handleSelfAssessment,
  isAnswered,
  goPrevious,
  goNext,
  onQuizComplete,
  MarkdownRenderer,
  shuffleMode,
  keepFirstQuestion,
  toggleShuffleMode,
  toggleKeepFirstQuestion,
  showCardOverview,
  setShowCardOverview,
  jumpToQuestion,
  quiz
}) {
  const handleSM2Rating = async (rating) => {
    try {
      const db = await initDB();
      const schedule = await new Promise((resolve, reject) => {
        const transaction = db.transaction(['reviewSchedule'], 'readonly');
        const store = transaction.objectStore('reviewSchedule');
        const index = store.index('questionId');
        const request = index.get(current.id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      const nextReview = calculateNextReview({
        interval: schedule ? schedule.interval : 1,
        easeFactor: schedule ? schedule.easeFactor : 2.5,
        quality: rating
      });

      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['reviewSchedule'], 'readwrite');
        const store = transaction.objectStore('reviewSchedule');
        const newSchedule = {
          ...(schedule || {}),
          questionId: current.id,
          deckId: current.deckId,
          interval: nextReview.interval,
          easeFactor: nextReview.easeFactor,
          nextReviewDate: nextReview.nextReviewDate,
          lastReviewedDate: new Date().toISOString()
        };
        const request = store.put(newSchedule);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      if (idx + 1 === total) {
        onQuizComplete();
      } else {
        goNext();
      }
    } catch (err) {
      console.error('SM-2 update failed:', err);
      if (idx + 1 === total) {
        onQuizComplete();
      } else {
        goNext();
      }
    }
  };

  // Keyboard shortcut definitions mapping home-row controls
  const shortcuts = useMemo(() => {
    const map = {};

    map['ArrowLeft'] = () => {
      if (idx > 0) goPrevious();
    };

    map['ArrowRight'] = () => {
      if (isAnswered()) {
        if (idx + 1 === total) onQuizComplete();
        else goNext();
      }
    };

    map[' '] = () => {
      if (!isAnswered()) {
        if (current.type === 'short-answer') {
          if (!showSuggestedAnswer[idx]) toggleSuggestedAnswer();
        } else if (current.type === 'fill-blank' || current.type === 'cloze') {
          submitTextAnswer();
        }
      }
    };

    if (isAnswered()) {
      map['1'] = () => handleSM2Rating(1);
      map['2'] = () => handleSM2Rating(2);
      map['3'] = () => handleSM2Rating(3);
      map['4'] = () => handleSM2Rating(4);
      map['5'] = () => handleSM2Rating(5);
    }

    return map;
  }, [
    idx,
    total,
    current,
    showSuggestedAnswer,
    isAnswered,
    goPrevious,
    goNext,
    onQuizComplete,
    submitTextAnswer,
    toggleSuggestedAnswer,
    handleSM2Rating,
  ]);

  useKeyPress(shortcuts);

  if (!current) return null

  const isFlipped = !!(isAnswered() || showSuggestedAnswer[idx]);

  return (
    <main className="flex flex-1 flex-col py-6 w-full max-w-3xl mx-auto">
      {/* Top persistent control panel */}
      <div className="w-full rounded-2xl border border-slate-900/5 dark:border-white/10 bg-white dark:bg-slate-900/70 dark:backdrop-blur-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)] sm:p-5 transition-colors duration-200 mb-6">
        <QuizToolbar
          shuffleMode={shuffleMode}
          keepFirstQuestion={keepFirstQuestion}
          toggleShuffleMode={toggleShuffleMode}
          toggleKeepFirstQuestion={toggleKeepFirstQuestion}
          onShowCardOverview={() => setShowCardOverview(true)}
          total={total}
        />

        <ProgressBar
          idx={idx}
          total={total}
          progress={progress}
          answeredCount={answeredCount}
          score={score}
          isReviewMode={isReviewMode}
          incorrectQuestions={incorrectQuestions}
        />
      </div>

      {/* 3D Perspective Card Flip Container */}
      <div className="w-full [perspective:1000px] mb-6">
        <div
          className="relative w-full transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
        >
          {/* Front Side */}
          <div
            className={cx(
              "w-full rounded-3xl border border-slate-900/5 dark:border-white/10 bg-white dark:bg-slate-900/70 dark:backdrop-blur-md p-8 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300",
              isFlipped ? "pointer-events-none absolute inset-0 opacity-0" : "relative opacity-100"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {!isFlipped && (
              <>
                <h2 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100">
                  <MarkdownRenderer text={current.question} />
                </h2>

                <div className="mt-6">
                  {/* Multiple Choice */}
                  {current.type === 'multiple-choice' && (
                    <div className="grid gap-3">
                      {current.options.map((option, optionIdx) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          className="grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-xl border border-slate-900/5 dark:border-white/5 px-3 py-3 text-left text-sm font-semibold transition-all duration-200 hover:scale-[1.01] focus:scale-[1.01] cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 hover:ring-1 hover:ring-indigo-500/30 focus:ring-1 focus:ring-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-transparent dark:hover:border-transparent focus:outline-none"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 shadow-sm border border-slate-900/5 dark:border-white/5">
                            {String.fromCharCode(65 + optionIdx)}
                          </span>
                          <span className="text-left">
                            <MarkdownRenderer text={option} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* True/False */}
                  {current.type === 'true-false' && (
                    <div className="grid grid-cols-2 gap-3">
                      {['True', 'False'].map((option, optionIdx) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          className="min-h-14 rounded-xl border border-slate-900/5 dark:border-white/5 px-4 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.01] focus:scale-[1.01] cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 hover:ring-1 hover:ring-indigo-500/30 focus:ring-1 focus:ring-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-transparent dark:hover:border-transparent focus:outline-none"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill in the Blank */}
                  {current.type === 'fill-blank' && (
                    <div className="space-y-4">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                        {current.question.split('___').map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.question.split('___').length - 1 && (
                              <input
                                type="text"
                                value={textAnswers[idx] || ''}
                                onChange={(e) => handleTextAnswer(e.target.value)}
                                placeholder="answer"
                                className="mx-2 inline-block w-32 rounded-lg border border-transparent bg-slate-150/80 dark:bg-slate-955/65 px-3 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      {textAnswers[idx] && (
                        <button
                          type="button"
                          onClick={submitTextAnswer}
                          className="rounded-lg bg-indigo-650 hover:bg-indigo-550 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] inline-flex items-center gap-1.5 focus:outline-none"
                        >
                          Submit Answer <kbd className="text-[10px] bg-indigo-700/50 border border-indigo-500/30 rounded px-1 text-indigo-200">Space</kbd>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cloze Deletion */}
                  {current.type === 'cloze' && (
                    <div className="space-y-4">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                        {current.question.split(/\{\d+\}/).map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.answers.length && (
                              <input
                                type="text"
                                value={textAnswers[`${idx}-${partIdx}`] || ''}
                                onChange={(e) => handleTextAnswer(e.target.value, partIdx)}
                                placeholder={current.answers[partIdx] || 'answer'}
                                className="mx-2 inline-block w-32 rounded-lg border border-transparent bg-slate-150/80 dark:bg-slate-955/65 px-3 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      {(() => {
                        const blanks = current.question.split(/\{[^}]+\}/).length - 1
                        for (let i = 0; i < blanks; i++) {
                          if (!textAnswers[`${idx}-${i}`]) return null
                        }
                        return (
                          <button
                            type="button"
                            onClick={submitTextAnswer}
                            className="rounded-lg bg-indigo-650 hover:bg-indigo-550 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] inline-flex items-center gap-1.5 focus:outline-none"
                          >
                            Submit Answer <kbd className="text-[10px] bg-indigo-700/50 border border-indigo-500/30 rounded px-1 text-indigo-200">Space</kbd>
                          </button>
                        )
                      })()}
                    </div>
                  )}

                  {/* Short Answer */}
                  {current.type === 'short-answer' && (
                    <div className="space-y-4">
                      <textarea
                        value={textAnswers[idx] || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={4}
                        className="w-full rounded-xl border border-transparent bg-slate-100/50 dark:bg-slate-950/60 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:border-transparent text-slate-900 dark:text-slate-100"
                      />
                      
                      <button
                        type="button"
                        onClick={toggleSuggestedAnswer}
                        className="rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-all inline-flex items-center gap-1.5 focus:outline-none"
                      >
                        Reveal Model Answer <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded px-1 text-slate-400 dark:text-slate-500">Space</kbd>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Back Side */}
          <div
            className={cx(
              "w-full rounded-3xl border border-slate-900/5 dark:border-white/10 bg-white dark:bg-slate-900/70 dark:backdrop-blur-md p-8 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300",
              isFlipped ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {isFlipped && (
              <>
                <h2 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100">
                  <MarkdownRenderer text={current.question} />
                </h2>

                <div className="mt-6">
                  {/* Multiple Choice */}
                  {current.type === 'multiple-choice' && (
                    <div className="grid gap-3">
                      {current.options.map((option, optionIdx) => {
                        const answered = answers[idx] !== null
                        const isSelected = answers[idx] === optionIdx
                        const isCorrect = optionIdx === current.answerIndex
                        const isWrongSelected = answered && isSelected && !isCorrect

                        const variant = isCorrect
                          ? 'border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                          : isWrongSelected
                            ? 'border-rose-500/20 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-805 dark:text-rose-300'
                            : 'border-slate-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold cursor-default',
                              variant,
                            )}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/80 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-900/5 dark:border-white/5">
                              {String.fromCharCode(65 + optionIdx)}
                            </span>
                            <span className="text-left">
                              <MarkdownRenderer text={option} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* True/False */}
                  {current.type === 'true-false' && (
                    <div className="grid grid-cols-2 gap-3">
                      {['True', 'False'].map((option, optionIdx) => {
                        const answered = answers[idx] !== null
                        const isSelected = answers[idx] === optionIdx
                        const isCorrect = optionIdx === 1 ? current.answer : !current.answer
                        const isWrongSelected = answered && isSelected && !isCorrect

                        const variant = isCorrect
                          ? 'border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                          : isWrongSelected
                            ? 'border-rose-500/20 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-805 dark:text-rose-300'
                            : 'border-slate-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'min-h-14 rounded-xl border px-4 py-3 text-sm font-semibold cursor-default',
                              variant,
                            )}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Fill in the Blank */}
                  {current.type === 'fill-blank' && (
                    <div className="space-y-4">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                        {current.question.split('___').map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.question.split('___').length - 1 && (
                              <input
                                type="text"
                                value={textAnswers[idx] || ''}
                                disabled={true}
                                placeholder="answer"
                                className={cx(
                                  'mx-2 inline-block w-32 rounded-lg border px-3 py-1 text-sm font-medium transition-colors bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                                    : 'border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-800 dark:text-rose-300'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'rounded-xl border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                          : 'border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-805 dark:text-rose-300'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct!' : `Correct answer: ${current.answers[0]}`}
                      </p>
                    </div>
                  )}

                  {/* Cloze Deletion */}
                  {current.type === 'cloze' && (
                    <div className="space-y-4">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                        {current.question.split(/\{\d+\}/).map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.answers.length && (
                              <input
                                type="text"
                                value={textAnswers[`${idx}-${partIdx}`] || ''}
                                disabled={true}
                                placeholder={current.answers[partIdx] || 'answer'}
                                className={cx(
                                  'mx-2 inline-block w-32 rounded-lg border px-3 py-1 text-sm font-medium transition-colors bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                                    : 'border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-800 dark:text-rose-300'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'rounded-xl border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300'
                          : 'border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/25 text-rose-805 dark:text-rose-300'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct!' : `Correct answers: ${current.answers.join(', ')}`}
                      </p>
                    </div>
                  )}

                  {/* Short Answer */}
                  {current.type === 'short-answer' && (
                    <div className="space-y-4">
                      <textarea
                        value={textAnswers[idx] || ''}
                        disabled={true}
                        rows={4}
                        className="w-full rounded-xl border border-slate-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 px-4 py-3 text-sm font-medium cursor-default"
                      />
                      
                      {showSuggestedAnswer[idx] && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 p-4 animate-fade-up">
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Model Answer:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{current.suggestedAnswer}</p>
                        </div>
                      )}

                      {showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(true)}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
                          >
                            I was correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(false)}
                            className="flex-1 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            I still need to review
                          </button>
                        </div>
                      )}

                      {answers[idx]?.selfAssessed !== undefined && (
                        <p className={cx(
                          'rounded-xl border px-4 py-3 text-sm font-semibold',
                          answers[idx]?.selfAssessedCorrect
                            ? 'border-emerald-505/20 bg-emerald-50/40 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-350'
                            : 'border-amber-505/20 bg-amber-50/40 dark:bg-amber-950/25 text-amber-800 dark:text-amber-350'
                        )}>
                          {answers[idx]?.selfAssessedCorrect ? 'Self-assessed as correct' : 'Marked for review'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* SM-2 Recall performance selectors */}
                {isAnswered() && (
                  <div className="mt-6 border-t border-slate-900/5 dark:border-white/5 pt-6 animate-fade-up">
                    <span className="block text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                      Rate your recall performance (SM-2):
                    </span>
                    <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                      {[
                        { val: 1, label: 'No Recall', classes: 'border-slate-900/5 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/20 text-slate-400 dark:text-slate-550 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:text-slate-600' },
                        { val: 2, label: 'Vague', classes: 'border-slate-900/5 dark:border-white/5 bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-900/60 hover:text-slate-700' },
                        { val: 3, label: 'Hard', classes: 'border-slate-900/5 dark:border-white/10 bg-slate-200/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800' },
                        { val: 4, label: 'Good', classes: 'border-slate-900/5 dark:border-white/10 bg-slate-200/70 dark:bg-slate-800/65 text-slate-800 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 hover:text-slate-950' },
                        { val: 5, label: 'Perfect', classes: 'border-transparent bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 hover:scale-[1.04]' }
                      ].map((rating) => (
                        <button
                          key={rating.val}
                          type="button"
                          onClick={() => handleSM2Rating(rating.val)}
                          className={cx(
                            "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer group active:scale-[0.97]",
                            rating.classes
                          )}
                        >
                          <span className="text-sm font-semibold transition flex items-center gap-1.5">
                            {rating.val}
                            <kbd className={cx(
                              "text-[9px] font-normal rounded px-1",
                              rating.val === 5
                                ? "bg-indigo-700 text-indigo-200 border border-indigo-550"
                                : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-slate-300"
                            )}>
                              {rating.val}
                            </kbd>
                          </span>
                          <span className={cx(
                            "text-[9px] font-semibold transition mt-0.5 text-center truncate w-full",
                            rating.val === 5 ? "text-indigo-105" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                          )}>
                            {rating.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation panel */}
      <div className="w-full flex items-center justify-between gap-3 px-1 mt-2">
        <button
          type="button"
          onClick={goPrevious}
          disabled={idx === 0}
          className="rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-850 disabled:cursor-not-allowed disabled:opacity-45 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all shadow-xs"
        >
          Previous <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-slate-400 dark:text-slate-500">←</kbd>
        </button>
        <button
          type="button"
          onClick={idx + 1 === total ? onQuizComplete : goNext}
          disabled={!isAnswered()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
        >
          {idx + 1 === total ? 'See Results' : 'Next'} <kbd className="text-[10px] bg-indigo-700/55 border border-indigo-500/30 rounded px-1 text-indigo-200">→</kbd>
        </button>
      </div>

      <CardOverviewModal
        showCardOverview={showCardOverview}
        setShowCardOverview={setShowCardOverview}
        quiz={quiz}
        answers={answers}
        currentIndex={idx}
        onJumpToQuestion={jumpToQuestion}
      />
    </main>
  );
}
