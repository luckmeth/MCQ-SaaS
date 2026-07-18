import { motion } from 'framer-motion';
import type { Question } from '../types';
import { metaFor } from '../utils';

interface Props {
  question: Question;
  selected: number | null;
  locked: boolean;
  onSelect: (index: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, selected, locked, onSelect }: Props) {
  const diff = metaFor(question.difficulty);

  return (
    <div className="glass rounded-3xl border border-white/10 p-5 shadow-card sm:p-7">
      {/* meta badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-400 ring-1 ring-brand-400/30">
          {question.topic}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${diff.ring} ${diff.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
          {diff.label}
        </span>
      </div>

      <h2 className="text-balance text-lg font-bold leading-snug text-white sm:text-2xl">
        {question.question}
      </h2>

      {question.image && (
        <figure className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <img
            src={question.image}
            alt={question.imageAlt ?? 'Figure for this question'}
            loading="lazy"
            className="mx-auto max-h-72 w-full object-contain"
          />
          {question.imageAlt && (
            <figcaption className="px-4 py-2 text-center text-xs text-white/40">
              {question.imageAlt}
            </figcaption>
          )}
        </figure>
      )}

      <div className="mt-6 grid gap-3">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onSelect(i)}
              whileHover={locked ? undefined : { scale: 1.015 }}
              whileTap={locked ? undefined : { scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={[
                'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4',
                isSelected
                  ? 'border-brand-400/70 bg-brand-500/20 shadow-glow'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]',
                locked && !isSelected ? 'opacity-50' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-bold transition-colors',
                  isSelected ? 'bg-brand-400 text-base-900' : 'bg-white/10 text-white/70 group-hover:bg-white/15',
                ].join(' ')}
              >
                {OPTION_LABELS[i]}
              </span>
              <span className="text-sm font-medium text-white/90 sm:text-base">{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
