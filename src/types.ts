export type Difficulty = 'medium' | 'hard' | 'expert';

/**
 * The topics used by the built-in biochemistry bank. Kept only as an authoring
 * hint — `Question.topic` is a free `string` so imported packs can carry any
 * subject (anatomy, pharmacology, …) without touching this list.
 */
export type Topic =
  | 'Carbohydrates'
  | 'Lipids'
  | 'Proteins'
  | 'Protein Structure'
  | 'Enzymes'
  | 'DNA & RNA'
  | 'Genome Structure'
  | 'Glycolysis'
  | 'Gluconeogenesis & Glycogen';

/**
 * Core data model. Kept intentionally flat and serialisable so the question
 * bank can be swapped at runtime for an imported pack with no changes to the
 * UI layer.
 */
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  /** Free-form subject label; any string an imported pack provides. */
  topic: string;
  /** Short rationale shown on the results review screen. */
  explanation?: string;
}

/**
 * A "cartridge" — a self-contained, importable set of questions. The built-in
 * bank is exposed as one of these (`id: 'builtin'`), and users can import more
 * from AI-generated JSON. Persisted to localStorage as the player's library.
 */
export interface QuestionPack {
  /** `'builtin'` for the default pack; a slug assigned on import otherwise. */
  id: string;
  name: string;
  description?: string;
  author?: string;
  builtin?: boolean;
  createdAt: number;
  questions: Question[];
}

/** One completed quiz run, as recorded in the `attempts` table. */
export interface QuizAttempt {
  id: string;
  studentName: string;
  packId: string;
  packName: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  durationSeconds: number;
  createdAt: number;
}
