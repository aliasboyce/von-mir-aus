import type { AppSource } from '../../data/sourcesLibrary';

interface SourceLibraryPrintViewProps {
  grouped: Record<string, AppSource[]>;
  labels: { title: string; subtitle: string; usedForLabel: string; exportedOn: string };
  formatDate: (iso: string) => string;
}

/** "Alle Infos mit Quellen separat als PDF"-Auftrag — the same
 * print-only mechanism used throughout the app, so every source this
 * app draws on (with author, link, and what it's used for) can be
 * taken away as one standalone document. */
export function SourceLibraryPrintView({ grouped, labels, formatDate }: SourceLibraryPrintViewProps) {
  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 4 }}>{labels.subtitle}</p>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 28 }}>
        {labels.exportedOn} {formatDate(new Date().toISOString())}
      </p>

      {Object.entries(grouped).map(([approach, sources]) => (
        <div key={approach} style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#3d6b8b', marginBottom: 8 }}>{approach}</h2>
          {sources.map((s) => (
            <div key={s.id} style={{ marginBottom: 12, paddingLeft: 2 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.title}</p>
              <p style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{s.author}</p>
              <p style={{ fontSize: 11, color: '#3d6b8b', marginBottom: 3, wordBreak: 'break-all' }}>{s.url}</p>
              <p style={{ fontSize: 11.5, color: '#333', lineHeight: 1.4, marginBottom: 3 }}>{s.description}</p>
              <p style={{ fontSize: 10.5, color: '#888' }}>
                {labels.usedForLabel}: {s.usedFor}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
