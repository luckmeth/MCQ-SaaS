import type { QuestionPack } from '../types';

/**
 * Persistent "library" of imported packs, backed by localStorage. The built-in
 * pack is never stored here — only user-imported cartridges. Every access is
 * guarded so private-mode / quota / disabled-storage failures degrade to a
 * no-op instead of crashing the app.
 */

const PACKS_KEY = 'ena-biochem:packs';
const ACTIVE_KEY = 'ena-biochem:activePackId';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable / full — keep running from in-memory state */
  }
}

/** Basic runtime shape check so a corrupt entry can't poison the whole list. */
function isPack(value: unknown): value is QuestionPack {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.name === 'string' && Array.isArray(p.questions);
}

export function loadPacks(): QuestionPack[] {
  const raw = safeGet(PACKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPack) : [];
  } catch {
    return [];
  }
}

function persist(packs: QuestionPack[]): void {
  safeSet(PACKS_KEY, JSON.stringify(packs));
}

/** Add (or replace by id) a pack and return the updated library. */
export function savePack(pack: QuestionPack): QuestionPack[] {
  const packs = loadPacks().filter((p) => p.id !== pack.id);
  packs.unshift(pack);
  persist(packs);
  return packs;
}

/** Remove a pack by id and return the updated library. */
export function deletePack(id: string): QuestionPack[] {
  const packs = loadPacks().filter((p) => p.id !== id);
  persist(packs);
  return packs;
}

export function getActivePackId(): string | null {
  return safeGet(ACTIVE_KEY);
}

export function setActivePackId(id: string): void {
  safeSet(ACTIVE_KEY, id);
}
