import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizAction, QuizState } from '../quizReducer';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import TimerRing from './TimerRing';
import { CrossIcon } from './icons';

interface Props {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  timerEnabled: boolean;
  questionSeconds: number;
  onQuit: () => void;
}

const AUTO_ADVANCE_MS = 600;

export default function QuizScreen({ state, dispatch, timerEnabled, questionSeconds, onQuit }: Props) {
  const { questions, currentIndex, answers } = state;
  const question = questions[currentIndex];
  const selected = answers[currentIndex];
  const locked = selected !== null;

  const [remaining, setRemaining] = useState(questionSeconds);
  const advanceTimer = useRef<number>();

  // Advance forward once (used by both answer-lock and timeout).
  const goNext = useCallback(() => dispatch({ type: 'ADVANCE' }), [dispatch]);

  // Reset the per-question countdown whenever we move to a new question.
  useEffect(() => {
    setRemaining(questionSeconds);
  }, [currentIndex, questionSeconds]);

  // Countdown ticker (only while unanswered and timer is on).
  useEffect(() => {
    if (!timerEnabled || locked) return;
    if (remaining <= 0) {
      goNext(); // time up → auto-skip, answer stays null
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining, locked, timerEnabled, goNext]);

  const handleSelect = (choice: number) => {
    if (locked) return;
    dispatch({ type: 'ANSWER', choice });
    advanceTimer.current = window.setTimeout(goNext, AUTO_ADVANCE_MS);
  };

  // Clean up the pending auto-advance if the component unmounts mid-timeout.
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-4 py-6 sm:py-10">
      {/* top bar */}
      <div className="mb-6 flex items-center gap-3 sm:gap-4">
        <button
          onClick={onQuit}
          className="flex flex-none items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
          aria-label="Quit quiz"
        >
          <CrossIcon className="h-3.5 w-3.5" />
          Quit
        </button>
        <div className="flex-1">
          <ProgressBar current={currentIndex + 1} total={questions.length} />
        </div>
        {timerEnabled && <TimerRing remaining={remaining} total={questionSeconds} />}
      </div>

      {/* question */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <QuestionCard question={question} selected={selected} locked={locked} onSelect={handleSelect} />
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Answers are locked when selected · correct answers are revealed at the end
      </p>
    </div>
  );
}
