import type { QuizAttempt } from '../types';
import { getJson, sendJson } from './apiClient';

/**
 * Results history: every completed quiz attempt, stored in Neon Postgres
 * through the local server API.
 */

export interface NewAttempt {
  studentName: string;
  packId: string;
  packName: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  durationSeconds: number;
}

/** Record one completed quiz. */
export async function saveAttempt(attempt: NewAttempt): Promise<void> {
  await sendJson('/api/attempts', 'POST', attempt);
}

/** Every recorded attempt across every student, newest first. */
export async function loadAttempts(): Promise<QuizAttempt[]> {
  return getJson<QuizAttempt[]>('/api/attempts');
}
