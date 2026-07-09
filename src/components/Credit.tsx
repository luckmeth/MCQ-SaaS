import { motion } from 'framer-motion';
import { HeartIcon } from './icons';

/**
 * "Made with love by MJ Technology Solutions" credit line.
 * The heart is an SVG shape with a soft beat animation — no emoji.
 */
export default function Credit({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-xs font-medium text-white/40 ${className}`}
    >
      <span>Made with</span>
      <motion.span
        aria-label="love"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="text-accent-pink"
      >
        <HeartIcon className="h-3.5 w-3.5" />
      </motion.span>
      <span>by</span>
      <span className="font-semibold text-white/70">MJ Technology Solutions</span>
    </div>
  );
}
