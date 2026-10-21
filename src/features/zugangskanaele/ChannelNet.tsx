import { ACCESS_CHANNEL_ORDER } from './accessChannels';
import { useT } from '../../i18n';
import type { ChannelLevels } from '../../content/fitCriteria';

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = 92;
const MARGIN = 46;
/** radius (% of max) per level: nicht da / etwas / gut vorhanden. Not set = not drawn at all. */
const RADIUS_FOR_LEVEL = { 0: 8, 1: 55, 2: 95 } as const;

function pointFor(index: number, total: number, pct: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const r = (pct / 100) * MAX_RADIUS;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

function shape(levels: ChannelLevels) {
  return ACCESS_CHANNEL_ORDER.map((c, i) => {
    const p = pointFor(i, ACCESS_CHANNEL_ORDER.length, RADIUS_FOR_LEVEL[levels[c] ?? 0]);
    return `${p.x},${p.y}`;
  }).join(' ');
}

/**
 * The "Netz": the ten Zugangskanäle as a radar. Same visual language as the
 * Zugangsrad it grew out of. `compare` draws a second, dashed net — e.g. an
 * earlier Zustandsaufnahme — so a change is visible without any numbers.
 * `mini` drops the labels for use in lists.
 */
export function ChannelNet({ levels, compare, mini = false }: { levels: ChannelLevels; compare?: ChannelLevels | null; mini?: boolean }) {
  const t = useT();
  const total = ACCESS_CHANNEL_ORDER.length;
  const margin = mini ? 6 : MARGIN;
  return (
    <svg
      viewBox={`${-margin} ${-margin} ${SIZE + margin * 2} ${SIZE + margin * 2}`}
      width="100%"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label={t.zugangskanaele.page.netLabel}
    >
      {[25, 50, 75, 100].map((ring) => (
        <circle key={ring} cx={CENTER} cy={CENTER} r={(ring / 100) * MAX_RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {ACCESS_CHANNEL_ORDER.map((c, i) => {
        const outer = pointFor(i, total, 100);
        const labelPos = pointFor(i, total, 130);
        return (
          <g key={c}>
            <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="var(--color-border)" strokeWidth={1} />
            {!mini && (
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="var(--color-text-faint)">
                {t.zugangskanaele.short[c]}
              </text>
            )}
          </g>
        );
      })}
      {compare && (
        <polygon points={shape(compare)} fill="none" stroke="var(--color-text-faint)" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />
      )}
      <polygon points={shape(levels)} fill="var(--color-primary)" fillOpacity={0.22} stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" />
      {!mini &&
        ACCESS_CHANNEL_ORDER.map((c, i) => {
          if (levels[c] === undefined) return null;
          const p = pointFor(i, total, RADIUS_FOR_LEVEL[levels[c] ?? 0]);
          return <circle key={c} cx={p.x} cy={p.y} r={4} fill="var(--color-primary)" />;
        })}
    </svg>
  );
}
