import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Difficulty, Question, Topic } from '../types';
import type { QuizConfig } from '../utils';
import { difficultyMeta } from '../utils';
import Credit from './Credit';
import { DnaIcon } from './icons';

interface Props {
  bank: readonly Question[];
  onStart: (config: QuizConfig, timerEnabled: boolean) => void;
}

const COUNT_OPTIONS = [10, 20, 30, 50];
const DIFFICULTIES: (Difficulty | 'All')[] = ['All', 'medium', 'hard', 'expert'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

export default function StartScreen({ bank, onStart }: Props) {
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState<Topic | 'All'>('All');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [timerEnabled, setTimerEnabled] = useState(true);

  const topics = useMemo(() => {
    const set = new Set<Topic>();
    bank.forEach((q) => set.add(q.topic));
    return ['All', ...Array.from(set)] as (Topic | 'All')[];
  }, [bank]);

  // How many questions actually match the current filters.
  const available = useMemo(
    () =>
      bank.filter(
        (q) => (topic === 'All' || q.topic === topic) && (difficulty === 'All' || q.difficulty === difficulty),
      ).length,
    [bank, topic, difficulty],
  );

  const effectiveCount = Math.min(count, available);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-4 py-10"
    >
      <motion.div variants={item} className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow">
          <DnaIcon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-400">Biomedical Science · Quiz Arena</p>
        </div>
      </motion.div>

      <motion.h1 variants={item} className="text-4xl font-black leading-[1.05] sm:text-6xl">
        <span className="text-white/90">Ena&rsquo;s </span>
        <span className="text-gradient">BioChem Arena</span>
      </motion.h1>
      <motion.p variants={item} className="mt-4 max-w-lg text-white/60 sm:text-lg">
        Test yourself against <span className="font-semibold text-white">{bank.length}</span> medium-to-expert
        questions drawn from carbohydrates, lipids, proteins, enzymes, nucleic acids and metabolism. Every run
        reshuffles for a fresh challenge.
      </motion.p>

      {/* config panel */}
      <motion.div variants={item} className="glass mt-8 space-y-6 rounded-3xl border border-white/10 p-5 shadow-card sm:p-6">
        {/* number of questions */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">Number of questions</label>
          <div className="flex flex-wrap gap-2">
            {COUNT_OPTIONS.map((c) => (
              <Chip key={c} active={count === c} onClick={() => setCount(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {/* topic */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">Topic</label>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* difficulty */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                {d === 'All' ? 'All' : difficultyMeta[d].label}
              </Chip>
            ))}
          </div>
        </div>

        {/* timer toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">30-second timer</p>
            <p className="text-xs text-white/40">Auto-skips the question when time runs out</p>
          </div>
          <button
            role="switch"
            aria-checked={timerEnabled}
            onClick={() => setTimerEnabled((v) => !v)}
            className={`relative h-7 w-12 flex-none rounded-full transition-colors ${
              timerEnabled ? 'bg-brand-500' : 'bg-white/15'
            }`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
              style={{ left: timerEnabled ? 24 : 4 }}
            />
          </button>
        </div>
      </motion.div>

      {/* start */}
      <motion.button
        variants={item}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={available === 0}
        onClick={() => onStart({ count: effectiveCount, topic, difficulty }, timerEnabled)}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-accent-violet px-6 py-4 text-lg font-bold text-white shadow-glow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {available === 0 ? 'No questions match' : `Start Quiz · ${effectiveCount} questions`}
      </motion.button>
      <motion.p variants={item} className="mt-3 text-center text-xs text-white/40">
        {available} questions available with the current filters
      </motion.p>

      <motion.div variants={item} className="mt-8">
        <Credit />
      </motion.div>
    </motion.div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={[
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-brand-500 text-white shadow-glow'
          : 'bg-white/5 text-white/60 ring-1 ring-white/10 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}
