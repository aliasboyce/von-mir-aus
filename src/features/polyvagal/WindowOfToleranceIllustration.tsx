import { useTr } from '../../hooks/useTr';
/**
 * "Nervensystem-Ausbau"-Auftrag — a visual answer to "Woher weiß ich,
 * in welchem Zustand ich gerade bin?". Built as an original SVG rather
 * than reproducing the reference slides shown (which carry a visible
 * Canva watermark and appear to be third-party training material, not
 * safe to copy directly) — same underlying concept (a "window of
 * tolerance" band with hyper-/hypoarousal above and below it), drawn
 * from scratch with this app's own visual language.
 *
 * The "window of tolerance" concept itself is usually attributed to
 * Dan Siegel, a related but distinct idea from Porges' polyvagal
 * theory — both are cited together in the accompanying text since
 * this illustration blends them for a practical, everyday picture.
 */
export function WindowOfToleranceIllustration() {
  const tr = useTr();
  return (
    <svg viewBox="0 0 320 200" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '320 / 200', maxWidth: 380, display: 'block', margin: '0 auto' }}>
      {/* hyperarousal zone (sympathetic) */}
      <rect x="10" y="10" width="300" height="55" rx="10" fill="var(--color-accent-sun)" opacity="0.18" />
      <text x="160" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">{tr('Aktiviert / angespannt', 'Activated / tense')}</text>
      <text x="160" y="48" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">{tr('z. B. Herzrasen, Unruhe, schnelle Gedanken', 'e.g. racing heart, restlessness, fast thoughts')}</text>

      {/* window of tolerance (ventral) */}
      <rect x="10" y="72" width="300" height="56" rx="10" fill="var(--color-primary)" opacity="0.16" />
      <text x="160" y="95" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-text)">{tr('Im grünen Bereich', 'In the green zone')}</text>
      <text x="160" y="112" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">{tr('ruhig, präsent, handlungsfähig', 'calm, present, able to act')}</text>

      {/* hypoarousal zone (dorsal) */}
      <rect x="10" y="135" width="300" height="55" rx="10" fill="var(--color-accent-sky)" opacity="0.2" />
      <text x="160" y="157" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">{tr('Zurückgezogen / abgeschaltet', 'Withdrawn / shut down')}</text>
      <text x="160" y="173" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">{tr('z. B. Leere, Taubheit, weit weg von sich', 'e.g. emptiness, numbness, far from yourself')}</text>
    </svg>
  );
}
