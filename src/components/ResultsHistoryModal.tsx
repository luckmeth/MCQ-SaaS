import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { QuizAttempt } from '../types';
import { loadAttempts } from '../lib/resultsDb';
import { formatTime } from '../utils';
import { CrossIcon, HistoryIcon, LockIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

const RESULTS_PASSWORD = import.meta.env.VITE_RESULTS_PASSWORD;

function scoreTone(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500/15 text-emerald-300';
  if (pct >= 50) return 'bg-amber-500/15 text-amber-300';
  return 'bg-rose-500/15 text-rose-300';
}

/** Password-gated list of every student's quiz attempts, pulled from Supabase. */
export default function ResultsHistoryModal({ open, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const close = () => {
    onClose();
    setPassword('');
    setUnlocked(false);
    setLoading(false);
    setError(null);
    setAttempts([]);
  };

  const handleUnlock = async () => {
    if (!RESULTS_PASSWORD) {
      setError('Set VITE_RESULTS_PASSWORD in .env to enable results history.');
      return;
    }
    if (password !== RESULTS_PASSWORD) {
      setError('Incorrect password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setAttempts(await loadAttempts());
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const studentCount = new Set(attempts.map((a) => a.studentName.trim().toLowerCase())).size;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Results history"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-t-3xl border border-white/10 p-5 shadow-card sm:rounded-3xl sm:p-6"
          >
            {/* header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow">
                  <HistoryIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Results history</h2>
                  <p className="text-xs text-white/50">
                    {unlocked
                      ? `${attempts.length} attempt${attempts.length === 1 ? '' : 's'} · ${studentCount} student${studentCount === 1 ? '' : 's'}`
                      : 'Password protected'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="flex-none rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
              >
                <CrossIcon className="h-4 w-4" />
              </button>
            </div>

            {!unlocked ? (
              <div>
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
                  <LockIcon className="h-4 w-4 flex-none text-brand-400" />
                  Enter the results password to view every student&rsquo;s attempts.
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Password"
                  autoFocus
                  className="w-full rounded-2xl border border-white/10 bg-base-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-brand-400/60"
                />
                {error && <p className="mt-2 text-xs font-semibold text-rose-300">{error}</p>}
                <button
                  onClick={handleUnlock}
                  disabled={loading || !password}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-3 text-sm font-bold text-white shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Checking…' : 'Unlock'}
                </button>
              </div>
            ) : (
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {attempts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-white/40">No attempts recorded yet.</p>
                ) : (
                  attempts.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">{a.studentName}</span>
                        <span
                          className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreTone(a.percentage)}`}
                        >
                          {a.correct}/{a.total} · {a.percentage}%
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/45">
                        <span className="truncate">{a.packName}</span>
                        <span aria-hidden>·</span>
                        <span>{formatTime(a.durationSeconds)}</span>
                        <span aria-hidden>·</span>
                        <span>{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
