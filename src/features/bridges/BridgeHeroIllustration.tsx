/**
 * "Materialien"-Auftrag, Section 7 — a real, warm illustration at the
 * top of the Bridges page rather than an icon: two riverbanks and an
 * arched bridge between them, symbolizing "von hier → über eine
 * Brücke → dorthin". Deliberately simple and calm — organic curves,
 * the app's own warm palette, a small dot walking the arch to suggest
 * gentle movement rather than a static diagram.
 */
export function BridgeHeroIllustration() {
  return (
    <svg viewBox="0 0 320 140" width="100%" role="img" aria-hidden="true" style={{ display: 'block', aspectRatio: '320 / 140', maxWidth: 480, margin: '0 auto' }}>
      {/* sky */}
      <rect x="0" y="0" width="320" height="140" fill="var(--color-surface-muted)" rx="16" />
      {/* soft sun glow */}
      <circle cx="260" cy="30" r="22" fill="var(--color-accent-sun)" opacity="0.25" />
      <circle cx="260" cy="30" r="12" fill="var(--color-accent-sun)" opacity="0.4" />

      {/* left riverbank */}
      <path d="M0,95 Q40,80 80,95 L80,140 L0,140 Z" fill="var(--color-accent-clay)" opacity="0.55" />
      {/* right riverbank */}
      <path d="M240,95 Q280,80 320,95 L320,140 L240,140 Z" fill="var(--color-accent-clay)" opacity="0.55" />
      {/* water */}
      <path d="M80,105 Q160,120 240,105 L240,140 L80,140 Z" fill="var(--color-accent-sky)" opacity="0.35" />

      {/* bridge arch */}
      <path
        d="M55,100 Q160,20 265,100"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* bridge deck supports */}
      <line x1="95" y1="72" x2="95" y2="100" stroke="var(--color-primary)" strokeWidth="3" opacity="0.5" />
      <line x1="160" y1="52" x2="160" y2="100" stroke="var(--color-primary)" strokeWidth="3" opacity="0.5" />
      <line x1="225" y1="72" x2="225" y2="100" stroke="var(--color-primary)" strokeWidth="3" opacity="0.5" />

      {/* a small figure, partway across — gentle movement, not a finish line */}
      <circle cx="160" cy="47" r="6" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2.5" />
    </svg>
  );
}
