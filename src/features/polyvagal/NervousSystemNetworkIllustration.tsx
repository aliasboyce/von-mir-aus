/**
 * "Man versteht gar nicht was das sein soll"-Auftrag — complete
 * rebuild. The previous version only showed a small head+spine
 * fragment, which didn't read as a body at all. This shows a full,
 * simple front-facing human silhouette (head, torso, arms, legs) with
 * the spinal cord as a central trunk line and nerve branches radiating
 * out to the hands, feet, and torso — recognizable as "a body with a
 * nervous system running through it" at a glance. Original, simple
 * shapes in this app's own visual language, not a medical textbook
 * copy.
 */
export function NervousSystemNetworkIllustration() {
  return (
    <svg viewBox="0 0 240 300" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '240 / 300', maxWidth: 260, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* body silhouette, front-facing: head, neck, torso, arms, legs */}
      <circle cx="120" cy="34" r="22" fill="var(--color-surface-muted)" stroke="var(--color-text-faint)" strokeWidth="1.4" />
      <path
        d="M 108,54 L 108,68
           C 88,72 72,84 68,102 L 60,150
           L 72,152 L 82,110
           L 84,190 L 78,270 L 94,270 L 106,195
           L 114,195 L 126,270 L 142,270 L 136,190
           L 138,110 L 148,152 L 160,150 L 152,102
           C 148,84 132,72 112,68 L 112,54 Z"
        fill="var(--color-surface-muted)"
        stroke="var(--color-text-faint)"
        strokeWidth="1.4"
      />

      {/* central nervous system: brain + spinal cord, the trunk that
       * everything else branches from */}
      <ellipse cx="120" cy="34" rx="13" ry="11" fill="var(--color-primary)" opacity="0.3" />
      <line x1="120" y1="45" x2="120" y2="185" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />

      {/* peripheral nerves branching out to arms, legs, hands, feet —
       * this is the "signals travel through the whole body" part */}
      <path d="M 120,75 C 105,80 90,90 78,108" stroke="var(--color-accent-clay)" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M 78,108 C 72,124 68,138 65,150" stroke="var(--color-accent-clay)" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M 120,75 C 135,80 150,90 162,108" stroke="var(--color-accent-sky)" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M 162,108 C 168,124 172,138 175,150" stroke="var(--color-accent-sky)" strokeWidth="1.6" fill="none" opacity="0.8" />

      <path d="M 120,150 C 112,175 104,215 92,268" stroke="var(--color-accent-clay)" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M 120,150 C 128,175 136,215 148,268" stroke="var(--color-accent-sky)" strokeWidth="1.6" fill="none" opacity="0.8" />

      {/* small signal dots at the nerve endings, hands and feet */}
      <circle cx="65" cy="150" r="3.5" fill="var(--color-accent-clay)" />
      <circle cx="175" cy="150" r="3.5" fill="var(--color-accent-sky)" />
      <circle cx="92" cy="268" r="3.5" fill="var(--color-accent-clay)" />
      <circle cx="148" cy="268" r="3.5" fill="var(--color-accent-sky)" />

      {/* a few faint dots along the spine, suggesting signal flow */}
      <circle cx="120" cy="90" r="2" fill="var(--color-primary)" opacity="0.55" />
      <circle cx="120" cy="125" r="2" fill="var(--color-primary)" opacity="0.55" />
      <circle cx="120" cy="160" r="2" fill="var(--color-primary)" opacity="0.55" />

      <text x="120" y="292" textAnchor="middle" fontSize="10" fill="var(--color-text-faint)">Signale wandern durch den ganzen Körper</text>
    </svg>
  );
}
