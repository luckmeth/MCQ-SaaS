import type { Question } from './types';

export type Status = 'idle' | 'active' | 'finished';

export interface QuizState {
  status: Status;
  questions: Question[];
  currentIndex: number;
  /** One slot per question. `null` means skipped / timed-out. */
  answers: (number | null)[];
  startTime: number;
  endTime: number | null;
}

export type QuizAction =
  | { type: 'START'; questions: Question[] }
  | { type: 'ANSWER'; choice: number }
  | { type: 'ADVANCE' }
  | { type: 'SKIP' }
  | { type: 'HOME' };

export const initialState: QuizState = {
  status: 'idle',
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: 0,
  endTime: null,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return {
        status: 'active',
        questions: action.questions,
        currentIndex: 0,
        answers: new Array(action.questions.length).fill(null),
        startTime: Date.now(),
        endTime: null,
      };

    case 'ANSWER': {
      // Lock the choice for the current question. Ignore if already answered.
      if (state.answers[state.currentIndex] !== null) return state;
      const answers = state.answers.slice();
      answers[state.currentIndex] = action.choice;
      return { ...state, answers };
    }

    case 'SKIP': // fallthrough → behaves like ADVANCE, leaving the answer null
    case 'ADVANCE': {
      const isLast = state.currentIndex >= state.questions.length - 1;
      if (isLast) {
        return { ...state, status: 'finished', endTime: Date.now() };
      }
      return { ...state, currentIndex: state.currentIndex + 1 };
    }

    case 'HOME':
      return { ...initialState };

    default:
      return state;
  }
}
