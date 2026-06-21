import { describe, it, expect } from 'vitest';
import { calculateNextReview } from './sm2.js';

describe('SM-2 Core Engine (calculateNextReview)', () => {
  it('should handle Quality 5 (Perfect recall) by keeping easeFactor unchanged and preserving/scaling interval', () => {
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 2.5,
      quality: 5,
    });

    // EF' = max(1.3, 2.5 + (0.1 - 5 * 0.02)) = max(1.3, 2.5) = 2.5
    expect(result.easeFactor).toBe(2.5);

    // I' = max(1, round(10 * 2.5^(5 - 5))) = max(1, round(10 * 1)) = 10
    expect(result.interval).toBe(10);
    
    // nextReviewDate should be a valid ISO string
    expect(new Date(result.nextReviewDate).getTime()).not.toBeNaN();
  });

  it('should handle Quality 4 (Correct recall) by adjusting easeFactor and decreasing interval', () => {
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 2.5,
      quality: 4,
    });

    // EF' = max(1.3, 2.5 + (0.1 - 4 * 0.02)) = max(1.3, 2.5 + 0.02) = 2.52
    expect(result.easeFactor).toBe(2.52);

    // I' = max(1, round(10 * 2.52^(4 - 5))) = max(1, round(10 / 2.52)) = max(1, 4) = 4
    expect(result.interval).toBe(4);
  });

  it('should handle Quality 3 (Difficult recall) by adjusting easeFactor and decreasing interval further', () => {
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 2.5,
      quality: 3,
    });

    // EF' = max(1.3, 2.5 + (0.1 - 3 * 0.02)) = max(1.3, 2.5 + 0.04) = 2.54
    expect(result.easeFactor).toBe(2.54);

    // I' = max(1, round(10 * 2.54^(3 - 5))) = max(1, round(10 / (2.54^2))) = max(1, round(10 / 6.4516)) = max(1, 2) = 2
    expect(result.interval).toBe(2);
  });

  it('should drop or reset interval to minimum threshold of 1 for Quality 1 (Incorrect recall)', () => {
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 2.5,
      quality: 1,
    });

    // EF' = max(1.3, 2.5 + (0.1 - 1 * 0.02)) = 2.58
    expect(result.easeFactor).toBe(2.58);

    // I' = max(1, round(10 * 2.58^(1 - 5))) = max(1, round(10 / 44.3)) = 1
    expect(result.interval).toBe(1);
  });

  it('should drop or reset interval to minimum threshold of 1 for Quality 2 (Vague recall)', () => {
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 2.5,
      quality: 2,
    });

    // EF' = max(1.3, 2.5 + (0.1 - 2 * 0.02)) = 2.56
    expect(result.easeFactor).toBe(2.56);

    // I' = max(1, round(10 * 2.56^(2 - 5))) = max(1, round(10 / 16.78)) = 1
    expect(result.interval).toBe(1);
  });

  it('should respect the absolute floor of 1.3 for Ease Factor', () => {
    // If easeFactor is already very low, verify it doesn't go below 1.3.
    // Since quality scores <= 5 result in positive or zero delta (0.1 - quality * 0.02 >= 0),
    // it won't drop easeFactor. But if we pass a very low easeFactor like 1.0, it must be raised to 1.3.
    const result = calculateNextReview({
      interval: 10,
      easeFactor: 1.0,
      quality: 5,
    });

    expect(result.easeFactor).toBe(1.3);
  });
});
