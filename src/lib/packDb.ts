import type { QuestionPack } from '../types';
import { getJson, sendJson } from './apiClient';

/**
 * Database-backed library of imported packs, stored in Neon Postgres through
 * the local server API. The active-pack selection stays in localStorage: it's
 * a per-device UI preference, not shared library data.
 */

const ACTIVE_KEY = 'ena-biochem:activePackId';

/** Load every imported pack (newest first). Returns [] if the API is unavailable. */
export async function loadPacks(): Promise<QuestionPack[]> {
  try {
    return await getJson<QuestionPack[]>('/api/packs');
  } catch (error) {
    console.warn('[neon] Could not load packs:', error);
    return [];
  }
}

/**
 * Largest question batch we put in one request. Vercel rejects a serverless
 * request body over 4.5 MB, and packs with embedded base64 figures run well
 * past that, so anything bigger is uploaded as several appends.
 */
const MAX_BATCH_BYTES = 3 * 1024 * 1024;

/**
 * Split questions into batches that each stay under MAX_BATCH_BYTES. A single
 * question larger than the limit still gets its own batch - nothing can be
 * done about that here, and the server will report the failure.
 */
function batchQuestions(questions: QuestionPack['questions']): QuestionPack['questions'][] {
  const batches: QuestionPack['questions'][] = [];
  let current: QuestionPack['questions'] = [];
  let size = 0;

  for (const question of questions) {
    const bytes = JSON.stringify(question).length;
    if (current.length > 0 && size + bytes > MAX_BATCH_BYTES) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(question);
    size += bytes;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Insert (or replace by id) a pack and all of its questions.
 * Questions are fully replaced so re-importing the same id can't leave orphans.
 */
export async function savePack(pack: QuestionPack): Promise<void> {
  const batches = batchQuestions(pack.questions);

  // The first request replaces the pack and its existing questions; later ones
  // append. An empty pack still needs this call to create the pack row.
  await sendJson('/api/packs', 'PUT', {
    id: pack.id,
    name: pack.name,
    description: pack.description ?? null,
    author: pack.author ?? null,
    createdAt: pack.createdAt,
    questions: batches[0] ?? [],
  });

  for (const batch of batches.slice(1)) {
    await sendJson(`/api/packs/${encodeURIComponent(pack.id)}/questions`, 'POST', {
      questions: batch,
    });
  }
}

/** Delete a pack (its questions cascade-delete in the database). */
export async function deletePack(id: string): Promise<void> {
  await sendJson(`/api/packs/${encodeURIComponent(id)}`, 'DELETE');
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
    /* storage unavailable - keep running from in-memory state */
  }
}
