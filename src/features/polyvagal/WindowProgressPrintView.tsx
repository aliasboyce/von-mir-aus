import type { WindowProgressEntry } from './windowProgressRepo';

interface WindowProgressPrintViewProps {
  entries: WindowProgressEntry[];
  labels: { title: string; subtitle: string; exportedOn: string; rangeLabel: string; dateLabel: string };
  formatDate: (iso: string) => string;
}

/** "Daten-Export"-Auftrag — same print-only mechanism as every other
 * export in the app, so the person can take their window's growth
 * over time into a therapy session or print it out. A plain,
 * chronological list is more useful on paper here than trying to
 * force a chart onto a static page. */
export function WindowProgressPrintView({ entries, labels, formatDate }: WindowProgressPrintViewProps) {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
        {labels.subtitle} · {labels.exportedOn} {formatDate(new Date().toISOString())}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{labels.dateLabel}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{labels.rangeLabel}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 1 ? '#fafafa' : undefined }}>
              <td style={{ padding: '8px 4px' }}>{formatDate(e.createdAt)}</td>
              <td style={{ padding: '8px 4px', fontWeight: 600, color: '#3d6b8b' }}>
                {e.windowStart}% – {e.windowEnd}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
