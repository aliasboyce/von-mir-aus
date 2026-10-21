/**
 * "Nervensystem komplett neu strukturieren"-Auftrag, Section 3 — a
 * digital rebuild of the organ-by-organ Sympathikus/Parasympathikus
 * comparison shown in the reference material. That material uses a
 * detailed anatomical body illustration (brain, organs, nerve
 * pathways) which isn't reproduced here; this conveys the same
 * underlying comparison — a few key organs, sympathetic effect next
 * to parasympathetic effect — with this app's own flat, geometric
 * visual language instead.
 */
const ROWS: { organ: string; para: string; sym: string }[] = [
  { organ: 'Herz', para: 'langsamer Puls', sym: 'schneller Puls' },
  { organ: 'Atemwege', para: 'Verengung', sym: 'Erweiterung' },
  { organ: 'Verdauung', para: 'fördernd', sym: 'hemmend' },
  { organ: 'Pupille', para: 'verengt', sym: 'erweitert' },
];

export function AutonomicOrgansIllustration() {
  return (
    <svg viewBox="0 0 300 190" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '300 / 190', maxWidth: 360, display: 'block', margin: '0 auto' }}>
      <text x="90" y="18" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-primary)">Parasympathikus</text>
      <text x="210" y="18" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-accent-sun)">Sympathikus</text>
      <line x1="150" y1="8" x2="150" y2="182" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3,4" />
      {ROWS.map((row, i) => {
        const y = 40 + i * 36;
        return (
          <g key={row.organ}>
            <text x="150" y={y} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-text)">{row.organ}</text>
            <text x="90" y={y + 15} textAnchor="middle" fontSize="10" fill="var(--color-text-faint)">{row.para}</text>
            <text x="210" y={y + 15} textAnchor="middle" fontSize="10" fill="var(--color-text-faint)">{row.sym}</text>
          </g>
        );
      })}
    </svg>
  );
}
