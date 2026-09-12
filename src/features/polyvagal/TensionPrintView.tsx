import type { TensionEntry } from '../../data/types';

interface TensionPrintViewProps {
  entries: TensionEntry[];
  labels: { title: string; subtitle: string; exportedOn: string };
  formatDate: (iso: string) => string;
  formatTime: (iso: string) => string;
}

/** Same print-only mechanism as every other export in the app — a real
 * document, not a screenshot. Shows the day's points as a simple line
 * plus a plain list of values, since a long table of every logged value
 * is more useful on paper than trying to cram a zoomable interactive
 * chart into a static page. */
export function TensionPrintView({ entries, labels, formatDate, formatTime }: TensionPrintViewProps) {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const width = 680;
  const height = 200;
  const padX = 30;
  const padTop = 16;
  const padBottom = 26;

  function xFor(iso: string): number {
    const d = new Date(iso);
    const minutes = d.getHours() * 60 + d.getMinutes();
    return padX + (minutes / (24 * 60)) * (width - padX - 12);
  }
  function yFor(value: number): number {
    return padTop + (1 - value / 100) * (height - padTop - padBottom);
  }

  const byDay = new Map<string, TensionEntry[]>();
  sorted.forEach((e) => {
    const day = e.createdAt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  });

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
        {labels.subtitle} · {labels.exportedOn} {formatDate(new Date().toISOString())}
      </p>

      {Array.from(byDay.entries()).map(([day, dayEntries]) => {
        const points = dayEntries.map((e) => ({ x: xFor(e.createdAt), y: yFor(e.value), entry: e }));
        const pathD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}` : '';
        return (
          <div key={day} style={{ marginBottom: 28, breakInside: 'avoid' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{formatDate(day)}</p>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', marginBottom: 10 }}>
              {[0, 50, 100].map((v) => (
                <g key={v}>
                  <line x1={padX} y1={yFor(v)} x2={width - 8} y2={yFor(v)} stroke="#eee" strokeWidth={1} />
                  <text x={2} y={yFor(v) + 3} fontSize={9} fill="#999">
                    {v}
                  </text>
                </g>
              ))}
              {pathD && <path d={pathD} stroke="#C1683F" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              {points.map((p) => (
                <circle key={p.entry.id} cx={p.x} cy={p.y} r={3.5} fill="#C1683F" />
              ))}
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {dayEntries.map((e) => (
                <span key={e.id} style={{ fontSize: 12, color: '#444' }}>
                  {formatTime(e.createdAt)} — {e.value}/100
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
