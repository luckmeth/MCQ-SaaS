export type Difficulty = 'medium' | 'hard' | 'expert';

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
 * Core data model. Kept intentionally flat and serialisable so the local
 * question bank in `data/questions.ts` can later be swapped for an API
 * response with no changes to the UI layer.
 */
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  topic: Topic;
  /** Short rationale shown on the results review screen. */
  explanation?: string;
}
