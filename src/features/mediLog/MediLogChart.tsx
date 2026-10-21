import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { useChartZoom } from './useChartZoom';
import type { MediLogEntry } from '../../data/types';

interface MediLogChartProps {
  entries: MediLogEntry[];
  color?: string;
  width?: number;
  height?: number;
  /** hides the zoom controls/interaction for small inline previews where
   * there isn't room for them and precision zoom isn't the point (e.g.
   * a compact card in a list) — the fullscreen and dedicated chart views
   * pass true. */
  zoomable?: boolean;
}

const PAD_X = 30;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Every calendar day between the first and last entry, inclusive — a day
 * with no entry gets an explicit 0, it is never simply skipped. This is
 * the fix for the chart previously only plotting days that had data,
 * which visually hid gaps between doses instead of showing them as the
 * zero they actually were. */
export function allDaysWithZeros(byDay: Map<string, number>): Array<{ day: string; value: number }> {
  const days = Array.from(byDay.keys()).sort();
  if (days.length === 0) return [];
  const first = new Date(days[0] + 'T00:00:00');
  const last = new Date(days[days.length - 1] + 'T00:00:00');
  const result: Array<{ day: string; value: number }> = [];
  for (let t = first.getTime(); t <= last.getTime(); t += DAY_MS) {
    const key = dayKey(new Date(t));
    result.push({ day: key, value: byDay.get(key) ?? 0 });
  }
  return result;
}

/**
 * A documentation visualization of actual entered doses over time, not a
 * generic "mood curve" - starts at the first real entry for this
 * medication and extends to the last. Days without an entry are shown as
 * an explicit 0 rather than skipped, so a gap in taking something reads
 * as a visible dip in the line, not an invisible jump. When a day has
 * several entries, their doses are summed into one point for that day.
 * Falls back to showing entry counts only if no entry has a structured
 * dose value at all (older entries, or free-text-only use).
 *
 * Optionally zoomable: pinch on touch, wheel or drag on desktop, or the
 * +/-/reset buttons — see useChartZoom. Zooming narrows which days are
 * considered "visible" and only that subset gets laid out across the
 * full chart width, so point/label sizes stay constant and readable at
 * any zoom level rather than the whole SVG (including text) scaling.
 */
export function MediLogChart({ entries, color, width = 320, height = 140, zoomable = false }: MediLogChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const lineColor = color ?? 'var(--color-primary)';
  const [zoomState, zoomHandlers] = useChartZoom();

  const unitCounts = new Map<string, number>();
  entries.forEach((e) => {
    if (e.doseUnit) unitCounts.set(e.doseUnit, (unitCounts.get(e.doseUnit) ?? 0) + 1);
  });
  const mainUnit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const hasDoseData = !!mainUnit && entries.some((e) => e.doseUnit === mainUnit && e.doseValue != null);

  const byDay = new Map<string, number>();
  entries.forEach((e) => {
    const day = e.takenAt.slice(0, 10);
    const value = hasDoseData ? (e.doseUnit === mainUnit ? (e.doseValue ?? 0) : 0) : 1;
    byDay.set(day, (byDay.get(day) ?? 0) + value);
  });

  const allFilledDays = allDaysWithZeros(byDay);

  if (allFilledDays.length < 2) {
    return <p className="text-[12px] text-[var(--color-text-faint)]">{t.mediLog.chartNeedsMore}</p>;
  }

  // Slice to the currently zoomed-in day window (a fraction of the full
  // range), not a raw visual transform — see useChartZoom for why.
  const zoomStartIdx = Math.floor(zoomState.windowStart * allFilledDays.length);
  const zoomEndIdx = Math.max(
    zoomStartIdx + 2,
    Math.ceil((zoomState.windowStart + zoomState.windowSize) * allFilledDays.length),
  );
  const filledDays = zoomable ? allFilledDays.slice(zoomStartIdx, zoomEndIdx) : allFilledDays;

  const maxValue = Math.max(...filledDays.map((d) => d.value), 1);
  const firstDay = new Date(filledDays[0].day).getTime();
  const lastDay = new Date(filledDays[filledDays.length - 1].day).getTime();
  const span = Math.max(lastDay - firstDay, DAY_MS);

  // Sparse date labels when there are many days, so labels never overlap
  // into unreadable clutter on a long range.
  const labelEvery = Math.max(1, Math.ceil(filledDays.length / 8));

  const points = filledDays.map((d, i) => {
    const frac = (new Date(d.day).getTime() - firstDay) / span;
    const x = PAD_X + frac * (width - PAD_X - 12);
    const y = PAD_TOP + (1 - d.value / maxValue) * (height - PAD_TOP - PAD_BOTTOM);
    return { x, y, day: d.day, value: d.value, showLabel: i % labelEvery === 0 || i === filledDays.length - 1 };
  });

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div>
      {hasDoseData && (
        <p className="text-[11px] text-[var(--color-text-faint)] mb-2">
          {t.mediLog.chartUnitHint.replace('{unit}', mainUnit!)}
        </p>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto', touchAction: zoomable ? 'none' : undefined, cursor: zoomable && zoomState.zoom > 1 ? 'grab' : undefined }}
        role="img"
        aria-label={t.mediLog.chartLabel}
        onWheel={zoomable ? zoomHandlers.onWheel : undefined}
        onTouchStart={zoomable ? zoomHandlers.onTouchStart : undefined}
        onTouchMove={zoomable ? zoomHandlers.onTouchMove : undefined}
        onTouchEnd={zoomable ? zoomHandlers.onTouchEnd : undefined}
        onMouseDown={zoomable ? zoomHandlers.onMouseDown : undefined}
        onMouseMove={zoomable ? zoomHandlers.onMouseMove : undefined}
        onMouseUp={zoomable ? zoomHandlers.onMouseUp : undefined}
        onMouseLeave={zoomable ? zoomHandlers.onMouseLeave : undefined}
      >
        <line
          x1={PAD_X}
          y1={height - PAD_BOTTOM}
          x2={width - 8}
          y2={height - PAD_BOTTOM}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        <text x={2} y={PAD_TOP + 4} fontSize={8} fill="var(--color-text-faint)">
          {maxValue}
        </text>
        <path d={pathD} stroke={lineColor} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.day}>
            <circle cx={p.x} cy={p.y} r={p.value === 0 ? 2 : 3} fill={lineColor} opacity={p.value === 0 ? 0.4 : 1} />
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
          <span className="text-[11px] text-[var(--color-text-faint)] ml-1">{t.mediLog.zoomHint}</span>
        </div>
      )}
    </div>
  );
}
