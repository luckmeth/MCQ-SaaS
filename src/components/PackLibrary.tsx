import { motion } from 'framer-motion';
import type { QuestionPack } from '../types';
import { DnaIcon, LibraryIcon, PlusIcon, TrashIcon } from './icons';

interface Props {
  packs: QuestionPack[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
}

/** The "shelf of cartridges" — choose the active pack, delete, or import a new one. */
export default function PackLibrary({ packs, activeId, onSelect, onDelete, onImport }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <LibraryIcon className="h-4 w-4 text-brand-400" />
        <label className="text-sm font-semibold text-white/70">Question pack</label>
      </div>

      <div className="space-y-2">
        {packs.map((pack) => {
          const active = pack.id === activeId;
          return (
            <motion.div
              key={pack.id}
              whileTap={{ scale: 0.99 }}
              className={[
                'flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors',
                active
                  ? 'border-brand-400/70 bg-brand-500/15 shadow-glow'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelect(pack.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className={[
                    'grid h-9 w-9 flex-none place-items-center rounded-xl transition-colors',
                    active ? 'bg-brand-400 text-base-900' : 'bg-white/10 text-white/70',
                  ].join(' ')}
                >
                  <DnaIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{pack.name}</span>
                    {pack.builtin && (
                      <span className="flex-none rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                        Built-in
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-white/45">
                    {pack.questions.length} question{pack.questions.length === 1 ? '' : 's'}
                    {pack.description ? ` · ${pack.description}` : ''}
                  </span>
                </span>
              </button>

              {/* selected marker */}
              <span
                className={[
                  'grid h-5 w-5 flex-none place-items-center rounded-full border transition-colors',
                  active ? 'border-brand-400 bg-brand-400' : 'border-white/25',
                ].join(' ')}
                aria-hidden
              >
                {active && <span className="h-2 w-2 rounded-full bg-base-900" />}
              </span>

              {!pack.builtin && (
                <button
                  type="button"
                  onClick={() => onDelete(pack.id)}
                  aria-label={`Delete ${pack.name}`}
                  className="flex-none rounded-lg p-1.5 text-white/40 transition hover:bg-rose-500/15 hover:text-rose-300"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onImport}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white/60 transition hover:border-brand-400/50 hover:text-white"
      >
        <PlusIcon className="h-4 w-4" />
        Import new pack
      </button>
    </div>
  );
}
