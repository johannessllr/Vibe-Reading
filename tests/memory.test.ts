import { describe, it, expect } from 'vitest';
import { applyAnswer, type QuizState } from '../src/lib/memory';

const fresh: QuizState = { level: 1, correctStreak: 0, asked: 0, correct: 0 };

describe('applyAnswer', () => {
  it('levels up after 2 correct in a row and resets streak', () => {
    let s = applyAnswer(fresh, true);
    expect(s).toMatchObject({ level: 1, correctStreak: 1 });
    s = applyAnswer(s, true);
    expect(s).toMatchObject({ level: 2, correctStreak: 0, asked: 2, correct: 2 });
  });

  it('drops one level on a wrong answer, floor 1', () => {
    const atL3: QuizState = { level: 3, correctStreak: 1, asked: 5, correct: 4 };
    expect(applyAnswer(atL3, false)).toMatchObject({ level: 2, correctStreak: 0 });
    expect(applyAnswer(fresh, false).level).toBe(1);
  });

  it('caps at level 5', () => {
    const atL5: QuizState = { level: 5, correctStreak: 1, asked: 9, correct: 9 };
    expect(applyAnswer(atL5, true).level).toBe(5);
  });
});
