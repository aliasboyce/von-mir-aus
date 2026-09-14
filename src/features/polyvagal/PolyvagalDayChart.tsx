import { POLYVAGAL_ZONE_ORDER, POLYVAGAL_ZONE_META } from './polyvagalMeta';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import type { PolyvagalCheckIn } from '../../data/types';

interface PolyvagalDayChartProps {
  checkIns: PolyvagalCheckIn[];
  expanded?: boolean;
}

const PAD_TOP = 16;
const PAD_BOTTOM = 16;

function xFor(date: Date, width: number, padX: number): number {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  return padX + (minutesSinceMidnight / (24 * 60)) * (width - padX - 12);
}

/**
 * "Nur noch eine Kurve, Status-Niveau vereint"-Auftrag — this used to
 * plot each check-in on one of three fixed rows (the zone only), with
 * two entirely separate charts (TensionDayChart, TensionHistoryChart)
 * covering the tensionValue number elsewhere on the same page. Since
 * tensionValue and zone are now literally the same single number
 * (see NervousSystemLadderSlider — the ladder's own raw value IS
 * tensionValue), this is now the one chart: a smooth continuous
 * position (falls back to the old 3-row snap only for older entries
 * saved before tensionValue existed), colored by zone.
 *
 * Orientation deliberately matches the ladder slider itself (calm/
 * ventral high on the page, shutdown/dorsal low) rather than the old
 * chart's inverted "tension rises visually" convention — the slider
 * is the primary interaction now, and the chart reading the same
 * direction as the control that feeds it matters more than preserving
 * the old convention.
 */
// "Reihenfolge korrigieren"-Auftrag — low values now sit near the top
// (dorsal/Hypoarousal) and high values near the bottom (ventral/
// Toleranzbereich), matching the corrected ladder slider order.
function yForCheckIn(c: PolyvagalCheckIn, padTop: number, height: number): number {
  const raw = c.tensionValue ?? { ventral: 83, sympathetic: 50, dorsal: 17 }[c.zone];
  return padTop + (raw / 100) * (height - padTop - PAD_BOTTOM);
}

export function PolyvagalDayChart({ checkIns, expanded = false }: PolyvagalDayChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const width = expanded ? 640 : 320;
  const height = expanded ? 320 : 180;
  const padX = expanded ? 118 : 66;
  const padTop = expanded ? 28 : PAD_TOP;
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const points = sorted.map((c) => ({
    x: xFor(new Date(c.createdAt), width, padX),
    y: yForCheckIn(c, padTop, height),
    zone: c.zone,
    time: new Date(c.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
  }));

  const pathD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}` : '';

  // Reference lines/labels at the same three zone boundaries the
  // ladder slider itself uses (67/34/0), converted to this chart's
  // continuous y-scale.
  const zoneBoundaries: { zone: (typeof POLYVAGAL_ZONE_ORDER)[number]; atValue: number }[] = [
    { zone: 'ventral', atValue: 83 },
    { zone: 'sympathetic', atValue: 50 },
    { zone: 'dorsal', atValue: 17 },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto' }}
      role="img"
      aria-label={t.polyvagal.title}
    >
      {zoneBoundaries.map(({ zone, atValue }) => {
        const y = padTop + (atValue / 100) * (height - padTop - PAD_BOTTOM);
        return (
          <g key={zone}>
            <line x1={padX} y1={y} x2={width - 8} y2={y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={4} y={y + 3} fontSize={expanded ? 11 : 9} fill="var(--color-text-faint)">
              {POLYVAGAL_ZONE_META[zone].label(t)}
            </text>
          </g>
        );
      })}

      {pathD && <path d={pathD} fill="none" stroke="var(--color-text-faint)" strokeWidth={1.5} opacity={0.5} />}

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={expanded ? 6 : 4.5} fill={POLYVAGAL_ZONE_META[p.zone].color} />
          {expanded && (
            <text x={p.x} y={p.y - 12} fontSize={9} textAnchor="middle" fill="var(--color-text-faint)">
              {p.time}
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
