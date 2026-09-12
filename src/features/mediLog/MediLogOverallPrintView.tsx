import { allDaysWithZeros } from './MediLogChart';
import type { MediLogEntry } from '../../data/types';

interface MedicationSeries {
  key: string;
  displayName: string;
  color: string;
  entries: MediLogEntry[];
}

interface MediLogOverallPrintViewProps {
  medications: MedicationSeries[];
  fromDate: string;
  toDate: string;
  labels: {
    title: string;
    period: string;
    day: string;
    summary: string;
    totalLabel: string;
    daysWithEntryLabel: string;
  };
  formatDate: (iso: string) => string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The combined-medications counterpart to MediLogPrintView. Layout is
 * chart first, legend directly below it (never overlapping), then one
 * compact summary line per medication — deliberately not one giant
 * shared date table, which would get unreadable fast with several
 * medications over a longer range. Same plain-hex-color, print-only
 * mechanism as every other print view in the app.
 */
export function MediLogOverallPrintView({ medications, fromDate, toDate, labels, formatDate }: MediLogOverallPrintViewProps) {
  const width = 680;
  const height = 260;
  const padX = 40;
  const padTop = 16;
  const padBottom = 30;

  const series = medications
    .map((m) => {
      const byDay = new Map<string, number>();
      m.entries.forEach((e) => {
        const day = e.takenAt.slice(0, 10);
        if (day < fromDate || day > toDate) return;
        byDay.set(day, (byDay.get(day) ?? 0) + (e.doseValue ?? 0));
      });
      byDay.set(fromDate, byDay.get(fromDate) ?? 0);
      byDay.set(toDate, byDay.get(toDate) ?? 0);
      return { ...m, days: allDaysWithZeros(byDay) };
    })
    .filter((m) => m.entries.some((e) => e.takenAt.slice(0, 10) >= fromDate && e.takenAt.slice(0, 10) <= toDate));

  const totalDays = Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / DAY_MS) + 1;
  const maxValue = Math.max(...series.flatMap((m) => m.days.map((d) => d.value)), 1);
  const labelEvery = Math.max(1, Math.ceil(totalDays / 10));

  function pointsFor(days: Array<{ day: string; value: number }>) {
    const span = Math.max(days.length - 1, 1);
    return days.map((d, i) => ({
      x: padX + (i / span) * (width - padX - 16),
      y: padTop + (1 - d.value / maxValue) * (height - padTop - padBottom),
      ...d,
    }));
  }

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
        {labels.period}: {formatDate(fromDate)} – {formatDate(toDate)}
      </p>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', marginBottom: 16 }}>
        <line x1={padX} y1={height - padBottom} x2={width - 8} y2={height - padBottom} stroke="#ddd" strokeWidth={1} />
        <text x={2} y={padTop + 4} fontSize={10} fill="#888">
          {maxValue}
        </text>
        {series.map((m) => {
          const points = pointsFor(m.days);
          const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
          return (
            <g key={m.key}>
              <path d={pathD} stroke={m.color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p) => (
                <circle key={p.day} cx={p.x} cy={p.y} r={p.value === 0 ? 2 : 3} fill={m.color} opacity={p.value === 0 ? 0.35 : 1} />
              ))}
            </g>
          );
        })}
        {series[0] &&
          pointsFor(series[0].days).map((p, i) =>
            i % labelEvery === 0 || i === series[0].days.length - 1 ? (
              <text key={p.day} x={p.x} y={height - padBottom + 16} fontSize={9} fill="#888" textAnchor="middle">
                {formatDate(p.day)}
              </text>
            ) : null,
          )}
      </svg>

      {/* Legend sits below the chart, never overlapping it */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 24 }}>
        {series.map((m) => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: m.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12 }}>{m.displayName}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{labels.summary}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {series.map((m) => {
          const total = m.days.reduce((sum, d) => sum + d.value, 0);
          const daysWithEntry = m.days.filter((d) => d.value > 0).length;
          return (
            <p key={m.key} style={{ fontSize: 12, color: '#333' }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: m.color, marginRight: 6 }} />
              {m.displayName}: {labels.totalLabel} {total.toFixed(2).replace(/\.?0+$/, '')} · {labels.daysWithEntryLabel} {daysWithEntry}/{totalDays}
            </p>
          );
        })}
      </div>
    </div>
  );
}
