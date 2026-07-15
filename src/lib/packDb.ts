import type { Difficulty, Question, QuestionPack } from '../types';
import { supabase } from './supabaseClient';

/**
 * Database-backed "library" of imported packs, stored in Supabase.
 *
 * Every imported pack becomes one row in `packs`, and each of its questions
 * becomes a row in `questions` (see `supabase/schema.sql`). The built-in bank is
 * never stored — only user-imported cartridges live here.
 *
 * The active-pack selection stays in localStorage: it's a per-device UI
 * preference, not shared library data.
 */

const ACTIVE_KEY = 'ena-biochem:activePackId';

/** Shape of a row coming back from the `questions` table. */
interface QuestionRow {
  position: number;
  question: string;
  options: unknown;
  correct_index: number;
  difficulty: string;
  topic: string;
  explanation: string | null;
}

/** Shape of a `packs` row joined with its nested `questions`. */
interface PackRow {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  created_at: string | null;
  questions: QuestionRow[] | null;
}

const DIFFICULTIES: Difficulty[] = ['medium', 'hard', 'expert'];

function asDifficulty(value: string): Difficulty {
  return (DIFFICULTIES as string[]).includes(value) ? (value as Difficulty) : 'medium';
}

/** Map a DB row (+ nested questions) into the app's `QuestionPack` model. */
function rowToPack(row: PackRow): QuestionPack {
  const sorted = [...(row.questions ?? [])].sort((a, b) => a.position - b.position);
  const questions: Question[] = sorted.map((q, i) => ({
    // Local, per-quiz id — only needs to be unique within the pack.
    id: i + 1,
    question: q.question,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctIndex: q.correct_index,
    difficulty: asDifficulty(q.difficulty),
    topic: q.topic,
    explanation: q.explanation ?? undefined,
  }));

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    questions,
  };
}

/** Load every imported pack (newest first). Returns [] if Supabase is unset. */
export async function loadPacks(): Promise<QuestionPack[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('packs')
    .select(
      'id,name,description,author,created_at,' +
        'questions(position,question,options,correct_index,difficulty,topic,explanation)',
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as PackRow[] | null)?.map(rowToPack) ?? [];
}

/**
 * Insert (or replace by id) a pack and all of its questions.
 * Questions are fully replaced so re-importing the same id can't leave orphans.
 */
export async function savePack(pack: QuestionPack): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured — cannot save the pack.');

  const { error: packErr } = await supabase.from('packs').upsert({
    id: pack.id,
    name: pack.name,
    description: pack.description ?? null,
    author: pack.author ?? null,
    builtin: false,
    created_at: new Date(pack.createdAt).toISOString(),
  });
  if (packErr) throw packErr;

  // Replace this pack's questions wholesale.
  const { error: delErr } = await supabase.from('questions').delete().eq('pack_id', pack.id);
  if (delErr) throw delErr;

  const rows = pack.questions.map((q, i) => ({
    pack_id: pack.id,
    position: i,
    question: q.question,
    options: q.options,
    correct_index: q.correctIndex,
    difficulty: q.difficulty,
    topic: q.topic,
    explanation: q.explanation ?? null,
  }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('questions').insert(rows);
    if (insErr) throw insErr;
  }
}

/** Delete a pack (its questions cascade-delete in the database). */
export async function deletePack(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured — cannot delete the pack.');
  const { error } = await supabase.from('packs').delete().eq('id', id);
  if (error) throw error;
}

// --- Active-pack selection (device-local UI preference) ----------------------

export function getActivePackId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActivePackId(id: string): void {
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* storage unavailable — keep running from in-memory state */
  }
}
