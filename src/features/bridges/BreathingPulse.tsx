/**
 * "Lebendiger machen — Atemuebungen"-Auftrag — a slow, rhythmic pulse
 * synced to the specific breathing pattern the bridge's own title
 * names, shown behind the timer countdown. Detected from the label
 * text itself rather than a new data field, since the pattern is
 * already right there in every breathing bridge's name (matching the
 * existing German titles: "4-7-8 Atmung", "Box-Atmung", etc.) — no
 * bridge content needed to change for this to work. Purely ambient:
 * doesn't replace the step instructions, just gives the waiting time
 * an actual rhythm to settle into.
 */
export type BreathingPattern = 'atem478' | 'box' | 'simple' | null;

export function breathingPatternFor(label: string): BreathingPattern {
  const l = label.toLowerCase();
  const isBreathing = l.includes('atmung') || l.includes('atem') || l.includes('seufzer');
  if (!isBreathing) return null;
  if (l.includes('4-7-8') || l.includes('478')) return 'atem478';
  if (l.includes('box')) return 'box';
  return 'simple';
}

const ANIMATIONS: Record<Exclude<BreathingPattern, null>, string> = {
  atem478: 'breathe-478 19s ease-in-out infinite',
  box: 'breathe-box 16s ease-in-out infinite',
  simple: 'breathe-simple 8s ease-in-out infinite',
};

export function BreathingPulse({ pattern }: { pattern: Exclude<BreathingPattern, null> }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <div
        className="rounded-full"
        style={{
          width: 130,
          height: 130,
          background: 'radial-gradient(circle, var(--color-primary-soft) 0%, transparent 72%)',
          animation: ANIMATIONS[pattern],
        }}
      />
    </div>
  );
}
