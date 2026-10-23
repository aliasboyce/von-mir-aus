import { POLYVAGAL_ZONE_META, POLYVAGAL_ZONE_ORDER } from './polyvagalMeta';
import { useT } from '../../i18n';
import type { PolyvagalZone } from '../../data/types';

interface MiniCurvePoint {
  zone: PolyvagalZone;
  createdAt: string;
}

interface MiniCurveProps {
  points: MiniCurvePoint[];
  width?: number;
  height?: number;
}

/**
 * Deliberately reuses the same three-row/zone-based layout as the full
 * PolyvagalDayChart (see PolyvagalDayChart.tsx) at a much smaller size —
 * this always renders the actual points passed in, never placeholder data.
 */
export function MiniCurve({ points, width = 120, height = 40 }: MiniCurveProps) {
  const t = useT();
  if (points.length === 0) return null;

  const padY = 4;
  const rowHeight = (height - padY * 2) / 2;
  const sorted = [...points].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function xFor(iso: string): number {
    const d = new Date(iso);
    const minutes = d.getHours() * 60 + d.getMinutes();
    return 2 + (minutes / (24 * 60)) * (width - 4);
  }

  const coords = sorted.map((p) => ({
    x: xFor(p.createdAt),
    y: padY + POLYVAGAL_ZONE_META[p.zone].y * rowHeight,
    color: POLYVAGAL_ZONE_META[p.zone].color,
  }));

  const pathD = coords.length > 1 ? `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}` : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      style={{ maxWidth: width, height: 'auto', display: 'block' }}
      role="img"
      aria-label={t.polyvagal.curvePreview}
    >
      {POLYVAGAL_ZONE_ORDER.map((zone, i) => (
        <line
          key={zone}
          x1={0}
          y1={padY + i * rowHeight}
          x2={width}
          y2={padY + i * rowHeight}
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="1 3"
        />
      ))}
      {pathD && <path d={pathD} fill="none" stroke="var(--color-text-faint)" strokeWidth={1} opacity={0.5} />}
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2.6} fill={c.color} />
      ))}
    </svg>
  );
}
