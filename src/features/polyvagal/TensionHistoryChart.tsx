import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { allDaysWithZeros } from '../mediLog/MediLogChart';
import { useChartZoom } from '../mediLog/useChartZoom';
import type { TensionEntry } from '../../data/types';
import { tensionColorFor } from './TensionScale';

interface TensionHistoryChartProps {
  entries: TensionEntry[];
  width?: number;
  height?: number;
  zoomable?: boolean;
}

const PAD_X = 30;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Day-over-day view of the tension curve — one point per day, the day's
 * average tension. Deliberately reuses allDaysWithZeros and the general
 * line-chart layout from MediLogChart rather than a new day-range
 * mechanism; only the value (0-100 average vs. a summed dose) and the
 * fixed y-axis (always 0-100, not derived from the data's own max) are
 * different.
 */
export function TensionHistoryChart({ entries, width = 320, height = 160, zoomable = false }: TensionHistoryChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [zoomState, zoomHandlers] = useChartZoom();

  const byDay = new Map<string, number[]>();
  entries.forEach((e) => {
    const day = e.createdAt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e.value);
  });
  const avgByDay = new Map<string, number>();
  byDay.forEach((values, day) => avgByDay.set(day, values.reduce((a, b) => a + b, 0) / values.length));

  const allFilledDays = allDaysWithZeros(avgByDay).map((d) => ({
    ...d,
    // allDaysWithZeros fills gaps with 0, but a day with no entry here
    // means "no data", not "zero tension" — keep the real average where
    // one exists, and mark gap days so they render as a break, not a
    // false dip to the bottom of the scale.
    value: avgByDay.get(d.day) ?? d.value,
    hasData: avgByDay.has(d.day),
  }));

  if (allFilledDays.length < 2) {
    return <p className="text-[12px] text-[var(--color-text-faint)]">{t.tension.historyNeedsMore}</p>;
  }

  const zoomStartIdx = Math.floor(zoomState.windowStart * allFilledDays.length);
  const zoomEndIdx = Math.max(zoomStartIdx + 2, Math.ceil((zoomState.windowStart + zoomState.windowSize) * allFilledDays.length));
  const filledDays = zoomable ? allFilledDays.slice(zoomStartIdx, zoomEndIdx) : allFilledDays;

  const firstDay = new Date(filledDays[0].day).getTime();
  const lastDay = new Date(filledDays[filledDays.length - 1].day).getTime();
  const span = Math.max(lastDay - firstDay, DAY_MS);
  const labelEvery = Math.max(1, Math.ceil(filledDays.length / 8));

  const points = filledDays.map((d, i) => {
    const frac = (new Date(d.day).getTime() - firstDay) / span;
    const x = PAD_X + frac * (width - PAD_X - 12);
    const y = PAD_TOP + (1 - d.value / 100) * (height - PAD_TOP - PAD_BOTTOM);
    return { x, y, day: d.day, value: d.value, hasData: d.hasData, showLabel: i % labelEvery === 0 || i === filledDays.length - 1 };
  });

  // Only connect consecutive days that both have real data, so a gap in
  // logging reads as a visible break in the line, not a straight line
  // dropping to a day with nothing recorded.
  let pathD = '';
  let drawing = false;
  points.forEach((p) => {
    if (!p.hasData) {
      drawing = false;
      return;
    }
    pathD += drawing ? ` L ${p.x},${p.y}` : `M ${p.x},${p.y}`;
    drawing = true;
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto', touchAction: zoomable ? 'none' : undefined, cursor: zoomable && zoomState.zoom > 1 ? 'grab' : undefined }}
        role="img"
        aria-label={t.tension.historyChartLabel}
        onWheel={zoomable ? zoomHandlers.onWheel : undefined}
        onTouchStart={zoomable ? zoomHandlers.onTouchStart : undefined}
        onTouchMove={zoomable ? zoomHandlers.onTouchMove : undefined}
        onTouchEnd={zoomable ? zoomHandlers.onTouchEnd : undefined}
        onMouseDown={zoomable ? zoomHandlers.onMouseDown : undefined}
        onMouseMove={zoomable ? zoomHandlers.onMouseMove : undefined}
        onMouseUp={zoomable ? zoomHandlers.onMouseUp : undefined}
        onMouseLeave={zoomable ? zoomHandlers.onMouseLeave : undefined}
      >
        <line x1={PAD_X} y1={height - PAD_BOTTOM} x2={width - 8} y2={height - PAD_BOTTOM} stroke="var(--color-border)" strokeWidth={1} />
        <text x={2} y={PAD_TOP + 4} fontSize={8} fill="var(--color-text-faint)">
          100
        </text>
        {pathD && (
          <>
            <defs>
              <linearGradient id="tensionHistGrad" gradientUnits="userSpaceOnUse" x1="0" y1={PAD_TOP} x2="0" y2={height - PAD_BOTTOM}>
                <stop offset="0%" stopColor="#b5533f" />
                <stop offset="30%" stopColor="#d1793f" />
                <stop offset="55%" stopColor="#e4a63b" />
                <stop offset="80%" stopColor="#7a9a3f" />
                <stop offset="100%" stopColor="#3d6b35" />
              </linearGradient>
            </defs>
            <path d={pathD} stroke="url(#tensionHistGrad)" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {points.map((p) => (
          <g key={p.day}>
            {p.hasData && <circle cx={p.x} cy={p.y} r={3} fill={tensionColorFor(p.value)} />}
            {p.showLabel && (
              <text x={p.x} y={height - PAD_BOTTOM + 14} fontSize={8} fill="var(--color-text-faint)" textAnchor="middle">
                {new Date(p.day).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
              </text>
            )}
          </g>
        ))}
      </svg>
      {zoomable && (
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={zoomHandlers.zoomOut}
            aria-label={t.mediLog.zoomOut}
            disabled={zoomState.zoom <= 1}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] disabled:opacity-30"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={zoomHandlers.zoomIn}
            aria-label={t.mediLog.zoomIn}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
          >
            <ZoomIn size={14} />
          </button>
          {zoomState.zoom > 1 && (
            <button
              onClick={zoomHandlers.reset}
              aria-label={t.mediLog.zoomReset}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
