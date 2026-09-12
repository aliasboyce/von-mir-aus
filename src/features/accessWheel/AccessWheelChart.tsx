import { ACCESS_WHEEL_DOMAIN_META } from './accessWheelMeta';
import { useT } from '../../i18n';
import type { AccessWheelEntry, AccessWheelDomain } from '../../data/types';

interface AccessWheelChartProps {
  entries: AccessWheelEntry[];
  order: AccessWheelDomain[];
}

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = 92;
// Generous margin around the drawn chart so long two-line labels near the
// left/right edges (e.g. "Eigenständige Handlung") have room and are never
// clipped by the SVG viewport.
const MARGIN = 46;

function pointFor(index: number, total: number, value: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const r = (value / 100) * MAX_RADIUS;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

export function AccessWheelChart({ entries, order }: AccessWheelChartProps) {
  const t = useT();
  const total = order.length;

  const byDomain = new Map(entries.map((e) => [e.domain, e]));
  const polygonPoints = order
    .map((domain, i) => {
      const entry = byDomain.get(domain);
      const p = pointFor(i, total, entry?.accessibility ?? 0);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`${-MARGIN} ${-MARGIN} ${SIZE + MARGIN * 2} ${SIZE + MARGIN * 2}`}
      width="100%"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label={t.accessWheel.title}
    >
      {/* concentric rings */}
      {[25, 50, 75, 100].map((ring) => (
        <circle
          key={ring}
          cx={CENTER}
          cy={CENTER}
          r={(ring / 100) * MAX_RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}
      {/* spokes + labels */}
      {order.map((domain, i) => {
        const outer = pointFor(i, total, 100);
        const labelPos = pointFor(i, total, 128);
        const Meta = ACCESS_WHEEL_DOMAIN_META[domain];
        const label = Meta.label(t);
        // Long two-word labels (like "Eigenständige Handlung") wrap onto a
        // second line instead of extending further sideways — keeps every
        // label's width roughly similar regardless of text length.
        const words = label.split(' ');
        const lines = words.length > 1 && label.length > 10 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [label];

        return (
          <g key={domain}>
            <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" fontSize="9.5" fill="var(--color-text-faint)">
              {lines.map((line, li) => (
                <tspan key={li} x={labelPos.x} dy={li === 0 ? (lines.length > 1 ? '-0.3em' : '0.3em') : '1.15em'}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
      {/* filled shape */}
      <polygon points={polygonPoints} fill="var(--color-primary)" fillOpacity={0.22} stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" />
      {order.map((domain, i) => {
        const entry = byDomain.get(domain);
        const p = pointFor(i, total, entry?.accessibility ?? 0);
        return <circle key={domain} cx={p.x} cy={p.y} r={4} fill="var(--color-primary)" />;
      })}
    </svg>
  );
}
