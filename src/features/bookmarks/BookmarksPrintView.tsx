import type { Bookmark } from '../../data/types';

interface BookmarksPrintViewProps {
  bookmarks: Bookmark[];
  categoryLabel: (id: string) => string;
  labels: {
    title: string;
    linkLabel: string;
    noteLabel: string;
    savedOn: string;
  };
  formatDate: (iso: string) => string;
}

/**
 * Same dedicated print-only document approach as every other PDF export
 * in the app (Resources, Bridges, Safety Plan, Medi-Log) — plain hex
 * colors, no CSS variables, genuinely its own document layout rather
 * than a screenshot of the on-screen list.
 */
export function BookmarksPrintView({ bookmarks, categoryLabel, labels, formatDate }: BookmarksPrintViewProps) {
  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>{labels.title}</h1>

      {bookmarks.map((bm) => (
        <div key={bm.id} style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #eee', breakInside: 'avoid' }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{bm.title}</p>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
            {categoryLabel(bm.categoryId)} · {labels.savedOn} {formatDate(bm.createdAt)}
          </p>
          {bm.url && (
            <p style={{ fontSize: 12, color: '#5C7ACB', marginBottom: bm.note ? 4 : 0, wordBreak: 'break-all' }}>
              {labels.linkLabel}: {bm.url}
            </p>
          )}
          {bm.note && (
            <p style={{ fontSize: 12, color: '#333' }}>
              {labels.noteLabel}: {bm.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
