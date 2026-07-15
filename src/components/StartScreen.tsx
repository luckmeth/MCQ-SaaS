import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Question, QuestionPack } from '../types';
import type { QuizConfig } from '../utils';
import { difficultyMeta } from '../utils';
import Credit from './Credit';
import ImportPackModal from './ImportPackModal';
import PackLibrary from './PackLibrary';
import ResultsHistoryModal from './ResultsHistoryModal';
import { DnaIcon, HistoryIcon } from './icons';

interface Props {
  bank: readonly Question[];
  packs: QuestionPack[];
  activeId: string;
  studentName: string;
  onStudentNameChange: (name: string) => void;
  onSelectPack: (id: string) => void;
  onDeletePack: (id: string) => void;
  onImportPack: (pack: QuestionPack) => void;
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

export default function StartScreen({
  bank,
  packs,
  activeId,
  studentName,
  onStudentNameChange,
  onSelectPack,
  onDeletePack,
  onImportPack,
  onStart,
}: Props) {
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState<string | 'All'>('All');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const nameMissing = !studentName.trim();

  const activePack = packs.find((p) => p.id === activeId);

  // Reset filters whenever the active pack changes — topics differ per pack.
  useEffect(() => {
    setTopic('All');
    setDifficulty('All');
  }, [activeId]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    bank.forEach((q) => set.add(q.topic));
    return ['All', ...Array.from(set)];
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
      <motion.div variants={item} className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow">
            <DnaIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-400">Biomedical Science · Quiz Arena</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="flex flex-none items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-white/25 hover:text-white"
        >
          <HistoryIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Results history</span>
        </button>
      </motion.div>

      <motion.h1 variants={item} className="text-4xl font-black leading-[1.05] sm:text-6xl">
        <span className="text-white/90">Ena&rsquo;s </span>
        <span className="text-gradient">BioChem Arena</span>
      </motion.h1>
      <motion.p variants={item} className="mt-4 max-w-lg text-white/60 sm:text-lg">
        {activePack && !activePack.builtin ? (
          <>
            Playing <span className="font-semibold text-white">{activePack.name}</span> —{' '}
            <span className="font-semibold text-white">{bank.length}</span>{' '}
            question{bank.length === 1 ? '' : 's'}. Load a different pack any time; every run reshuffles.
          </>
        ) : (
          <>
            Test yourself against <span className="font-semibold text-white">{bank.length}</span> medium-to-expert
            questions across biochemistry — or import your own pack and play any subject. Every run reshuffles for
            a fresh challenge.
          </>
        )}
      </motion.p>

      {/* config panel */}
      <motion.div variants={item} className="glass mt-8 space-y-6 rounded-3xl border border-white/10 p-5 shadow-card sm:p-6">
        {/* student name */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">Your name</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => onStudentNameChange(e.target.value)}
            placeholder="Enter your name"
            maxLength={60}
            className="w-full rounded-2xl border border-white/10 bg-base-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-brand-400/60"
          />
          <p className="mt-1.5 text-xs text-white/40">Needed so your result can be saved to the history.</p>
        </div>

        <div className="h-px bg-white/10" />

        {/* pack library */}
        <PackLibrary
          packs={packs}
          activeId={activeId}
          onSelect={onSelectPack}
          onDelete={onDeletePack}
          onImport={() => setImportOpen(true)}
        />

        <div className="h-px bg-white/10" />

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
        disabled={available === 0 || nameMissing}
        onClick={() => onStart({ count: effectiveCount, topic, difficulty }, timerEnabled)}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-accent-violet px-6 py-4 text-lg font-bold text-white shadow-glow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {available === 0 ? 'No questions match' : nameMissing ? 'Enter your name to start' : `Start Quiz · ${effectiveCount} questions`}
      </motion.button>
      <motion.p variants={item} className="mt-3 text-center text-xs text-white/40">
        {available} questions available with the current filters
      </motion.p>

      <motion.div variants={item} className="mt-8">
        <Credit />
      </motion.div>

      <ImportPackModal open={importOpen} onClose={() => setImportOpen(false)} onImport={onImportPack} />
      <ResultsHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
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
