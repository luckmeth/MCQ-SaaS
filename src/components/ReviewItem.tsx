import { motion } from 'framer-motion';
import type { Question } from '../types';
import { difficultyMeta } from '../utils';

interface Props {
  question: Question;
  userAnswer: number | null;
  index: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export default function ReviewItem({ question, userAnswer, index }: Props) {
  const correct = question.correctIndex;
  const isSkipped = userAnswer === null;
  const isCorrect = userAnswer === correct;
  const diff = difficultyMeta[question.difficulty];

  const statusRing = isCorrect
    ? 'border-emerald-400/40'
    : isSkipped
      ? 'border-white/15'
      : 'border-rose-400/40';

  return (
    <motion.div
      variants={itemVariants}
      className={`glass rounded-2xl border ${statusRing} p-4 sm:p-5`}
    >
      <div className="mb-3 flex items-start gap-3">
        <StatusIcon isCorrect={isCorrect} isSkipped={isSkipped} />
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/40">Q{index + 1}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/50 ring-1 ring-white/10">
              {question.topic}
            </span>
            <span className={`text-[10px] font-semibold ${diff.color}`}>{diff.label}</span>
          </div>
          <p className="text-sm font-semibold leading-snug text-white sm:text-base">{question.question}</p>
        </div>
      </div>

      <div className="space-y-1.5 pl-1">
        {question.options.map((opt, i) => {
          const isRight = i === correct;
          const isChosen = i === userAnswer;
          const base = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm';
          let tone = 'text-white/45';
          if (isRight) tone = 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30';
          else if (isChosen && !isRight) tone = 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30 line-through';

          return (
            <div key={i} className={`${base} ${tone}`}>
              <span className="grid h-5 w-5 flex-none place-items-center text-xs">
                {isRight ? '✓' : isChosen ? '✕' : '·'}
              </span>
              <span className="min-w-0">{opt}</span>
              {isChosen && !isRight && (
                <span className="ml-auto flex-none text-[10px] font-bold uppercase text-rose-300/80">your pick</span>
              )}
            </div>
          );
        })}
      </div>

      {isSkipped && (
        <p className="mt-2 pl-1 text-xs font-medium text-amber-300/80">⏭ Skipped — no answer submitted</p>
      )}

      {question.explanation && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/55">
          <span className="font-semibold text-white/70">Why: </span>
          {question.explanation}
        </p>
      )}
    </motion.div>
  );
}

function StatusIcon({ isCorrect, isSkipped }: { isCorrect: boolean; isSkipped: boolean }) {
  const cls = isCorrect
    ? 'bg-emerald-500/20 text-emerald-300'
    : isSkipped
      ? 'bg-white/10 text-white/50'
      : 'bg-rose-500/20 text-rose-300';
  return (
    <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg text-sm font-bold ${cls}`}>
      {isCorrect ? '✓' : isSkipped ? '–' : '✕'}
    </span>
  );
}
