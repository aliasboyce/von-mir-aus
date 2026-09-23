import { useMemo } from 'react';
import { bandForValue } from './arousalBands';

/**
 * "Lebendiger machen — Nervensystem-Seite als Wasser-Bild"-Auftrag —
 * calm, still water at low arousal (ventral), increasingly choppy,
 * faster-moving water the higher the value climbs toward the
 * activated end. Not a second way to read the number (the slider and
 * its color already do that) — just makes the felt quality of "ruhig"
 * vs. "aufgewühlt" something you see move, not just a static color
 * band. Purely decorative, positioned behind/below the slider.
 */
export function NervousSystemWave({ value }: { value: number }) {
  const band = bandForValue(value);
  // amplitude and speed both scale with how far into the range we are —
  // 0 = a near-flat, slow line; 100 = a tall, fast, choppy one.
  const t = Math.max(0, Math.min(1, value / 100));
  const amplitude = 2 + t * 14;
  const duration = 5 - t * 3.2; // seconds per drift cycle — faster when more aroused
  const waveCount = 2 + Math.round(t * 3); // more, tighter peaks when more aroused

  const path = useMemo(() => {
    const width = 400;
    const height = 40;
    const mid = height / 2;
    const step = width / (waveCount * 2);
    let d = `M -100 ${mid}`;
    for (let i = 0; i <= waveCount * 2 + 2; i++) {
      const x = -100 + i * step;
      const y = mid + (i % 2 === 0 ? amplitude : -amplitude);
      d += ` Q ${x - step / 2} ${y} ${x} ${mid}`;
    }
    return d;
  }, [amplitude, waveCount]);

  return (
    <div className="w-full h-10 overflow-hidden rounded-[var(--radius-md)]" aria-hidden="true" style={{ background: `${band.color}0f` }}>
      <svg viewBox="0 0 200 40" width="200%" height="100%" preserveAspectRatio="none" style={{ animation: `wave-drift ${duration}s linear infinite` }}>
        <path d={path} fill="none" stroke={band.color} strokeWidth="2" opacity="0.55" strokeLinecap="round" />
      </svg>
    </div>
  );
}
