import { allDaysWithZeros } from './MediLogChart';
import type { MediLogEntry } from '../../data/types';

interface MediLogPrintViewProps {
  medicationName: string;
  entries: MediLogEntry[];
  fromDate: string;
  toDate: string;
  color: string;
  labels: {
    title: string;
    period: string;
    day: string;
    amount: string;
    summary: string;
    totalLabel: string;
    daysWithEntryLabel: string;
    averageLabel: string;
  };
  formatDate: (iso: string) => string;
}

/**
 * A genuine document layout, not a screenshot of the chart on screen —
 * same print-only mechanism as Resources/Bridges/Safety Plan. Uses plain
 * hex colors throughout (not CSS variables) so it's fully independent of
 * the on-screen theme, matching that established pattern.
 */
export function MediLogPrintView({ medicationName, entries, fromDate, toDate, color, labels, formatDate }: MediLogPrintViewProps) {
  const byDay = new Map<string, number>();
  entries.forEach((e) => {
    const day = e.takenAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + (e.doseValue ?? 0));
  });
  // Ensure the full requested range is represented even if the first/last
  // real entries fall inside it — not just the span between actual data.
  byDay.set(fromDate, byDay.get(fromDate) ?? 0);
  byDay.set(toDate, byDay.get(toDate) ?? 0);
  const days = allDaysWithZeros(byDay);

  const width = 680;
  const height = 220;
  const padX = 40;
  const padTop = 16;
  const padBottom = 30;
  const maxValue = Math.max(...days.map((d) => d.value), 1);
  const span = days.length > 1 ? days.length - 1 : 1;

  const points = days.map((d, i) => {
    const x = padX + (i / span) * (width - padX - 16);
    const y = padTop + (1 - d.value / maxValue) * (height - padTop - padBottom);
    return { x, y, ...d };
  });
  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  const total = days.reduce((sum, d) => sum + d.value, 0);
  const daysWithEntry = days.filter((d) => d.value > 0).length;
  const average = total / days.length;

  const labelEvery = Math.max(1, Math.ceil(days.length / 10));

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
        {labels.title}: {medicationName}
      </h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
        {labels.period}: {formatDate(fromDate)} – {formatDate(toDate)}
      </p>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', marginBottom: 24 }}>
        <line x1={padX} y1={height - padBottom} x2={width - 8} y2={height - padBottom} stroke="#ddd" strokeWidth={1} />
        <text x={2} y={padTop + 4} fontSize={10} fill="#888">
          {maxValue}
        </text>
        <path d={pathD} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.day}>
            <circle cx={p.x} cy={p.y} r={p.value === 0 ? 2 : 3.5} fill={color} opacity={p.value === 0 ? 0.35 : 1} />
            {(i % labelEvery === 0 || i === points.length - 1) && (
              <text x={p.x} y={height - padBottom + 16} fontSize={9} fill="#888" textAnchor="middle">
                {formatDate(p.day)}
              </text>
            )}
          </g>
        ))}
      </svg>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{labels.summary}</p>
      <p style={{ fontSize: 13, color: '#333', marginBottom: 20, lineHeight: 1.7 }}>
        {labels.totalLabel}: {total.toFixed(2).replace(/\.?0+$/, '')} · {labels.daysWithEntryLabel}: {daysWithEntry} / {days.length} ·{' '}
        {labels.averageLabel}: {average.toFixed(2).replace(/\.?0+$/, '')}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px', color: '#555' }}>{labels.day}</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '6px 4px', color: '#555' }}>{labels.amount}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td style={{ padding: '4px', borderBottom: '1px solid #f0f0f0' }}>{formatDate(d.day)}</td>
              <td style={{ padding: '4px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                {d.value > 0 ? d.value : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
