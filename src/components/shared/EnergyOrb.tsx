import { useId } from 'react';
import type { EnergyLevel } from '../../content/energyLevels';

/**
 * A small living picture of one energy level, so it can be FELT instead of
 * read: a round vessel with liquid whose height, wave size and tempo follow
 * the level. 1 = low, slow, heavy swell that hardly moves; 4 = high, quick,
 * bright waves with rising sparks. Pure SVG + CSS (see index.css, .eo-*);
 * "Animation reduzieren" stops the motion and leaves the still picture.
 */
const LOOK: Record<EnergyLevel, { fill: number; amp: number; dur: number; opacity: number; sparks: boolean }> = {
  1: { fill: 0.2, amp: 1.2, dur: 11, opacity: 0.5, sparks: false },
  2: { fill: 0.44, amp: 2.2, dur: 7, opacity: 0.65, sparks: false },
  3: { fill: 0.68, amp: 3.4, dur: 4.6, opacity: 0.8, sparks: false },
  4: { fill: 0.92, amp: 4.4, dur: 2.6, opacity: 0.95, sparks: true },
};

function wavePath(amp: number): string {
  const a = amp * 2;
  return `M0,0 Q12,${-a} 24,0 T48,0 T72,0 T96,0 T120,0 V60 H0 Z`;
}

export function EnergyOrb({ level, size = 44, active = false }: { level: EnergyLevel; size?: number; active?: boolean }) {
  const look = LOOK[level];
  const clipId = useId();
  const y = 46 - look.fill * 44;
  return (
    <span
      className={`eo ${active ? 'eo-active' : ''}`}
      style={{ width: size, height: size, ['--eo-dur' as string]: `${look.dur}s` }}
      aria-hidden="true"
    >
      {active && <span className="eo-ripple" />}
      <svg viewBox="0 0 48 48" width={size} height={size} className="eo-svg">
        <defs>
          <clipPath id={clipId}>
            <circle cx="24" cy="24" r="21.5" />
          </clipPath>
        </defs>
        <circle cx="24" cy="24" r="22" fill="var(--color-surface-muted)" stroke="var(--color-border)" strokeWidth="1.2" />
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(0 ${y + 1.5})`}>
            <g className="eo-wave eo-wave-back">
              <path d={wavePath(look.amp * 0.8)} fill="var(--color-primary)" opacity={look.opacity * 0.4} />
            </g>
          </g>
          <g transform={`translate(0 ${y})`}>
            <g className="eo-wave">
              <path d={wavePath(look.amp)} fill="var(--color-primary)" opacity={look.opacity} />
            </g>
          </g>
          {look.sparks && (
            <g className="eo-sparks">
              <circle className="eo-spark eo-spark-1" cx="16" cy="30" r="1.3" fill="#fff" />
              <circle className="eo-spark eo-spark-2" cx="26" cy="34" r="1.6" fill="#fff" />
              <circle className="eo-spark eo-spark-3" cx="34" cy="28" r="1.1" fill="#fff" />
            </g>
          )}
        </g>
      </svg>
    </span>
  );
}
