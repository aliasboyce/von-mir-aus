import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { allDaysWithZeros } from './MediLogChart';
import { useChartZoom } from './useChartZoom';
import type { MediLogEntry } from '../../data/types';

interface MedicationSeries {
  key: string;
  displayName: string;
  color: string;
  entries: MediLogEntry[];
}

interface MediLogOverallChartProps {
  medications: MedicationSeries[];
  width?: number;
  height?: number;
  zoomable?: boolean;
}

const PAD_X = 30;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Every medication plotted on the same shared timeline, each in its own
 * color, so the whole picture of what was taken when is visible at a
 * glance - not just one medication in isolation. Uses the exact same
 * gap-day-fill logic as the single-medication chart (allDaysWithZeros),
 * just applied per medication over one shared date range so all lines
 * are genuinely comparable day-for-day.
 *
 * Which medications appear here is entirely the caller's decision (see
 * MediLogPage's medication filter) — this component only ever draws
 * whatever `medications` array it's handed, it holds no filtering state
 * of its own. Zoom works the same day-window-slicing way as the
 * single-medication chart; see useChartZoom.
 */
export function MediLogOverallChart({ medications, width = 320, height = 160, zoomable = false }: MediLogOverallChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [zoomState, zoomHandlers] = useChartZoom();

  const series = medications
    .map((m) => {
      const byDay = new Map<string, number>();
      m.entries.forEach((e) => {
        const day = e.takenAt.slice(0, 10);
        const value = e.doseValue ?? 0;
        byDay.set(day, (byDay.get(day) ?? 0) + value);
      });
      return { ...m, byDay };
    })
    .filter((m) => m.byDay.size > 0);

  if (series.length === 0) {
    return <p className="text-[12px] text-[var(--color-text-faint)]">{t.mediLog.chartNeedsMore}</p>;
  }

  const allDays = series.flatMap((m) => Array.from(m.byDay.keys()));
  const overallFirstDay = new Date(Math.min(...allDays.map((d) => new Date(d).getTime())));
  const overallLastDay = new Date(Math.max(...allDays.map((d) => new Date(d).getTime())));

  const sharedByDay = new Map<string, number>();
  for (let t2 = overallFirstDay.getTime(); t2 <= overallLastDay.getTime(); t2 += DAY_MS) {
    sharedByDay.set(new Date(t2).toISOString().slice(0, 10), 0);
  }

  const fullSeries = series.map((m) => ({
    ...m,
    days: allDaysWithZeros(new Map([...sharedByDay, ...m.byDay])),
  }));

  const totalDayCount = fullSeries[0].days.length;
  const zoomStartIdx = Math.floor(zoomState.windowStart * totalDayCount);
  const zoomEndIdx = Math.max(zoomStartIdx + 2, Math.ceil((zoomState.windowStart + zoomState.windowSize) * totalDayCount));

  const filledSeries = zoomable ? fullSeries.map((m) => ({ ...m, days: m.days.slice(zoomStartIdx, zoomEndIdx) })) : fullSeries;
  const visibleDays = filledSeries[0].days;
  const firstDay = new Date(visibleDays[0].day).getTime();
  const lastDay = new Date(visibleDays[visibleDays.length - 1].day).getTime();
  const span = Math.max(lastDay - firstDay, DAY_MS);
  const totalDays = visibleDays.length;

  const maxValue = Math.max(...filledSeries.flatMap((m) => m.days.map((d) => d.value)), 1);
  const labelEvery = Math.max(1, Math.ceil(totalDays / 8));

  function pointsFor(days: Array<{ day: string; value: number }>) {
    return days.map((d) => {
      const frac = (new Date(d.day).getTime() - firstDay) / span;
      const x = PAD_X + frac * (width - PAD_X - 12);
      const y = PAD_TOP + (1 - d.value / maxValue) * (height - PAD_TOP - PAD_BOTTOM);
      return { x, y, day: d.day, value: d.value };
    });
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto', touchAction: zoomable ? 'none' : undefined, cursor: zoomable && zoomState.zoom > 1 ? 'grab' : undefined }}
        role="img"
        aria-label={t.mediLog.overallChartLabel}
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
          {maxValue}
        </text>
        {filledSeries.map((m) => {
          const points = pointsFor(m.days);
          const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
          return (
            <g key={m.key}>
              <path d={pathD} stroke={m.color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p) => (
                <circle key={p.day} cx={p.x} cy={p.y} r={p.value === 0 ? 1.6 : 2.6} fill={m.color} opacity={p.value === 0 ? 0.35 : 1} />
              ))}
            </g>
          );
        })}
        {pointsFor(visibleDays).map((p, i) =>
          i % labelEvery === 0 || i === visibleDays.length - 1 ? (
            <text key={p.day} x={p.x} y={height - PAD_BOTTOM + 14} fontSize={8} fill="var(--color-text-faint)" textAnchor="middle">
              {new Date(p.day).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
            </text>
          ) : null,
        )}
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
          <span className="text-[11px] text-[var(--color-text-faint)] ml-1">{t.mediLog.zoomHint}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {series.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
            <span className="text-[12px] text-[var(--color-text-muted)]">{m.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { MedicationSeries };
