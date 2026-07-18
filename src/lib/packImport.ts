import type { Difficulty, Question, QuestionPack } from '../types';

/**
 * Parse + normalise an AI-generated (or hand-written) question pack.
 *
 * The importer is deliberately lenient so that "paste whatever the AI gave you"
 * tends to just work: the top level may be a `{ name, questions }` object or a
 * bare array; difficulty/topic are optional; the correct answer may be given as
 * an index, an option letter ("A"), or the exact option text. Anything that
 * can't be salvaged is skipped with a human-readable reason rather than
 * failing the whole import.
 */

export interface ParseResult {
  pack: QuestionPack | null;
  errors: string[];
  warnings: string[];
  accepted: number;
  skipped: number;
}

const DIFFICULTIES: Difficulty[] = ['medium', 'hard', 'expert'];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

/** Turn "Anatomy — Midterm 1" into a stable-ish id fragment. */
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'pack'
  );
}

function newPackId(name: string): string {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normaliseDifficulty(value: unknown): Difficulty {
  const v = asString(value).toLowerCase();
  return (DIFFICULTIES as string[]).includes(v) ? (v as Difficulty) : 'medium';
}

/**
 * Accept an image only if it is a usable web/data source. Anything else (a bare
 * filename, a relative path, junk) is dropped so the UI never renders a broken
 * `<img>`.
 */
function normaliseImage(value: unknown): string | undefined {
  const v = asString(value);
  if (!v) return undefined;
  return /^(https?:\/\/|data:image\/)/i.test(v) ? v : undefined;
}

/**
 * Resolve the correct-answer index from the several shapes an AI might emit:
 * a number index, a letter ("A"/"b"), or the exact option text. Returns -1 if
 * it can't be resolved.
 */
function resolveCorrectIndex(raw: Record<string, unknown>, options: string[]): number {
  const candidate = raw.correctIndex ?? raw.correct ?? raw.answer ?? raw.answerIndex;

  // Numeric index (accept numeric strings too).
  if (typeof candidate === 'number' && Number.isInteger(candidate)) return candidate;
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();

    // Pure number as string, e.g. "2".
    if (/^\d+$/.test(trimmed)) return Number(trimmed);

    // Single letter, e.g. "A" / "c".
    if (/^[a-zA-Z]$/.test(trimmed)) {
      return trimmed.toUpperCase().charCodeAt(0) - 65; // A -> 0
    }

    // Exact option text (case-insensitive).
    const byText = options.findIndex((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (byText !== -1) return byText;
  }
  return -1;
}

/** Normalise one raw entry into a Question, or return why it was rejected. */
function normaliseQuestion(
  raw: unknown,
  id: number,
): { question: Question } | { reason: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { reason: 'entry is not an object' };
  }
  const obj = raw as Record<string, unknown>;

  const text = asString(obj.question ?? obj.prompt ?? obj.q);
  if (!text) return { reason: 'missing "question" text' };

  const rawOptions = obj.options ?? obj.choices ?? obj.answers;
  if (!Array.isArray(rawOptions)) return { reason: `"${text.slice(0, 40)}…" has no options array` };

  const options = rawOptions.map((o) => asString(o)).filter((o) => o.length > 0);
  if (options.length < MIN_OPTIONS) {
    return { reason: `"${text.slice(0, 40)}…" needs at least ${MIN_OPTIONS} options` };
  }
  const trimmedOptions = options.slice(0, MAX_OPTIONS);

  const correctIndex = resolveCorrectIndex(obj, trimmedOptions);
  if (correctIndex < 0 || correctIndex >= trimmedOptions.length) {
    return { reason: `"${text.slice(0, 40)}…" has an out-of-range or missing correct answer` };
  }

  const question: Question = {
    id,
    question: text,
    options: trimmedOptions,
    correctIndex,
    difficulty: normaliseDifficulty(obj.difficulty ?? obj.level),
    topic: asString(obj.topic ?? obj.subject ?? obj.category) || 'General',
    explanation: asString(obj.explanation ?? obj.rationale ?? obj.reason) || undefined,
    image: normaliseImage(obj.image ?? obj.imageUrl ?? obj.img ?? obj.picture),
    imageAlt: asString(obj.imageAlt ?? obj.alt ?? obj.caption) || undefined,
  };
  return { question };
}

/** Extract `{ meta, rawQuestions }` from either an object or a bare array. */
function unwrap(data: unknown): { meta: Record<string, unknown>; rawQuestions: unknown[] } | null {
  if (Array.isArray(data)) return { meta: {}, rawQuestions: data };
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const list = obj.questions ?? obj.items ?? obj.mcqs;
    if (Array.isArray(list)) return { meta: obj, rawQuestions: list };
  }
  return null;
}

export function parsePackInput(raw: string, fallbackName = 'Imported Pack'): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmed = raw.trim();
  if (!trimmed) {
    return { pack: null, errors: ['Nothing to import — the text is empty.'], warnings, accepted: 0, skipped: 0 };
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return {
      pack: null,
      errors: ['That is not valid JSON. Paste the JSON the AI produced, or use the sample as a template.'],
      warnings,
      accepted: 0,
      skipped: 0,
    };
  }

  const unwrapped = unwrap(data);
  if (!unwrapped) {
    return {
      pack: null,
      errors: ['Expected an object with a "questions" array, or an array of questions.'],
      warnings,
      accepted: 0,
      skipped: 0,
    };
  }

  const { meta, rawQuestions } = unwrapped;
  const questions: Question[] = [];
  let nextId = 1;

  rawQuestions.forEach((entry, i) => {
    const result = normaliseQuestion(entry, nextId);
    if ('question' in result) {
      questions.push(result.question);
      nextId++;
    } else {
      warnings.push(`Skipped question ${i + 1}: ${result.reason}`);
    }
  });

  const accepted = questions.length;
  const skipped = rawQuestions.length - accepted;

  if (accepted === 0) {
    errors.push('No valid questions found in that pack.');
    return { pack: null, errors, warnings, accepted, skipped };
  }

  const name = asString(meta.name ?? meta.title) || fallbackName;
  const pack: QuestionPack = {
    id: newPackId(name),
    name,
    description: asString(meta.description) || undefined,
    author: asString(meta.author) || undefined,
    createdAt: Date.now(),
    questions,
  };

  return { pack, errors, warnings, accepted, skipped };
}
