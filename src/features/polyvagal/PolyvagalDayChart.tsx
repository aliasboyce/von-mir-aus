import { POLYVAGAL_ZONE_META, POLYVAGAL_ZONE_ORDER } from './polyvagalMeta';
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

export function PolyvagalDayChart({ checkIns, expanded = false }: PolyvagalDayChartProps) {
  const t = useT();
  const { settings } = useSettings();
  const width = expanded ? 640 : 320;
  const height = expanded ? 320 : 180;
  // The zone labels ("Ruhig & verbunden" etc.) render at a larger font size
  // when expanded — without giving them proportionally more left margin,
  // they visually collide with the dashed reference lines and the curve
  // itself, which is what made the enlarged chart look broken/overlapping.
  const padX = expanded ? 118 : 66;
  // Expanded mode also shows a little time label above each point — without
  // extra top margin, a point in the topmost row can push that label
  // outside the visible chart area.
  const padTop = expanded ? 28 : PAD_TOP;
  const rowHeight = (height - padTop - PAD_BOTTOM) / 2;
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Inverted on purpose (2 - value) rather than changing the y values in
  // polyvagalMeta.ts itself — those are also read by MiniCurve, the
  // weekly review, and other places that share this metadata, and this
  // keeps the fix scoped to this chart's own vertical pixel math.
  // Ventral (0) ends up at the bottom row, dorsal (2) at the top —
  // rising tension reads as rising on the page, the order this app
  // deliberately chose.
  const points = sorted.map((c) => ({
    x: xFor(new Date(c.createdAt), width, padX),
    y: padTop + (2 - POLYVAGAL_ZONE_META[c.zone].y) * rowHeight,
    zone: c.zone,
    time: new Date(c.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
  }));

  const pathD = points.length > 1 ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}` : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ height: 'auto', display: 'block', maxWidth: width, margin: '0 auto' }}
      role="img"
      aria-label={t.polyvagal.title}
    >
      {POLYVAGAL_ZONE_ORDER.map((zone, i) => (
        <g key={zone}>
          <line
            x1={padX}
            y1={padTop + (2 - i) * rowHeight}
            x2={width - 8}
            y2={padTop + (2 - i) * rowHeight}
            stroke="var(--color-border)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text
            x={4}
            y={padTop + (2 - i) * rowHeight + 3}
            fontSize={expanded ? 11 : 9}
            fill="var(--color-text-faint)"
          >
            {POLYVAGAL_ZONE_META[zone].label(t)}
          </text>
        </g>
      ))}

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
