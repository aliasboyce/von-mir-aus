/**
 * "Volle Bahn von Erregung zu N fehlt"-Auftrag — genuine bug fixed:
 * the "Erregung" (arousal) axis was drawn far to the left, completely
 * disconnected from the N (neuroception) circle and the branching
 * structure — two visually unrelated pieces sharing one image. Fixed
 * by running the arousal axis directly UP from N itself, so the
 * picture reads as one continuous story: neuroception at the base,
 * arousal rising from it. N is now explicitly labelled "N = Neurozeption"
 * rather than a bare, unexplained letter.
 */
export function ArousalBranchIllustration() {
  return (
    <svg viewBox="0 0 320 250" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '320 / 250', maxWidth: 380, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* neuroception at the bottom, branching left (safe) and right (dangerous) */}
      <circle cx="165" cy="222" r="18" fill="var(--color-text-muted)" opacity="0.2" />
      <text x="165" y="227" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">N</text>
      <text x="165" y="246" textAnchor="middle" fontSize="9" fill="var(--color-text-faint)">N = Neurozeption</text>

      <line x1="153" y1="211" x2="110" y2="177" stroke="var(--color-primary)" strokeWidth="2" />
      <line x1="177" y1="211" x2="220" y2="177" stroke="var(--color-accent-clay)" strokeWidth="2" />
      <text x="98" y="197" textAnchor="middle" fontSize="9" fill="var(--color-primary)">sicher</text>
      <text x="237" y="197" textAnchor="middle" fontSize="9" fill="var(--color-accent-clay)">gefährlich</text>

      {/* lower-arousal step on each side */}
      <rect x="70" y="147" width="80" height="34" rx="10" fill="var(--color-primary)" opacity="0.15" />
      <text x="110" y="159" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-primary)">soziale</text>
      <text x="110" y="171" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-primary)">Interaktion</text>

      <rect x="180" y="147" width="80" height="34" rx="10" fill="var(--color-accent-clay)" opacity="0.18" />
      <text x="220" y="159" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-accent-clay)">Flucht /</text>
      <text x="220" y="171" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-accent-clay)">Kampf</text>

      {/* connecting lines up to the higher-arousal step */}
      <line x1="110" y1="147" x2="110" y2="105" stroke="var(--color-primary)" strokeWidth="2" markerEnd="url(#arousalUpSafe)" />
      <line x1="220" y1="147" x2="220" y2="105" stroke="var(--color-accent-clay)" strokeWidth="2" markerEnd="url(#arousalUpDanger)" />
      <defs>
        {/* marker default shape points right; orient="auto" then
         * rotates it to match the path's real (upward) direction —
         * drawing it already pointing up here would double-rotate it
         * into a sideways flag, the exact bug fixed on the ladder */}
        <marker id="arousalUpSafe" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 Z" fill="var(--color-primary)" />
        </marker>
        <marker id="arousalUpDanger" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 Z" fill="var(--color-accent-clay)" />
        </marker>
      </defs>

      {/* higher-arousal step on each side */}
      <rect x="70" y="67" width="80" height="34" rx="10" fill="var(--color-primary)" opacity="0.22" />
      <text x="110" y="88" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-primary)">Intimität</text>

      <rect x="180" y="67" width="80" height="34" rx="10" fill="var(--color-accent-sky)" opacity="0.28" />
      <text x="220" y="79" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text)">Erstarren /</text>
      <text x="220" y="91" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text)">Dissoziation</text>
    </svg>
  );
}
