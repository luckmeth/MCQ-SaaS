import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → target over `duration` ms using an
 * ease-out curve. Used by the results score ring.
 */
export function useCountUp(target: number, duration = 1400, startDelay = 300): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    let start: number | null = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOut(progress) * target));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    const timer = window.setTimeout(() => {
      frame.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      window.clearTimeout(timer);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, startDelay]);

  return value;
}
