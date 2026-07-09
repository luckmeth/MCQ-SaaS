import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { QuizState } from '../quizReducer';
import { formatTime } from '../utils';
import Confetti from './Confetti';
import ReviewItem from './ReviewItem';
import ScoreRing from './ScoreRing';

interface Props {
  state: QuizState;
  onRetry: () => void;
  onHome: () => void;
}

export default function ResultsScreen({ state, onRetry, onHome }: Props) {
  const { questions, answers, startTime, endTime } = state;

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      if (a === null) skipped++;
      else if (a === q.correctIndex) correct++;
      else wrong++;
    });
    const total = questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const seconds = Math.max(0, Math.round(((endTime ?? Date.now()) - startTime) / 1000));
    return { correct, wrong, skipped, total, pct, seconds };
  }, [questions, answers, startTime, endTime]);

  const celebrate = stats.pct >= 80;

  const headline =
    stats.pct >= 90
      ? 'Outstanding! 🏆'
      : stats.pct >= 80
        ? 'Brilliant work! 🎉'
        : stats.pct >= 60
          ? 'Solid effort 💪'
          : stats.pct >= 40
            ? 'Keep pushing 📚'
            : 'Time to review 🔬';

  const listContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {celebrate && <Confetti />}

      {/* score hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass flex flex-col items-center rounded-3xl border border-white/10 p-6 text-center shadow-card sm:p-8"
      >
        <p className="mb-4 text-2xl font-black text-white sm:text-3xl">{headline}</p>
        <ScoreRing percentage={stats.pct} />
        <p className="mt-4 text-white/60">
          You answered <span className="font-bold text-white">{stats.correct}</span> of{' '}
          <span className="font-bold text-white">{stats.total}</span> correctly
        </p>
      </motion.div>

      {/* stat tiles */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={listContainer}
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatTile label="Correct" value={stats.correct} tone="emerald" />
        <StatTile label="Wrong" value={stats.wrong} tone="rose" />
        <StatTile label="Skipped" value={stats.skipped} tone="amber" />
        <StatTile label="Time" value={formatTime(stats.seconds)} tone="cyan" />
      </motion.div>

      {/* actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={onRetry}
          className="flex-1 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-violet px-6 py-3.5 font-bold text-white shadow-glow"
        >
          ↻ Retry (reshuffle)
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={onHome}
          className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white/80 transition hover:bg-white/10"
        >
          ⌂ Home
        </motion.button>
      </div>

      {/* review */}
      <h3 className="mb-3 mt-10 text-lg font-bold text-white">Review · {stats.total} questions</h3>
      <motion.div
        initial="hidden"
        animate="show"
        variants={listContainer}
        className="space-y-3"
      >
        {questions.map((q, i) => (
          <ReviewItem key={q.id} question={q} userAnswer={answers[i]} index={i} />
        ))}
      </motion.div>
    </div>
  );
}

const toneMap: Record<string, string> = {
  emerald: 'text-emerald-300',
  rose: 'text-rose-300',
  amber: 'text-amber-300',
  cyan: 'text-accent-cyan',
};

function StatTile({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      className="glass rounded-2xl border border-white/10 p-4 text-center"
    >
      <p className={`text-2xl font-black tabular-nums sm:text-3xl ${toneMap[tone]}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
    </motion.div>
  );
}
