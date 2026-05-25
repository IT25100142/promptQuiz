/**
 * Calculates the next review parameters using a customized SuperMemo-2 (SM-2) algorithm.
 *
 * @param {Object} params
 * @param {number} params.interval - Current interval in days
 * @param {number} params.easeFactor - Current ease factor
 * @param {number} params.quality - Performance quality score from 1 to 5
 * @returns {Object} Updated parameters: { interval, easeFactor, nextReviewDate }
 */
export function calculateNextReview({ interval, easeFactor, quality }) {
  // EF' = max(1.3, EF + (0.1 - (q * 0.02)))
  const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - quality * 0.02));

  // I' = max(1, round(I * EF'^(q - 5)))
  const newInterval = Math.max(1, Math.round(interval * Math.pow(newEaseFactor, quality - 5)));

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: Number(newEaseFactor.toFixed(4)), // Avoid precision float issues
    nextReviewDate: nextDate.toISOString(),
  };
}
