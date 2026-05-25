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
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-6 transition-colors duration-200 mb-6">
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
              "w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md transition-all duration-300",
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
                          className="grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] hover:shadow-md focus:shadow-md cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/20 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-slate-805 text-xs font-bold text-slate-700 dark:text-slate-350 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
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
                          className="min-h-14 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] hover:shadow-md focus:shadow-md cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 hover:border-teal-300 dark:hover:border-teal-750 hover:bg-teal-50 dark:hover:bg-teal-950/20 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                                className="mx-2 inline-block w-32 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] hover:border-slate-400 focus:border-indigo-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      {textAnswers[idx] && (
                        <button
                          type="button"
                          onClick={submitTextAnswer}
                          className="rounded-md bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] focus:scale-[1.02] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          Submit Answer <kbd className="text-[10px] bg-teal-850 dark:bg-teal-900 border border-teal-605 dark:border-teal-700 rounded px-1 text-teal-200">Space</kbd>
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
                                className="mx-2 inline-block w-32 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02] hover:border-slate-400 focus:border-indigo-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                            className="rounded-md bg-teal-700 hover:bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] focus:scale-[1.02] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            Submit Answer <kbd className="text-[10px] bg-teal-850 dark:bg-teal-900 border border-teal-605 dark:border-teal-700 rounded px-1 text-teal-200">Space</kbd>
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
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-slate-450 focus:border-indigo-500 hover:scale-[1.01] focus:scale-[1.01] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      
                      <button
                        type="button"
                        onClick={toggleSuggestedAnswer}
                        className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-205 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] focus:scale-[1.02] transition-all duration-200 inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        Reveal Model Answer <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-slate-400 dark:text-slate-500">Space</kbd>
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
              "w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md transition-all duration-300",
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
                          ? 'border-teal-300 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/20 text-teal-955 dark:text-teal-200'
                          : isWrongSelected
                            ? 'border-rose-300 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-950/20 text-rose-955 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-300'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'grid min-h-14 w-full grid-cols-[32px_1fr] items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold shadow-sm cursor-default',
                              variant,
                            )}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-slate-805 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
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
                          ? 'border-teal-300 dark:border-teal-700/50 bg-teal-50 dark:bg-teal-950/20 text-teal-955 dark:text-teal-200'
                          : isWrongSelected
                            ? 'border-rose-300 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-950/20 text-rose-955 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-305'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'min-h-14 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm cursor-default',
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
                                  'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium transition-colors bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-955 dark:text-teal-200'
                                    : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-955 dark:text-rose-200'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'rounded-lg border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-205'
                          : 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-205'
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
                                  'mx-2 inline-block w-32 rounded-md border px-3 py-1 text-sm font-medium transition-colors bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-955 dark:text-teal-200'
                                    : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-955 dark:text-rose-200'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'rounded-lg border px-4 py-3 text-sm font-semibold',
                        answers[idx]?.isCorrect
                          ? 'border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-205'
                          : 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-205'
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
                        className="w-full rounded-md border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 px-4 py-3 text-sm font-medium cursor-default"
                      />
                      
                      {showSuggestedAnswer[idx] && (
                        <div className="rounded-lg border border-amber-205 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 animate-fade-up">
                          <p className="text-sm font-semibold text-amber-905 dark:text-amber-300 mb-2">Model Answer:</p>
                          <p className="text-sm text-amber-800 dark:text-amber-400">{current.suggestedAnswer}</p>
                        </div>
                      )}

                      {showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(true)}
                            className="flex-1 rounded-md bg-teal-700 hover:bg-teal-800 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:scale-[1.02] focus:scale-[1.02] transition-all cursor-pointer"
                          >
                            I was correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(false)}
                            className="flex-1 rounded-md border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300 shadow-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:scale-[1.02] focus:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                          >
                            I still need to review
                          </button>
                        </div>
                      )}

                      {answers[idx]?.selfAssessed !== undefined && (
                        <p className={cx(
                          'rounded-lg border px-4 py-3 text-sm font-semibold',
                          answers[idx]?.selfAssessedCorrect
                            ? 'border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-205'
                            : 'border-amber-200 dark:border-amber-900/50 bg-amber-55 dark:bg-amber-955/30 text-amber-850 dark:text-amber-200'
                        )}>
                          {answers[idx]?.selfAssessedCorrect ? 'Self-assessed as correct' : 'Marked for review'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* SM-2 Recall performance selectors */}
                {isAnswered() && (
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 animate-fade-up">
                    <span className="block text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                      Rate your recall performance (SM-2):
                    </span>
                    <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                      {[
                        { val: 1, label: 'No Recall' },
                        { val: 2, label: 'Vague' },
                        { val: 3, label: 'Hard' },
                        { val: 4, label: 'Good' },
                        { val: 5, label: 'Perfect' }
                      ].map((rating) => (
                        <button
                          key={rating.val}
                          type="button"
                          onClick={() => handleSM2Rating(rating.val)}
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-350 hover:text-indigo-900 dark:hover:text-indigo-200 transition bg-white dark:bg-slate-850 hover:scale-[1.04] focus:scale-[1.04] transition-all duration-200 cursor-pointer group"
                        >
                          <span className="text-sm font-extrabold group-hover:scale-110 transition flex items-center gap-1.5">
                            {rating.val}
                            <kbd className="text-[9px] bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded px-1 text-slate-400 dark:text-slate-500 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-350 font-normal">
                              {rating.val}
                            </kbd>
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-550 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition mt-1 text-center truncate w-full">
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
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45 inline-flex items-center gap-1.5 hover:scale-[1.02] focus:scale-[1.02] transition-all"
        >
          Previous <kbd className="text-[10px] bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-slate-400 dark:text-slate-500">←</kbd>
        </button>
        <button
          type="button"
          onClick={idx + 1 === total ? onQuizComplete : goNext}
          disabled={!isAnswered()}
          className="rounded-md bg-slate-950 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-45 inline-flex items-center gap-1.5 hover:scale-[1.02] focus:scale-[1.02] transition-all"
        >
          {idx + 1 === total ? 'See Results' : 'Next'} <kbd className="text-[10px] bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-750 rounded px-1 text-slate-400 dark:text-slate-500">→</kbd>
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
