import type { DiaryEntry } from '../../data/types';

interface DiaryPrintViewProps {
  entries: DiaryEntry[];
  categoryLabel: (id: string | undefined) => string;
  labels: {
    title: string;
    period: string;
    noEntries: string;
  };
  formatDate: (iso: string) => string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Genuine document layout for a set of diary entries — chronological,
 * grouped visually by day, category shown as a small label per entry
 * rather than the app's colored chip (color doesn't carry meaning on
 * a printed page the same way, and would just be decorative). Same
 * print-only mechanism as every other export in the app.
 */
export function DiaryPrintView({ entries, categoryLabel, labels, formatDate, fromDate, toDate }: DiaryPrintViewProps) {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      {(fromDate || toDate) && (
        <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
          {labels.period}: {fromDate ? formatDate(fromDate) : ''} – {toDate ? formatDate(toDate) : ''}
        </p>
      )}
      {!fromDate && !toDate && <div style={{ marginBottom: 24 }} />}

      {sorted.length === 0 && <p style={{ fontSize: 14, color: '#777' }}>{labels.noEntries}</p>}

      {sorted.map((entry) => (
        <div key={entry.id} style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {formatDate(entry.createdAt)} · {categoryLabel(entry.categoryId)}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
        </div>
      ))}
    </div>
  );
}
