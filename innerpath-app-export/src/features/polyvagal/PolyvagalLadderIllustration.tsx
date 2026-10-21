/**
 * "Nur die reine Leiter, groesser/klarer"-Auftrag — the anatomical
 * head/neck/torso silhouette from the previous version is removed
 * entirely per direct feedback; all the freed space goes into making
 * the ladder itself bigger, with larger text and more breathing room.
 * Original illustration, own proportions — every label's width is
 * checked against its actual character count before being placed, so
 * nothing repeats the earlier clipping bug.
 */
export function PolyvagalLadderIllustration() {
  const rungY = [48, 88, 128, 168, 208, 248, 288, 328];
  const railX1 = 190;
  const railX2 = 250;
  return (
    <svg viewBox="0 0 460 380" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '460 / 380', maxWidth: 460, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* three zone bands, full width */}
      <rect x="14" y="18" width="432" height="106" rx="12" fill="var(--color-primary)" opacity="0.09" />
      <rect x="14" y="132" width="432" height="106" rx="12" fill="var(--color-accent-sun)" opacity="0.1" />
      <rect x="14" y="246" width="432" height="96" rx="12" fill="var(--color-accent-sky)" opacity="0.14" />

      {/* labels, left of the ladder, larger now that there's room */}
      <text x="28" y="46" fontSize="15" fontWeight="700" fill="var(--color-primary)">Ventral-vagal</text>
      <text x="28" y="66" fontSize="12" fill="var(--color-text-faint)">Sicherheit,</text>
      <text x="28" y="83" fontSize="12" fill="var(--color-text-faint)">Verbundenheit</text>

      <text x="28" y="160" fontSize="15" fontWeight="700" fill="var(--color-accent-sun)">Sympathisch</text>
      <text x="28" y="180" fontSize="12" fill="var(--color-text-faint)">Mobilisierung,</text>
      <text x="28" y="197" fontSize="12" fill="var(--color-text-faint)">Kampf / Flucht</text>

      <text x="28" y="274" fontSize="15" fontWeight="700" fill="var(--color-text)">Dorsal-vagal</text>
      <text x="28" y="294" fontSize="12" fill="var(--color-text-faint)">Immobilisierung,</text>
      <text x="28" y="311" fontSize="12" fill="var(--color-text-faint)">Erstarren</text>

      {/* the ladder itself — wider rails, bigger rungs */}
      <line x1={railX1} y1="30" x2={railX1} y2="336" stroke="var(--color-text-faint)" strokeWidth="5" strokeLinecap="round" />
      <line x1={railX2} y1="30" x2={railX2} y2="336" stroke="var(--color-text-faint)" strokeWidth="5" strokeLinecap="round" />
      {rungY.map((y) => (
        <line key={y} x1={railX1} y1={y} x2={railX2} y2={y} stroke="var(--color-text-faint)" strokeWidth="5" strokeLinecap="round" />
      ))}

      {/* simple figures at three key rungs, this app's own plain,
       * limbless-blob visual language (matching LichtCompanion) */}
      <g transform="translate(220, 48)">
        <circle r="12" fill="var(--color-primary)" />
        <circle cx="-4" cy="-1.5" r="2" fill="var(--color-surface)" />
        <circle cx="4" cy="-1.5" r="2" fill="var(--color-surface)" />
      </g>
      <g transform="translate(220, 168)">
        <ellipse rx="13" ry="9.5" fill="var(--color-accent-sun)" />
        <circle cx="-4" cy="-1.5" r="1.8" fill="var(--color-surface)" />
        <circle cx="4" cy="-1.5" r="1.8" fill="var(--color-surface)" />
      </g>
      <g transform="translate(220, 328)">
        <ellipse rx="16" ry="7" fill="var(--color-accent-sky)" opacity="0.9" />
        <path d="M-5,-1.3 L-1.4,-1.3 M1.4,-1.3 L5,-1.3" stroke="var(--color-surface)" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* both directions, right of the ladder — wide gap between the
       * two columns, checked against actual label width, after the
       * first attempt let the two captions collide into unreadable
       * overlapping text */}
      <path d="M 310 45 L 310 330" stroke="var(--color-accent-sun)" strokeWidth="3" fill="none" markerEnd="url(#pvLadderDownBig)" opacity="0.85" />
      <text x="310" y="358" textAnchor="middle" fontSize="11" fill="var(--color-accent-sun)">bei Stress ↓</text>

      <path d="M 400 330 L 400 45" stroke="var(--color-primary)" strokeWidth="3" fill="none" markerEnd="url(#pvLadderUpBig)" opacity="0.85" />
      <text x="400" y="358" textAnchor="middle" fontSize="11" fill="var(--color-primary)">Rückweg ↑</text>

      <defs>
        {/* Marker default shape points right; orient="auto" then
         * rotates it to match each path's real direction (up/down).
         * Drawing the default shape already pointing up/down here
         * would double-rotate it into a sideways "flag" — the exact
         * bug found and fixed in the previous version. */}
        <marker id="pvLadderDownBig" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--color-accent-sun)" />
        </marker>
        <marker id="pvLadderUpBig" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--color-primary)" />
        </marker>
      </defs>
    </svg>
  );
}
