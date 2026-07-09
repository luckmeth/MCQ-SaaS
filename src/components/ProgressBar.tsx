import { motion } from 'framer-motion';

interface Props {
  current: number; // 1-based
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold tracking-wide text-white/80">
          Question <span className="text-white">{current}</span> of {total}
        </span>
        <span className="tabular-nums font-medium text-white/50">{pct}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 via-accent-violet to-accent-cyan shadow-glow"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
