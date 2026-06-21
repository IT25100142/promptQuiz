import { useCallback, useMemo, useState } from 'react'
import { cx } from '../shared/utils/helpers.js'
import CardOverviewModal from './CardOverviewModal.jsx'
import { calculateNextReview } from '../shared/services/sm2.js'
import { initDB } from '../shared/services/indexedDB.js'
import { useKeyPress } from '../shared/utils/useKeyPress.js'
import { useLocalStorage } from '../shared/hooks/useLocalStorage.js'

export default function QuizView({
  current,
  idx,
  total,
  answeredCount,
  score,
  progress: _progress,
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
  keepFirstQuestion: _keepFirstQuestion,
  toggleShuffleMode,
  toggleKeepFirstQuestion: _toggleKeepFirstQuestion,
  showCardOverview,
  setShowCardOverview,
  jumpToQuestion,
  quiz
}) {
  const [hoveredRating, setHoveredRating] = useState(null);
  const [isZenMode, setIsZenMode] = useLocalStorage('promptquiz_zen_mode', false);

  const handleSM2Rating = useCallback(async (rating) => {
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
  }, [current, goNext, idx, onQuizComplete, total]);

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

    map['z'] = () => setIsZenMode(prev => !prev);
    map['Z'] = () => setIsZenMode(prev => !prev);

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
    setIsZenMode,
  ]);

  useKeyPress(shortcuts);

  if (!current) return null

  const isFlipped = !!(isAnswered() || showSuggestedAnswer[idx]);

  return (
    <main className="flex flex-1 flex-col py-8 w-full max-w-5xl mx-auto px-4 md:px-0 font-sans relative animate-fade-in">
      {/* Live Monospace Session Log */}
      <div className={cx("absolute top-0 left-0 right-0 w-full flex items-center justify-between px-4 py-2.5 rounded-full glass-nav text-[8px] font-mono tracking-widest text-emerald-600/80 dark:text-emerald-400/80 uppercase transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", isZenMode && "opacity-0 pointer-events-none scale-95 blur-sm")}>
        <span className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-glow-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          [STATUS: ACTIVE_RECALL]
        </span>
        <span className="flex gap-4">
          <span>[DB: CONNECTED]</span>
          <span>[INTERVAL: SM2_READY]</span>
        </span>
      </div>

      {/* Editorial Mini Metadata & Control Bar */}
      <div className={cx("flex justify-between items-center w-full px-1 mb-8 mt-10 text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", isZenMode && "opacity-0 pointer-events-none scale-95 blur-sm")}>
        <span className="flex items-center gap-1.5">
          Card <span className="text-slate-800 dark:text-slate-200 font-bold">{String(idx + 1).padStart(2, '0')}</span> / <span className="font-semibold">{String(total).padStart(2, '0')}</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-3 font-medium">
          <button
            type="button"
            onClick={() => setShowCardOverview(true)}
            className="pill-badge rounded-full px-3 py-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-[0.97] cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={toggleShuffleMode}
            className={cx(
              "rounded-full px-3 py-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer",
              shuffleMode
                ? "text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20"
                : "pill-badge hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            Shuffle: {shuffleMode ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setIsZenMode(!isZenMode)}
            className={cx(
              "rounded-full px-3 py-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer font-bold",
              isZenMode
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20"
                : "pill-badge hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            [ ZEN ]
          </button>
        </div>
      </div>

      {/* 3D Perspective Card Flip Container */}
      <div key={current.id} className="w-full [perspective:1000px] mb-8 animate-fade-up">
        <div
          className="relative w-full transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
        >
          {/* Front Side */}
          <div
            className={cx(
              "w-full rounded-3xl premium-glass p-12 sm:p-16 transition-all duration-300 overflow-hidden",
              isFlipped ? "pointer-events-none absolute inset-0 opacity-0" : "relative opacity-100"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Corner Crosshairs */}
            <div className={cx("absolute top-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute top-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute bottom-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute bottom-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            {!isFlipped && (
              <>
                <h2 className="font-serif text-3xl sm:text-4xl leading-relaxed tracking-wide text-slate-900 dark:text-slate-100">
                  <MarkdownRenderer text={current.question} />
                </h2>

                <div className="mt-12">
                  {/* Multiple Choice */}
                  {current.type === 'multiple-choice' && (
                    <div className="flex flex-col gap-4">
                      {current.options.map((option, optionIdx) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          className="w-full border-l-2 border-l-transparent px-6 py-4 rounded-xl text-left text-base font-semibold transition-all duration-150 active:scale-[0.98] hover:bg-slate-900/5 focus:bg-slate-900/5 dark:hover:bg-white/5 dark:focus:bg-white/5 hover:border-l-indigo-600 focus:border-l-indigo-600 bg-transparent text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none flex items-start gap-3 group relative"
                        >
                          <span className="font-mono text-sm text-slate-400 dark:text-slate-500 select-none mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center">
                            <span className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 transition-all duration-150 mr-1 overflow-hidden w-0 group-hover:w-auto inline-block">→</span >
                            {String.fromCharCode(65 + optionIdx)}/
                          </span>
                          <span className="text-left leading-relaxed font-normal text-slate-800 dark:text-slate-200">
                            <MarkdownRenderer text={option} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* True/False */}
                  {current.type === 'true-false' && (
                    <div className="flex flex-col gap-4">
                      {['True', 'False'].map((option, optionIdx) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(optionIdx)}
                          className="w-full border-l-2 border-l-transparent px-6 py-4 rounded-xl text-left text-base font-semibold transition-all duration-150 active:scale-[0.98] hover:bg-slate-900/5 focus:bg-slate-900/5 dark:hover:bg-white/5 dark:focus:bg-white/5 hover:border-l-indigo-600 focus:border-l-indigo-600 bg-transparent text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none flex items-center gap-3 group relative"
                        >
                          <span className="font-mono text-sm text-slate-400 dark:text-slate-500 select-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center">
                            <span className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 transition-all duration-150 mr-1 overflow-hidden w-0 group-hover:w-auto inline-block">→</span >
                            {optionIdx === 0 ? '01' : '02'}/
                          </span>
                          <span className="font-normal text-slate-800 dark:text-slate-200">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill in the Blank */}
                  {current.type === 'fill-blank' && (
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100 font-normal">
                        {current.question.split('___').map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.question.split('___').length - 1 && (
                              <input
                                type="text"
                                value={textAnswers[idx] || ''}
                                onChange={(e) => handleTextAnswer(e.target.value)}
                                placeholder="answer"
                                className="mx-2 inline-block w-32 border-b border-slate-300 dark:border-slate-700 bg-transparent px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      {textAnswers[idx] && (
                        <button
                          type="button"
                          onClick={submitTextAnswer}
                          className="px-8 py-3 w-full sm:w-auto justify-center text-base tracking-wide rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all active:scale-[0.97] uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer font-bold"
                        >
                          Submit Answer <kbd className="text-sm font-normal rounded px-2 bg-black/10 border border-black/10 text-white/80">Space</kbd>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cloze Deletion */}
                  {current.type === 'cloze' && (
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100 font-normal">
                        {current.question.split(/\{\d+\}/).map((part, partIdx) => (
                          <span key={partIdx}>
                            {part}
                            {partIdx < current.answers.length && (
                              <input
                                type="text"
                                value={textAnswers[`${idx}-${partIdx}`] || ''}
                                onChange={(e) => handleTextAnswer(e.target.value, partIdx)}
                                placeholder={current.answers[partIdx] || 'answer'}
                                className="mx-2 inline-block w-32 border-b border-slate-300 dark:border-slate-700 bg-transparent px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
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
                            className="px-8 py-3 w-full sm:w-auto justify-center text-base tracking-wide rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all active:scale-[0.97] uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer font-bold"
                          >
                            Submit Answer <kbd className="text-sm font-normal rounded px-2 bg-black/10 border border-black/10 text-white/80">Space</kbd>
                          </button>
                        )
                      })()}
                    </div>
                  )}

                  {/* Short Answer */}
                  {current.type === 'short-answer' && (
                    <div className="space-y-6">
                      <textarea
                        value={textAnswers[idx] || ''}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                      />
                      
                      <button
                        type="button"
                        onClick={toggleSuggestedAnswer}
                        className="px-8 py-3 w-full sm:w-auto justify-center text-base tracking-wide rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all active:scale-[0.97] uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer font-bold"
                      >
                        Reveal Model Answer <kbd className="text-sm font-normal rounded px-2 bg-black/10 border border-black/10 text-white/80">Space</kbd>
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
              "w-full rounded-3xl premium-glass p-12 sm:p-16 transition-all duration-300 overflow-hidden",
              isFlipped ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Corner Crosshairs */}
            <div className={cx("absolute top-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute top-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute bottom-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            <div className={cx("absolute bottom-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none transition-all duration-500", isZenMode && "opacity-0 scale-95")}>+</div>
            {isFlipped && (
              <>
                <h2 className="font-serif text-3xl sm:text-4xl leading-relaxed tracking-wide text-slate-900 dark:text-slate-100">
                  <MarkdownRenderer text={current.question} />
                </h2>

                <div className="mt-12">
                  {/* Multiple Choice */}
                  {current.type === 'multiple-choice' && (
                    <div className="flex flex-col gap-4">
                      {current.options.map((option, optionIdx) => {
                        const answered = answers[idx] !== null
                        const isSelected = answers[idx] === optionIdx
                        const isCorrect = optionIdx === current.answerIndex
                        const isWrongSelected = answered && isSelected && !isCorrect

                        const variant = isCorrect
                          ? 'border-l-2 border-l-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : isWrongSelected
                            ? 'border-l-2 border-l-rose-500 text-rose-600 dark:text-rose-400'
                            : 'border-l-2 border-l-transparent text-slate-400 dark:text-slate-500 opacity-50'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'w-full px-6 py-4 rounded-xl text-left text-base font-semibold cursor-default bg-transparent flex items-start gap-3',
                              variant,
                            )}
                          >
                            <span className="font-mono text-sm opacity-60 select-none mt-0.5">
                              {String.fromCharCode(65 + optionIdx)}/
                            </span>
                            <span className="text-left leading-relaxed font-normal text-slate-700 dark:text-slate-300">
                              <MarkdownRenderer text={option} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* True/False */}
                  {current.type === 'true-false' && (
                    <div className="flex flex-col gap-4">
                      {['True', 'False'].map((option, optionIdx) => {
                        const answered = answers[idx] !== null
                        const isSelected = answers[idx] === optionIdx
                        const isCorrect = optionIdx === 0 ? current.answer : !current.answer
                        const isWrongSelected = answered && isSelected && !isCorrect

                        const variant = isCorrect
                          ? 'border-l-2 border-l-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : isWrongSelected
                            ? 'border-l-2 border-l-rose-500 text-rose-600 dark:text-rose-400'
                            : 'border-l-2 border-l-transparent text-slate-400 dark:text-slate-500 opacity-50'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'w-full px-6 py-4 rounded-xl text-left text-base font-semibold cursor-default bg-transparent flex items-center gap-3',
                              variant,
                            )}
                          >
                            <span className="font-mono text-sm opacity-60 select-none">
                              {optionIdx === 0 ? '01' : '02'}/
                            </span>
                            <span className="font-normal text-slate-700 dark:text-slate-300">{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Fill in the Blank */}
                  {current.type === 'fill-blank' && (
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100 font-normal">
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
                                  'mx-2 inline-block w-32 border-b bg-transparent px-2 py-0.5 text-sm font-mono cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-rose-500 text-rose-600 dark:text-rose-400'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'text-xs font-mono tracking-wider uppercase font-semibold',
                        answers[idx]?.isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct' : `Correct Answer: ${current.answers[0]}`}
                      </p>
                    </div>
                  )}

                  {/* Cloze Deletion */}
                  {current.type === 'cloze' && (
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed text-slate-900 dark:text-slate-100 font-normal">
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
                                  'mx-2 inline-block w-32 border-b bg-transparent px-2 py-0.5 text-sm font-mono cursor-default',
                                  answers[idx]?.isCorrect
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-rose-500 text-rose-600 dark:text-rose-400'
                                )}
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className={cx(
                        'text-xs font-mono tracking-wider uppercase font-semibold',
                        answers[idx]?.isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}>
                        {answers[idx]?.isCorrect ? 'Correct' : `Correct Answers: ${current.answers.join(', ')}`}
                      </p>
                    </div>
                  )}

                  {/* Short Answer */}
                  {current.type === 'short-answer' && (
                    <div className="space-y-6">
                      <textarea
                        value={textAnswers[idx] || ''}
                        disabled={true}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 px-4 py-3 text-sm font-medium cursor-default"
                      />
                      
                      {showSuggestedAnswer[idx] && (
                        <div className="rounded-xl border border-indigo-500/10 dark:border-indigo-500/10 bg-indigo-50/10 dark:bg-indigo-950/10 p-6 animate-fade-up">
                          <p className="text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-2">Model Answer</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{current.suggestedAnswer}</p>
                        </div>
                      )}

                      {showSuggestedAnswer[idx] && answers[idx]?.selfAssessed === undefined && (
                        <div className="flex gap-4 mt-4">
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(true)}
                            className="flex-1 text-xs font-semibold tracking-widest text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-all active:scale-[0.97] uppercase py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-500/10 focus:outline-none cursor-pointer text-center"
                          >
                            I was correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(false)}
                            className="flex-1 text-xs font-semibold tracking-widest text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 transition-all active:scale-[0.97] uppercase py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-500/10 focus:outline-none cursor-pointer text-center"
                          >
                            I still need to review
                          </button>
                        </div>
                      )}

                      {answers[idx]?.selfAssessed !== undefined && (
                        <p className={cx(
                          'text-xs font-mono tracking-wider uppercase font-semibold',
                          answers[idx]?.selfAssessedCorrect
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}>
                          {answers[idx]?.selfAssessedCorrect ? 'Self-assessed as correct' : 'Marked for review'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tactical SM-2 Performance Slider Capsule */}
                {isAnswered() && (
                  <div className="mt-12 border-t border-slate-900/5 dark:border-white/5 pt-8 animate-fade-up">
                    <span className="block text-center text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-6 select-none font-semibold">
                      Rate Recall Performance
                    </span>
                    <div 
                      className="relative flex items-center justify-between bg-slate-100/80 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900/5 dark:border-white/10 max-w-lg mx-auto h-14"
                      onMouseLeave={() => setHoveredRating(null)}
                    >
                      {/* Sliding Highlight Pill */}
                      <div 
                        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-900/5 dark:border-white/10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                        style={{
                          width: 'calc(20% - 3px)',
                          transform: hoveredRating !== null 
                            ? `translateX(calc(${hoveredRating * 100}%))` 
                            : 'scale(0.95)',
                          opacity: hoveredRating !== null ? 1 : 0
                        }}
                      />

                      {[
                        { val: 1, label: 'No Recall' },
                        { val: 2, label: 'Vague' },
                        { val: 3, label: 'Hard' },
                        { val: 4, label: 'Good' },
                        { val: 5, label: 'Perfect' }
                      ].map((rating, rIdx) => (
                        <button
                          key={rating.val}
                          type="button"
                          onClick={() => handleSM2Rating(rating.val)}
                          onMouseEnter={() => setHoveredRating(rIdx)}
                          className="relative z-10 flex flex-1 flex-col items-center justify-center h-full rounded-xl text-center transition-all duration-200 active:scale-[0.95] cursor-pointer group focus:outline-none"
                        >
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 select-none">
                            {rating.val}
                            <kbd className="hidden sm:inline-block text-[10px] font-normal rounded px-1.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-colors duration-200">
                              {rating.val}
                            </kbd>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate w-full px-1 select-none">
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

      {/* Editorial Navigation Footer */}
      <div className={cx("w-full flex items-center justify-between px-1 mt-6 border-t border-slate-900/5 dark:border-white/5 pt-6 text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none font-medium transition-all duration-500 ease-in-out", isZenMode && "opacity-0 pointer-events-none scale-95")}>
        <button
          type="button"
          onClick={goPrevious}
          disabled={idx === 0}
          className="hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 dark:disabled:hover:text-slate-500 transition-all active:scale-[0.97] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <div className="hidden sm:flex gap-4">
          <span>Answered: {String(answeredCount).padStart(2, '0')}</span>
          <span>Score: {String(score).padStart(2, '0')}</span>
          {isReviewMode && <span>Mistakes: {String(incorrectQuestions.length).padStart(2, '0')}</span>}
        </div>
        <button
          type="button"
          onClick={idx + 1 === total ? onQuizComplete : goNext}
          disabled={!isAnswered()}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:hover:text-slate-400 dark:disabled:hover:text-slate-500 transition-all active:scale-[0.97] flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          {idx + 1 === total ? 'See Results' : 'Next'} →
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
