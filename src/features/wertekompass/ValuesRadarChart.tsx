/**
 * "Verbinden, glätten" regression round, Section 3 — the original
 * Zugangsrad's visual technique (AccessWheelChart.tsx), reused rather
 * than reinvented: same concentric rings, same spokes-with-wrapped-
 * labels approach, same filled polygon connecting the points. The
 * difference is what feeds it — AccessWheelChart takes a fixed set of
 * ~7 life-access domains with a manually-set 0–100 slider value each;
 * this takes an arbitrary, variable-length list of values with a
 * derived weight each (how often that value showed up recently), and
 * only plots the top few so the chart stays readable regardless of how
 * many values exist in the underlying vocabulary.
 */
interface ValuesRadarChartProps {
  items: { label: string; weight: number }[]; // weight expected 0–1
  /** Optional — when provided, tapping a value's label or point opens
   * it (e.g. its personal ValueCardModal), matching the explicit
   * "beim Antippen kann die Lebensrichtung geöffnet werden" request.
   * Omit for purely decorative uses of this chart. */
  onSelect?: (label: string) => void;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = 92;
const MARGIN = 46;

function pointFor(index: number, total: number, weight: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const r = weight * MAX_RADIUS;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

export function ValuesRadarChart({ items, onSelect }: ValuesRadarChartProps) {
  const total = items.length;
  if (total < 3) return null; // a polygon needs at least 3 points to read as a shape

  const polygonPoints = items.map((item, i) => {
    const p = pointFor(i, total, item.weight);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg
      viewBox={`${-MARGIN} ${-MARGIN} ${SIZE + MARGIN * 2} ${SIZE + MARGIN * 2}`}
      width="100%"
      style={{ overflow: 'visible' }}
      role="img"
      aria-hidden={onSelect ? undefined : true}
    >
      {[25, 50, 75, 100].map((ring) => (
        <circle key={ring} cx={CENTER} cy={CENTER} r={(ring / 100) * MAX_RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {items.map((item, i) => {
        const outer = pointFor(i, total, 1);
        const labelPos = pointFor(i, total, 1.28);
        const words = item.label.split(' ');
        const lines = words.length > 1 && item.label.length > 10 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [item.label];
        return (
          <g
            key={item.label}
            onClick={onSelect ? () => onSelect(item.label) : undefined}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          >
            <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" fontSize="9.5" fill={onSelect ? 'var(--color-primary)' : 'var(--color-text-faint)'}>
              {lines.map((line, li) => (
                <tspan key={li} x={labelPos.x} dy={li === 0 ? (lines.length > 1 ? '-0.3em' : '0.3em') : '1.15em'}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill="var(--color-primary)" fillOpacity={0.22} stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" />
      {items.map((item, i) => {
        const p = pointFor(i, total, item.weight);
        return (
          <circle
            key={item.label}
            cx={p.x}
            cy={p.y}
            r={6}
            fill="var(--color-primary)"
            onClick={onSelect ? () => onSelect(item.label) : undefined}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          />
        );
      })}
    </svg>
  );
}
