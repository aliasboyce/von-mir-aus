/**
 * "Visueller Timer wie das verlinkte Produkt, regenbogenfarben"-Auftrag
 * — the classic "Time Timer" mechanism: a colored disk where the
 * remaining time is a wedge that visibly shrinks clockwise as the
 * clock runs, rather than only a digital countdown. Built with two
 * stacked conic-gradients instead of SVG arcs — much simpler to keep
 * in sync with a live "elapsed" fraction, and CSS conic-gradient
 * already starts at 12 o'clock and runs clockwise, exactly like a
 * clock face: a rainbow wheel underneath, and a second conic-gradient
 * on top that's background-colored for the elapsed portion and
 * transparent for the remaining portion — so what's left of the
 * rainbow IS the remaining time, visually.
 */
const RAINBOW_STOPS = [
  '#e0524a', // red
  '#e08a3b', // orange
  '#e0c93b', // yellow
  '#6fb85c', // green
  '#4a8fe0', // blue
  '#8a5cc9', // violet
  '#e0524a', // back to red, closing the wheel
];

export function VisualCountdown({ elapsedFraction, size = 96 }: { elapsedFraction: number; size?: number }) {
  const clamped = Math.max(0, Math.min(1, elapsedFraction));
  const elapsedDeg = clamped * 360;
  const rainbowGradient = `conic-gradient(${RAINBOW_STOPS.map((c, i) => `${c} ${(i / (RAINBOW_STOPS.length - 1)) * 360}deg`).join(', ')})`;
  const coverGradient = `conic-gradient(var(--color-surface) 0deg, var(--color-surface) ${elapsedDeg}deg, transparent ${elapsedDeg}deg, transparent 360deg)`;

  return (
    <div
      className="relative rounded-full"
      style={{ width: size, height: size, background: rainbowGradient }}
      role="img"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full" style={{ background: coverGradient, transition: 'background 0.9s linear' }} />
      {/* small center disk so the wedge reads as a ring-ish shape close
       * to the reference product rather than a full pie the whole time */}
      <div
        className="absolute rounded-full"
        style={{ inset: size * 0.22, background: 'var(--color-surface)' }}
      />
    </div>
  );
}
