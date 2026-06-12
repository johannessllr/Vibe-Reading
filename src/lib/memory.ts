import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MEMORY_PATH = join(process.cwd(), 'data/buddy-memory.md');
const STATE_PATH = join(process.cwd(), 'data/state.json');

export function readMemory(): string {
  return existsSync(MEMORY_PATH) ? readFileSync(MEMORY_PATH, 'utf8') : '';
}

export function writeMemory(content: string): void {
  writeFileSync(MEMORY_PATH, content);
}

export interface QuizState {
  level: number; // 1..5
  correctStreak: number;
  asked: number;
  correct: number;
}

/** strict = fiction, never look ahead. guide = non-fiction, may point ahead. */
export type SpoilerMode = 'strict' | 'guide';

interface AppState {
  quiz: QuizState;
  spoilerMode: SpoilerMode;
}

const DEFAULT_STATE: AppState = {
  quiz: { level: 1, correctStreak: 0, asked: 0, correct: 0 },
  spoilerMode: 'guide',
};

function readState(): AppState {
  if (!existsSync(STATE_PATH)) return DEFAULT_STATE;
  return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(STATE_PATH, 'utf8')) };
}

function writeState(s: AppState): void {
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 1));
}

export function readQuizState(): QuizState {
  return readState().quiz;
}

export function writeQuizState(q: QuizState): void {
  writeState({ ...readState(), quiz: q });
}

export function readSpoilerMode(): SpoilerMode {
  return readState().spoilerMode;
}

export function writeSpoilerMode(m: SpoilerMode): void {
  writeState({ ...readState(), spoilerMode: m });
}

/** Pure difficulty ramp: 2 correct in a row → +1 level; wrong → −1. Range 1–5. */
export function applyAnswer(s: QuizState, wasCorrect: boolean): QuizState {
  const asked = s.asked + 1;
  const correct = s.correct + (wasCorrect ? 1 : 0);
  if (!wasCorrect) {
    return { level: Math.max(1, s.level - 1), correctStreak: 0, asked, correct };
  }
  const streak = s.correctStreak + 1;
  if (streak >= 2) {
    return { level: Math.min(5, s.level + 1), correctStreak: 0, asked, correct };
  }
  return { level: s.level, correctStreak: streak, asked, correct };
}
