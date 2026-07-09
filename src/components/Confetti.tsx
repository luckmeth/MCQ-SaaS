import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#7c9cff', '#a78bfa', '#22d3ee', '#a3e635', '#f472b6', '#fbbf24'];

/**
 * Lightweight DOM/Framer-Motion confetti burst — no canvas, no deps.
 * Rendered only when the player scores highly, then falls under gravity.
 */
export default function Confetti({ pieces = 120 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.4 + Math.random() * 1.8,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 160,
        round: Math.random() > 0.5,
      })),
    [pieces],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.div
          key={b.id}
          className="absolute top-[-5%]"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.4,
            backgroundColor: b.color,
            borderRadius: b.round ? '9999px' : '2px',
          }}
          initial={{ y: '-10vh', x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: b.drift, rotate: b.rotate + 480, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: b.duration, delay: b.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
