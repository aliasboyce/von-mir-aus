import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { AROUSAL_BANDS, bandForValue } from './arousalBands';
import type { PolyvagalCheckIn } from '../../data/types';

interface PolyvagalDayChartProps {
  checkIns: PolyvagalCheckIn[];
  expanded?: boolean;
  /** "Verlauf soll Tag/Woche/Monat zeigen"-Auftrag — controls the
   * x-axis: 'day' spans 24h by time-of-day (the original behavior),
   * 'week'/'month' span the actual date range of the check-ins passed
   * in, so multiple days' points read left-to-right chronologically. */
  period?: 'day' | 'week' | 'month';
  /** "Auf jeden Punkt antworten koennen"-Auftrag — lets the expanded
   * chart open a reflection prompt for whichever check-in was tapped. */
  onPointClick?: (checkIn: PolyvagalCheckIn) => void;
}

const PAD_TOP = 16;
const PAD_BOTTOM = 16;

/**
 * "Nur noch eine Kurve, Status-Niveau vereint"-Auftrag, extended for
 * "Verlauf soll genauso wie die Messung aufgebaut sein" — one smooth
 * continuous line, colored by the same six arousal bands the ladder
 * slider itself uses (not the older three-zone palette), across day,
 * week, or month.
 */
function yForCheckIn(c: PolyvagalCheckIn, padTop: number, height: number): number {
  const raw = c.tensionValue ?? { ventral: 83, sympathetic: 50, dorsal: 17 }[c.zone];
  return padTop + (raw / 100) * (height - padTop - PAD_BOTTOM);
}

export function PolyvagalDayChart({ checkIns, expanded = false, period = 'day', onPointClick }: PolyvagalDayChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const width = expanded ? 640 : 320;
  const height = expanded ? 320 : 180;
  const padX = expanded ? 118 : 66;
  const padTop = expanded ? 28 : PAD_TOP;
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function xFor(date: Date): number {
    const usableWidth = width - padX - 12;
    if (period === 'day') {
      const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
      return padX + (minutesSinceMidnight / (24 * 60)) * usableWidth;
    }
    // week/month: spread across the actual span of check-ins passed in.
    if (sorted.length === 0) return padX;
    const first = new Date(sorted[0].createdAt).getTime();
    const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
    const span = Math.max(last - first, 60 * 60 * 1000);
    return padX + ((date.getTime() - first) / span) * usableWidth;
  }

  const points = sorted.map((c) => {
    const raw = c.tensionValue ?? { ventral: 83, sympathetic: 50, dorsal: 17 }[c.zone];
    return {
      x: xFor(new Date(c.createdAt)),
      y: yForCheckIn(c, padTop, height),
      color: bandForValue(raw).color,
      pct: raw,
      time:
        period === 'day'
          ? new Date(c.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
          : new Date(c.createdAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
      id: c.id,
      checkIn: c,
    };
  });

  const pathD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}` : '';

  function yAt(pct: number) {
    return padTop + (pct / 100) * (height - padTop - PAD_BOTTOM);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto' }}
      role="img"
      aria-label={t.polyvagal.title}
    >
      {/* "Fokus-Sweetspot hervorheben"-Auftrag — zone 2 (16-35%,
       * optimal arousal) gets its own soft tinted band on the chart so
       * it's visible at a glance whether a point landed not just
       * "in the window" but in the specific ideal-focus range. */}
      {AROUSAL_BANDS.map((b) => (
        <rect
          key={b.id}
          x={padX}
          y={yAt(b.min)}
          width={width - padX - 8}
          height={Math.max(yAt(b.max) - yAt(b.min), 1)}
          fill={b.id === 'zone2' ? `${b.color}1f` : 'transparent'}
        />
      ))}
      {AROUSAL_BANDS.map((b, i) => {
        if (i === 0) return null;
        const y = yAt(b.min);
        return <line key={b.id} x1={padX} y1={y} x2={width - 8} y2={y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 4" />;
      })}
      {expanded && (
        <text x={4} y={yAt(25) + 3} fontSize={10} fill={AROUSAL_BANDS[1].color} fontWeight={600}>
          {t.polyvagal.arousalZones.zone2.label}
        </text>
      )}

      {pathD && <path d={pathD} fill="none" stroke="var(--color-text-faint)" strokeWidth={1.5} opacity={0.5} />}

      {points.map((p, i) => (
        <g key={p.id ?? i}>
          {onPointClick && (
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onPointClick(p.checkIn)} />
          )}
          <circle cx={p.x} cy={p.y} r={expanded ? 6 : 4.5} fill={p.color} pointerEvents="none" />
          {(p.checkIn.reflectionTrigger || p.checkIn.reflectionWhatHelped) && (
            <circle cx={p.x} cy={p.y} r={expanded ? 9 : 7} fill="none" stroke={p.color} strokeWidth={1.5} pointerEvents="none" />
          )}
          {expanded ? (
            <>
              <text x={p.x} y={p.y - 12} fontSize={9} textAnchor="middle" fill="var(--color-text-faint)">
                {p.time}
              </text>
              <text x={p.x} y={p.y + 18} fontSize={10} fontWeight={600} textAnchor="middle" fill={p.color}>
                {p.pct}%
              </text>
            </>
          ) : (
            <text x={p.x} y={p.y - 9} fontSize={7.5} fontWeight={600} textAnchor="middle" fill={p.color}>
              {p.pct}%
            </text>
          )}
        </g>
      ))}

      {points.length === 0 && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="11" fill="var(--color-text-faint)">
          {t.polyvagal.emptyChart}
        </text>
      )}
    </svg>
  );
}
