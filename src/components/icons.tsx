import type { SVGProps } from 'react';

/**
 * Biomedical-science icon set. All icons inherit `currentColor` and use a
 * 24×24 viewBox so they scale cleanly. No emoji anywhere in the app.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** DNA double helix — the app mark. */
export function DnaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3c0 4.5 10 5.5 10 9s-10 4.5-10 9" />
      <path d="M17 3c0 4.5-10 5.5-10 9s10 4.5 10 9" />
      <path d="M8.5 6h7M8 9h8M8 15h8M8.5 18h7" />
    </svg>
  );
}

/** Molecule / atom node graph. */
export function MoleculeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <circle cx="12" cy="6" r="2.2" />
      <path d="M11 7.6 7 16.2M13 7.6l4 8.6M8.2 18h7.6" />
    </svg>
  );
}

/** Microscope — study / review. */
export function MicroscopeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 18h12M8 21h8" />
      <path d="M11 4.5 8.5 6.7l3.4 3.9 2.5-2.2a2.6 2.6 0 0 0-3.4-3.9Z" />
      <path d="M9.4 9 7 11.2" />
      <path d="M9 18a6 6 0 0 0 8-5.6" />
    </svg>
  );
}

/** Beaker / flask. */
export function FlaskIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3h6M10 3v5.5L5.6 17a2 2 0 0 0 1.8 3h9.2a2 2 0 0 0 1.8-3L14 8.5V3" />
      <path d="M7.5 14h9" />
    </svg>
  );
}

/** Heartbeat / pulse line. */
export function PulseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12h4l2.5-6 4 13 2.5-7H22" />
    </svg>
  );
}

/** Solid heart (for the credit line — a shape, not the emoji). */
export function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
    </svg>
  );
}

/** Check mark. */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5 9 17l10.5-11" />
    </svg>
  );
}

/** Cross / X. */
export function CrossIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** En-dash / minus (skipped state). */
export function DashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 12h12" />
    </svg>
  );
}

/** Skip-forward. */
export function SkipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 5v14l9-7z" />
      <path d="M18 5v14" />
    </svg>
  );
}

/** Circular retry arrow. */
export function RetryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 1 0-1.9 6.3" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

/** Home. */
export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

/** Trophy — top scores. */
export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M10 21v-1.5a2 2 0 0 1 4 0V21" />
    </svg>
  );
}

/** Award ribbon / spark. */
export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z" />
    </svg>
  );
}
