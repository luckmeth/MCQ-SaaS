import type { QuizAttempt } from '../types';
import { supabase } from './supabaseClient';

/**
 * Results history — every completed quiz attempt, stored in Supabase
 * (`attempts` table, see `supabase/schema.sql`). Append-only from the client:
 * attempts can be inserted and read, never edited or deleted here.
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

interface AttemptRow {
  id: string;
  student_name: string;
  pack_id: string;
  pack_name: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  duration_seconds: number;
  created_at: string;
}

function rowToAttempt(row: AttemptRow): QuizAttempt {
  return {
    id: row.id,
    studentName: row.student_name,
    packId: row.pack_id,
    packName: row.pack_name,
    total: row.total,
    correct: row.correct,
    wrong: row.wrong,
    skipped: row.skipped,
    percentage: row.percentage,
    durationSeconds: row.duration_seconds,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** Record one completed quiz. No-ops if Supabase isn't configured. */
export async function saveAttempt(attempt: NewAttempt): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('attempts').insert({
    student_name: attempt.studentName,
    pack_id: attempt.packId,
    pack_name: attempt.packName,
    total: attempt.total,
    correct: attempt.correct,
    wrong: attempt.wrong,
    skipped: attempt.skipped,
    percentage: attempt.percentage,
    duration_seconds: attempt.durationSeconds,
  });
  if (error) throw error;
}

/** Every recorded attempt across every student, newest first. */
export async function loadAttempts(): Promise<QuizAttempt[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('attempts')
    .select(
      'id,student_name,pack_id,pack_name,total,correct,wrong,skipped,percentage,duration_seconds,created_at',
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as AttemptRow[] | null)?.map(rowToAttempt) ?? [];
}
