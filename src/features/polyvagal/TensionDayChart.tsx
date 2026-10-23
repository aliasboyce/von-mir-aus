import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useT } from '../../i18n';
import { useChartZoom } from '../mediLog/useChartZoom';
import type { TensionEntry } from '../../data/types';
import { tensionColorFor } from './TensionScale';

interface TensionDayChartProps {
  entries: TensionEntry[];
  expanded?: boolean;
  zoomable?: boolean;
  onPointTap?: (entry: TensionEntry) => void;
}

const DAY_MINUTES = 24 * 60;

/**
 * Time-of-day x-axis exactly like PolyvagalDayChart (this is the same
 * "one day, spread across 24 hours" layout, just with a continuous
 * 0-100 y-axis instead of three discrete zone rows), and zoom/pan
 * behavior reused wholesale from Medi-Log's useChartZoom rather than a
 * third hand-rolled interaction system — deliberately following the
 * "don't invent three chart systems in parallel" instruction.
 */
export function TensionDayChart({ entries, expanded = false, zoomable = false, onPointTap }: TensionDayChartProps) {
  const t = useT();
  const [zoomState, zoomHandlers] = useChartZoom();

  const width = expanded ? 640 : 320;
  const height = expanded ? 320 : 180;
  const padX = expanded ? 36 : 28;
  const padTop = expanded ? 24 : 14;
  const padBottom = expanded ? 34 : 24;

  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Zoom narrows the visible minute-of-day window rather than scaling
  // the SVG, same reasoning as the Medi-Log charts — point/label sizes
  // stay constant and readable at any zoom level.
  const minuteWindowStart = zoomState.windowStart * DAY_MINUTES;
  const minuteWindowSize = zoomState.windowSize * DAY_MINUTES;
  const visibleMinuteStart = zoomable ? minuteWindowStart : 0;
  const visibleMinuteEnd = zoomable ? minuteWindowStart + minuteWindowSize : DAY_MINUTES;

  function xForZoomed(date: Date): number {
    const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
    const frac = (minutesSinceMidnight - visibleMinuteStart) / (visibleMinuteEnd - visibleMinuteStart);
    return padX + frac * (width - padX - 12);
  }

  function yFor(value: number): number {
    return padTop + (1 - value / 100) * (height - padTop - padBottom);
  }

  const points = sorted
    .map((e) => ({ x: xForZoomed(new Date(e.createdAt)), y: yFor(e.value), entry: e }))
    .filter((p) => p.x >= padX - 2 && p.x <= width - 4);

  const pathD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}` : '';

  // Hour gridlines, spaced further apart when zoomed in tighter so they
  // never crowd into unreadable clutter.
  const hourStep = Math.max(1, Math.round((visibleMinuteEnd - visibleMinuteStart) / 60 / 6));
  const hourMarks: number[] = [];
  for (let h = 0; h <= 24; h += hourStep) {
    const minute = h * 60;
    if (minute >= visibleMinuteStart - hourStep * 60 && minute <= visibleMinuteEnd + hourStep * 60) hourMarks.push(minute);
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto', touchAction: zoomable ? 'none' : undefined, cursor: zoomable && zoomState.zoom > 1 ? 'grab' : undefined }}
        role="img"
        aria-label={t.tension.chartLabel}
        onWheel={zoomable ? zoomHandlers.onWheel : undefined}
        onTouchStart={zoomable ? zoomHandlers.onTouchStart : undefined}
        onTouchMove={zoomable ? zoomHandlers.onTouchMove : undefined}
        onTouchEnd={zoomable ? zoomHandlers.onTouchEnd : undefined}
        onMouseDown={zoomable ? zoomHandlers.onMouseDown : undefined}
        onMouseMove={zoomable ? zoomHandlers.onMouseMove : undefined}
        onMouseUp={zoomable ? zoomHandlers.onMouseUp : undefined}
        onMouseLeave={zoomable ? zoomHandlers.onMouseLeave : undefined}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={padX} y1={yFor(v)} x2={width - 8} y2={yFor(v)} stroke="var(--color-border)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : '2 4'} />
            <text x={2} y={yFor(v) + 3} fontSize={expanded ? 10 : 8} fill="var(--color-text-faint)">
              {v}
            </text>
          </g>
        ))}

        {hourMarks.map((minute) => {
          const frac = (minute - visibleMinuteStart) / (visibleMinuteEnd - visibleMinuteStart);
          const x = padX + frac * (width - padX - 12);
          if (x < padX - 1 || x > width - 4) return null;
          return (
            <text key={minute} x={x} y={height - padBottom + 14} fontSize={expanded ? 10 : 8} fill="var(--color-text-faint)" textAnchor="middle">
              {String(Math.floor(minute / 60)).padStart(2, '0')}:00
            </text>
          );
        })}

        {pathD && (
          <>
            <defs>
              <linearGradient id="tensionLineGrad" gradientUnits="userSpaceOnUse" x1="0" y1={padTop} x2="0" y2={height - padBottom}>
                <stop offset="0%" stopColor="#b5533f" />
                <stop offset="30%" stopColor="#d1793f" />
                <stop offset="55%" stopColor="#e4a63b" />
                <stop offset="80%" stopColor="#7a9a3f" />
                <stop offset="100%" stopColor="#3d6b35" />
              </linearGradient>
            </defs>
            <path d={pathD} fill="none" stroke="url(#tensionLineGrad)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {points.map((p) => (
          <circle
            key={p.entry.id}
            cx={p.x}
            cy={p.y}
            r={expanded ? 6 : 4.5}
            fill={tensionColorFor(p.entry.value)}
            style={{ cursor: onPointTap ? 'pointer' : undefined }}
            onClick={onPointTap ? () => onPointTap(p.entry) : undefined}
          />
        ))}

        {points.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="11" fill="var(--color-text-faint)">
            {t.tension.emptyChart}
          </text>
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
        </div>
      )}
    </div>
  );
}
