import { motion } from 'framer-motion';

interface Props {
  /** seconds remaining */
  remaining: number;
  total: number;
  size?: number;
}

/**
 * Animated countdown ring. The stroke shrinks as time runs out and
 * shifts from cyan → amber → rose in the final seconds.
 */
export default function TimerRing({ remaining, total, size = 52 }: Props) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, remaining) / total;

  const color = remaining <= 5 ? '#fb7185' : remaining <= 10 ? '#fbbf24' : '#22d3ee';

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - frac), stroke: color }}
          transition={{ strokeDashoffset: { duration: 1, ease: 'linear' }, stroke: { duration: 0.4 } }}
        />
      </svg>
      <span
        className="absolute tabular-nums text-sm font-bold"
        style={{ color }}
      >
        {Math.max(0, remaining)}
      </span>
    </div>
  );
}
