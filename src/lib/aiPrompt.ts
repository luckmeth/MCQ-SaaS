import type { QuestionPack } from '../types';

/**
 * Everything that makes generating a new "cartridge" foolproof: a ready-to-paste
 * prompt for any AI, a valid sample pack to use as a template, and small helpers
 * to serialise / download packs.
 */

/** A minimal, valid pack the user can download and copy from. */
export const SAMPLE_PACK: QuestionPack = {
  id: 'sample',
  name: 'Sample Pack — Human Body',
  description: 'A tiny example showing the exact format. Replace these with your own questions.',
  author: 'MJ Technology Solutions',
  createdAt: 0,
  questions: [
    {
      id: 1,
      topic: 'Skeletal System',
      difficulty: 'medium',
      question: 'Which is the largest bone in the human body?',
      options: ['Femur', 'Tibia', 'Humerus', 'Fibula'],
      correctIndex: 0,
      explanation: 'The femur (thigh bone) is the longest and strongest bone in the body.',
    },
    {
      id: 2,
      topic: 'Circulatory System',
      difficulty: 'medium',
      question: 'How many chambers does the human heart have?',
      options: ['Two', 'Three', 'Four', 'Five'],
      correctIndex: 2,
      explanation: 'Two atria and two ventricles make four chambers.',
    },
    {
      id: 3,
      topic: 'Nervous System',
      difficulty: 'hard',
      question: 'Which part of the brain regulates balance and coordination?',
      options: ['Cerebrum', 'Cerebellum', 'Medulla oblongata', 'Hypothalamus'],
      correctIndex: 1,
      explanation: 'The cerebellum fine-tunes motor activity, posture and balance.',
    },
  ],
};

/**
 * The prompt the user copies into any AI. It pins the exact schema and forbids
 * prose, so the output can be pasted straight into the importer.
 */
export const AI_PROMPT = `You are generating a multiple-choice quiz pack for a quiz app.

Output ONLY valid JSON — no markdown, no code fences, no commentary before or after.

Use exactly this shape:

{
  "name": "<a short title for this pack>",
  "description": "<one-line description>",
  "questions": [
    {
      "question": "<the question text>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctIndex": <0-based index of the correct option>,
      "difficulty": "medium" | "hard" | "expert",
      "topic": "<short subject label>",
      "explanation": "<one sentence explaining the correct answer>",
      "image": "<optional https:// image URL for a diagram/figure, or omit>",
      "imageAlt": "<optional short caption for the image>"
    }
  ]
}

Rules:
- Provide 3 or 4 options per question.
- "correctIndex" is the position of the correct option (0 = first option).
- Every question must have exactly one correct answer.
- Keep questions accurate and unambiguous.
- "image"/"imageAlt" are optional. Add an image only when a diagram genuinely
  helps (anatomy, diagrams, micrographs). Use a real, publicly reachable
  https:// URL — never a made-up link or a local file path.

Now generate 20 questions about: <REPLACE WITH YOUR TOPIC>`;

/** Pretty-printed JSON for a pack, stripped of the runtime-only `id`. */
export function packToJson(pack: QuestionPack): string {
  const exportable = {
    name: pack.name,
    description: pack.description,
    author: pack.author,
    questions: pack.questions.map(({ id: _id, ...rest }) => rest),
    // `rest` keeps every authoring field (topic, difficulty, explanation,
    // image, imageAlt, …) so a round-tripped export re-imports identically.
  };
  return JSON.stringify(exportable, null, 2);
}

/** Trigger a client-side download of `text` as `filename`. */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
