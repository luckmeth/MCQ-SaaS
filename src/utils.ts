import type { Difficulty, Question } from './types';

/** Fisher–Yates shuffle — returns a new array, does not mutate the input. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface QuizConfig {
  count: number;
  topic: string | 'All';
  difficulty: Difficulty | 'All';
}

/**
 * Build a randomised quiz from the full bank according to the player's
 * chosen filters. Selecting fewer questions than are available yields a
 * fresh random subset each time — this is what makes replay feel like a game.
 */
export function buildQuiz(bank: readonly Question[], config: QuizConfig): Question[] {
  let pool = bank.slice();
  if (config.topic !== 'All') pool = pool.filter((q) => q.topic === config.topic);
  if (config.difficulty !== 'All') pool = pool.filter((q) => q.difficulty === config.difficulty);
  return shuffle(pool).slice(0, Math.min(config.count, pool.length));
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface DifficultyMeta {
  label: string;
  color: string;
  ring: string;
  dot: string;
}

/** Safe lookup — falls back to `medium` styling for any unexpected value. */
export function metaFor(difficulty: string): DifficultyMeta {
  return difficultyMeta[difficulty as Difficulty] ?? difficultyMeta.medium;
}

export const difficultyMeta: Record<Difficulty, DifficultyMeta> = {
  medium: {
    label: 'Medium',
    color: 'text-amber-300',
    ring: 'ring-amber-400/40 bg-amber-400/10',
    dot: 'bg-amber-400',
  },
  hard: {
    label: 'Hard',
    color: 'text-orange-300',
    ring: 'ring-orange-400/40 bg-orange-400/10',
    dot: 'bg-orange-400',
  },
  expert: {
    label: 'Expert',
    color: 'text-rose-300',
    ring: 'ring-rose-400/40 bg-rose-400/10',
    dot: 'bg-rose-400',
  },
};
