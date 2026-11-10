/** Notfallrucksack-Symbol: Rucksack mit kleinem Schutzschild auf der Tasche (Farbe folgt dem Text, Akzent frei wählbar) */
export function RucksackIcon({ size = 28, accent = '#d9893d', className }: { size?: number; accent?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" data-testid="rucksack-icon">
      {/* Tragegriff */}
      <path d="M19 9.5c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* Körper */}
      <path d="M11.5 20.5c0-5.5 4.5-9.5 12.5-9.5s12.5 4 12.5 9.5V37a5 5 0 0 1-5 5H16.5a5 5 0 0 1-5-5V20.5Z" fill={accent} fillOpacity="0.22" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Deckelnaht */}
      <path d="M12 22.5c3.5 2.2 8 3.2 12 3.2s8.5-1 12-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Seitentaschen */}
      <path d="M7 27.5v8a2.5 2.5 0 0 0 2.5 2.5h2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M41 27.5v8a2.5 2.5 0 0 1-2.5 2.5h-2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Schild mit Herz */}
      <path d="M24 28.2l6 2.1v4.6c0 3-2.6 5-6 6.3-3.4-1.3-6-3.3-6-6.3v-4.6l6-2.1Z" fill={accent} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M24 37.2c-1.9-1.3-3-2.3-3-3.6 0-1 .8-1.7 1.6-1.7.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.6.7 1.6 1.7 0 1.3-1.1 2.3-3 3.6Z" fill="#fff" />
    </svg>
  );
}
