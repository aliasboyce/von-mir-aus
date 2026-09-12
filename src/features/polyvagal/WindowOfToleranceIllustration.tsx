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
  return (
    <svg viewBox="0 0 320 200" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '320 / 200', maxWidth: 380, display: 'block', margin: '0 auto' }}>
      {/* hyperarousal zone (sympathetic) */}
      <rect x="10" y="10" width="300" height="55" rx="10" fill="var(--color-accent-sun)" opacity="0.18" />
      <text x="160" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">Aktiviert / angespannt</text>
      <text x="160" y="48" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">z. B. Herzrasen, Unruhe, schnelle Gedanken</text>

      {/* window of tolerance (ventral) */}
      <rect x="10" y="72" width="300" height="56" rx="10" fill="var(--color-primary)" opacity="0.16" />
      <text x="160" y="95" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-text)">Im grünen Bereich</text>
      <text x="160" y="112" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">ruhig, präsent, handlungsfähig</text>

      {/* hypoarousal zone (dorsal) */}
      <rect x="10" y="135" width="300" height="55" rx="10" fill="var(--color-accent-sky)" opacity="0.2" />
      <text x="160" y="157" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">Zurückgezogen / abgeschaltet</text>
      <text x="160" y="173" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">z. B. Leere, Taubheit, weit weg von sich</text>
    </svg>
  );
}
