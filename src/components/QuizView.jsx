import { useMemo, useState } from 'react'
import { cx } from '../shared/utils/helpers.js'
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
  const [hoveredRating, setHoveredRating] = useState(null);

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
    <main className="flex flex-1 flex-col py-8 w-full max-w-3xl mx-auto px-4 md:px-0 font-sans relative">
      {/* Live Monospace Session Log */}
      <div className="absolute top-0 left-0 right-0 w-full flex items-center justify-between px-4 py-2 text-[8px] font-mono tracking-widest text-emerald-600/70 dark:text-emerald-400/70 uppercase">
        <span className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
          [STATUS: ACTIVE_RECALL]
        </span>
        <span className="flex gap-4">
          <span>[DB: CONNECTED]</span>
          <span>[INTERVAL: SM2_READY]</span>
        </span>
      </div>

      {/* Editorial Mini Metadata & Control Bar */}
      <div className="flex justify-between items-center w-full px-1 mb-8 text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-555 uppercase select-none">
        <span className="flex items-center gap-1.5">
          Card <span className="text-slate-800 dark:text-slate-205 font-bold">{String(idx + 1).padStart(2, '0')}</span> / <span className="font-semibold">{String(total).padStart(2, '0')}</span>
        </span>
        <div className="flex items-center gap-6 font-medium">
          <button
            type="button"
            onClick={() => setShowCardOverview(true)}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={toggleShuffleMode}
            className={cx(
              "transition-colors cursor-pointer",
              shuffleMode ? "text-indigo-600 dark:text-indigo-400 font-bold" : "hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            Shuffle: {shuffleMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3D Perspective Card Flip Container */}
      <div className="w-full [perspective:1000px] mb-8">
        <div
          className="relative w-full transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
        >
          {/* Front Side */}
          <div
            className={cx(
              "w-full rounded-3xl premium-glass p-12 sm:p-20 md:p-24 transition-all duration-300 overflow-hidden",
              isFlipped ? "pointer-events-none absolute inset-0 opacity-0" : "relative opacity-100"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Corner Crosshairs */}
            <div className="absolute top-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute top-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute bottom-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute bottom-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
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
                          className="w-full border-l-2 border-l-transparent px-3 py-4 text-left text-sm font-semibold transition-all duration-150 hover:bg-slate-900/5 focus:bg-slate-900/5 dark:hover:bg-white/5 dark:focus:bg-white/5 hover:border-l-indigo-600 focus:border-l-indigo-600 bg-transparent text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none flex items-start gap-3 group relative"
                        >
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 select-none mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center">
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
                          className="w-full border-l-2 border-l-transparent px-3 py-4 text-left text-sm font-semibold transition-all duration-150 hover:bg-slate-900/5 focus:bg-slate-900/5 dark:hover:bg-white/5 dark:focus:bg-white/5 hover:border-l-indigo-600 focus:border-l-indigo-600 bg-transparent text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none flex items-center gap-3 group relative"
                        >
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 select-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center">
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
                                className="mx-2 inline-block w-32 border-b border-slate-350 dark:border-slate-700 bg-transparent px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                              />
                            )}
                          </span>
                        ))}
                      </div>
                      {textAnswers[idx] && (
                        <button
                          type="button"
                          onClick={submitTextAnswer}
                          className="text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-550 transition-colors uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer font-bold"
                        >
                          Submit Answer <kbd className="text-[9px] font-normal rounded px-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-500">Space</kbd>
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
                                className="mx-2 inline-block w-32 border-b border-slate-350 dark:border-slate-700 bg-transparent px-2 py-0.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
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
                            className="text-[10px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-550 transition-colors uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer font-bold"
                          >
                            Submit Answer <kbd className="text-[9px] font-normal rounded px-1.5 bg-indigo-50 dark:bg-indigo-955 border border-indigo-200 dark:border-indigo-900 text-indigo-500">Space</kbd>
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
                        className="w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-transparent px-4 py-3 text-sm font-medium transition-all duration-305 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                      />
                      
                      <button
                        type="button"
                        onClick={toggleSuggestedAnswer}
                        className="text-[10px] font-mono tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase inline-flex items-center gap-2 focus:outline-none cursor-pointer"
                      >
                        Reveal Model Answer <kbd className="text-[9px] font-normal rounded px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">Space</kbd>
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
              "w-full rounded-3xl premium-glass p-12 sm:p-20 md:p-24 transition-all duration-300 overflow-hidden",
              isFlipped ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Corner Crosshairs */}
            <div className="absolute top-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute top-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute bottom-4 left-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
            <div className="absolute bottom-4 right-4 text-slate-900/20 dark:text-white/20 font-mono text-[10px] select-none leading-none pointer-events-none">+</div>
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
                            ? 'border-l-2 border-l-rose-500 text-rose-600 dark:text-rose-455'
                            : 'border-l-2 border-l-transparent text-slate-400 dark:text-slate-500 opacity-50'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'w-full px-2 py-4 text-left text-sm font-semibold cursor-default bg-transparent flex items-start gap-3',
                              variant,
                            )}
                          >
                            <span className="font-mono text-xs opacity-60 select-none mt-0.5">
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
                        const isCorrect = optionIdx === 1 ? current.answer : !current.answer
                        const isWrongSelected = answered && isSelected && !isCorrect

                        const variant = isCorrect
                          ? 'border-l-2 border-l-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : isWrongSelected
                            ? 'border-l-2 border-l-rose-500 text-rose-600 dark:text-rose-455'
                            : 'border-l-2 border-l-transparent text-slate-400 dark:text-slate-500 opacity-50'

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={true}
                            className={cx(
                              'w-full px-2 py-4 text-left text-sm font-semibold cursor-default bg-transparent flex items-center gap-3',
                              variant,
                            )}
                          >
                            <span className="font-mono text-xs opacity-60 select-none">
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
                            className="flex-1 text-[10px] font-mono tracking-widest text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-350 transition-colors uppercase py-2 border-b border-transparent hover:border-emerald-500/20 focus:outline-none cursor-pointer text-center font-bold"
                          >
                            I was correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfAssessment(false)}
                            className="flex-1 text-[10px] font-mono tracking-widest text-rose-600 hover:text-rose-550 dark:text-rose-455 dark:hover:text-rose-350 transition-colors uppercase py-2 border-b border-transparent hover:border-rose-500/20 focus:outline-none cursor-pointer text-center font-bold"
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
                      className="relative flex items-center justify-between bg-slate-100/80 dark:bg-slate-950/60 p-1 rounded-full border border-slate-900/5 dark:border-white/10 max-w-lg mx-auto"
                      onMouseLeave={() => setHoveredRating(null)}
                    >
                      {/* Sliding Highlight Pill */}
                      <div 
                        className="absolute top-1 bottom-1 left-1 rounded-full bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-900/5 dark:border-white/10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                        style={{
                          width: 'calc(20% - 2px)',
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
                          className="relative z-10 flex flex-1 flex-col items-center justify-center py-2.5 rounded-full text-center transition-colors duration-200 cursor-pointer group focus:outline-none"
                        >
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 select-none">
                            {rating.val}
                            <kbd className="text-[9px] font-normal rounded px-1.5 bg-slate-200 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-colors duration-200">
                              {rating.val}
                            </kbd>
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-455 transition-colors duration-200 truncate w-full px-1 select-none font-medium">
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
      <div className="w-full flex items-center justify-between px-1 mt-6 border-t border-slate-900/5 dark:border-white/5 pt-6 text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-550 uppercase select-none font-medium">
        <button
          type="button"
          onClick={goPrevious}
          disabled={idx === 0}
          className="hover:text-slate-800 dark:hover:text-slate-205 disabled:opacity-40 disabled:hover:text-slate-400 dark:disabled:hover:text-slate-500 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
          className="hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:hover:text-slate-400 dark:disabled:hover:text-slate-500 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
