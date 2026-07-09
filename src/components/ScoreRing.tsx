import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

interface Props {
  percentage: number;
  size?: number;
}

/**
 * Results score ring — the arc sweeps to the final percentage while the
 * centre label counts up from 0.
 */
export default function ScoreRing({ percentage, size = 220 }: Props) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const value = useCountUp(percentage);

  const grade =
    percentage >= 80 ? '#a3e635' : percentage >= 60 ? '#22d3ee' : percentage >= 40 ? '#fbbf24' : '#fb7185';

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c9cff" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor={grade} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - percentage / 100) }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black tabular-nums text-white sm:text-6xl">{value}%</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Score</span>
      </div>
    </div>
  );
}
