import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { bandsForBoundaries, bandForValueCalibrated, DEFAULT_ZONE_BOUNDARIES } from './arousalBands';
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
  // "Einheitlich auf allen verbundenen Seiten"-Fund — this chart drew
  // its zone backgrounds/lines/labels from the fixed AROUSAL_BANDS
  // regardless of any personal calibration, so a calibrated person's
  // chart didn't match what their own ladder/slider actually shows.
  // Same calibratedBands pattern as NervousSystemLadderSlider.tsx.
  const calibratedBands = settings.arousalZoneBoundaries ? bandsForBoundaries(settings.arousalZoneBoundaries) : bandsForBoundaries(DEFAULT_ZONE_BOUNDARIES);
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
      color: bandForValueCalibrated(raw, settings.arousalZoneBoundaries).color,
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

  // "Monat total zusammengequetscht"-Fund — with 30+ days of several
  // check-ins each, a text label on every single point was reliably
  // unreadable, overlapping into an illegible smear regardless of
  // screen size. Every dot still renders (no data point disappears) —
  // only the text labels are thinned, greedily keeping one whenever
  // there's enough horizontal room since the last labelled point not
  // to collide with it. minGap is generous enough for a "12.09 · 68%"
  // two-line label in the expanded view, tighter for the compact one.
  const minLabelGap = expanded ? 46 : 26;
  let lastLabelX = -Infinity;
  const labelled = points.map((p) => {
    const show = p.x - lastLabelX >= minLabelGap;
    if (show) lastLabelX = p.x;
    return show;
  });

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
      {/* "Zwei Modi im Diagramm-Hintergrund"-Auftrag — Grundmodus keeps
       * all six zone bands, exactly as before. Erweiterter Modus swaps
       * that for a single comfort-tinted band over the person's own
       * calibrated window plus a gray "currently unreachable calm"
       * band toward the calmer side — matching the ladder slider's own
       * dynamic coloring. The plotted line/points always use the real
       * biological value either way; only this background changes. */}
      <>
        {calibratedBands.map((b) => (
          <rect key={b.id} x={padX} y={yAt(b.min)} width={width - padX - 8} height={Math.max(yAt(b.max) - yAt(b.min), 1)} fill={`${b.color}1a`} />
        ))}
        {calibratedBands.map((b, i) => {
          if (i === 0) return null;
          const y = yAt(b.min);
          return <line key={b.id} x1={padX} y1={y} x2={width - 8} y2={y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 4" />;
        })}
        {expanded &&
          calibratedBands.map((b) => {
            const zoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
            return (
              <text key={b.id} x={4} y={yAt((b.min + b.max) / 2) + 3} fontSize={9.5} fill={b.color} fontWeight={600}>
                {zoneT.label}
              </text>
            );
          })}
      </>

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
          {labelled[i] &&
            (expanded ? (
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
            ))}
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
