import { useMemo } from 'react';
import type { GardenEntry, GardenPlantStyle } from '../../data/types';
import { progressFor, stageForProgress } from './gardenGrowth';
import { currentPhaseAndSeason, pick, type SkyPhase, type Season } from '../../services/skyTime';

interface PlantProps {
  x: number;
  groundY: number;
  stage: number;
  style: GardenPlantStyle;
  faded?: boolean;
  variant: number;
}

const PETAL_COLORS = ['#C1495C', '#C1683F', '#8A5CB0', '#B08A3F', '#C16FA0'];
const LEAF_GREENS = ['#3F9C7A', '#4F9C6A', '#3F8C9C', '#5C9C6A'];

/** Legacy single-word styles from before the variety expansion map
 * forward to a specific new style, so an existing saved garden never
 * silently loses its plant or breaks — it just becomes one specific
 * member of its new, richer family instead of a generic placeholder. */
export function normalizePlantStyle(style: string): GardenPlantStyle {
  const legacyMap: Record<string, GardenPlantStyle> = {
    bluete: 'bluete_rose',
    baum: 'baum_rund',
  };
  const valid: GardenPlantStyle[] = [
    'bluete_rose', 'bluete_gaensebluemchen', 'bluete_mohn', 'bluete_tulpe', 'bluete_sonnenblume', 'bluete_lavendel',
    'strauch', 'ranke', 'sukkulente',
    'baum_rund', 'baum_schlank', 'baum_ausladend', 'baum_bluetenbaum', 'baum_nadelbaum',
  ];
  if (valid.includes(style as GardenPlantStyle)) return style as GardenPlantStyle;
  return legacyMap[style] ?? 'bluete_rose';
}

export const ALL_PLANT_STYLES: GardenPlantStyle[] = [
  'bluete_rose', 'bluete_gaensebluemchen', 'bluete_mohn', 'bluete_tulpe', 'bluete_sonnenblume', 'bluete_lavendel',
  'strauch', 'ranke', 'sukkulente',
  'baum_rund', 'baum_schlank', 'baum_ausladend', 'baum_bluetenbaum', 'baum_nadelbaum',
];

/**
 * Nine genuinely distinct hand-drawn-feeling plant/tree illustrations —
 * three separate flower families (not just one flower shape recolored),
 * three separate tree silhouettes, plus shrub/vine/succulent. Built from
 * layered flat shapes (no gradients — many Plant instances share one
 * <svg>, and gradient <defs> would need per-instance unique ids). Calm
 * and a little poetic, not a literal cartoon gardening-game asset, but
 * with real shape variety so different entries genuinely look different
 * from each other, not just differently colored.
 */
/**
 * Point 2 — growth must never visibly plateau, even at 200+ days.
 * Rather than rebuild all fourteen plant styles with three more
 * hand-drawn stages each, long-term maturity (stage 8-10, roughly
 * 200-450+ days of engagement) is expressed as a small, universal
 * "flourishing" decoration layered above any plant — a few soft
 * sparkles that grow in number the longer someone has kept coming
 * back. Works identically for every style, and is honest about what
 * it represents: not a bigger plant, but a visible sign of sustained
 * care over a long stretch of time.
 */
function MaturitySparkle({ x, groundY, stage, variant }: { x: number; groundY: number; stage: number; variant: number }) {
  const count = Math.min(3, stage - 7); // 1 at stage 8, 2 at stage 9, 3 at stage 10+
  const color = PETAL_COLORS[(variant + 2) % PETAL_COLORS.length];
  const positions = [
    { dx: -16, dy: -58 },
    { dx: 14, dy: -68 },
    { dx: 0, dy: -80 },
  ];
  return (
    <g opacity={0.85}>
      {positions.slice(0, count).map((p, i) => (
        <g key={i} transform={`translate(${x + p.dx}, ${groundY + p.dy})`}>
          <path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill={color} />
        </g>
      ))}
    </g>
  );
}

/**
 * Point 2 — a visible, meaningful watering moment on every "Heute
 * erledigt" tap, not just a technical loading-style flourish. A simple
 * can tilts in and pours a small stream of droplets onto the ground
 * right where the plant stands, with a soft ripple where they land —
 * gone within about a second and a half, never blocking the next
 * interaction (see the setTimeout in GardenPage.tsx's checkIn()).
 */
function WateringAnimation({ x, groundY }: { x: number; groundY: number }) {
  const spoutTipX = x + 24;
  const spoutTipY = groundY - 70;
  const dropDelays = [0.15, 0.35, 0.55, 0.75];
  return (
    <g>
      <g style={{ animation: 'garden-water-can 1.3s ease-in-out both', transformOrigin: `${x + 4}px ${groundY - 68}px` }}>
        <g transform={`translate(${x - 8}, ${groundY - 82})`}>
          <rect x="0" y="6" width="16" height="12" rx="3" fill="var(--color-primary)" />
          <path d="M3,6 C3,0 13,0 13,6" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
          <path d="M15,10 L24,4" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      {dropDelays.map((delay, i) => (
        <circle
          key={i}
          cx={spoutTipX + (i - 1.5) * 2.5}
          cy={spoutTipY}
          r="1.8"
          fill="var(--color-primary)"
          style={{ animation: `garden-water-drop 0.6s ease-in ${delay}s infinite` }}
        />
      ))}
      <ellipse
        cx={x}
        cy={groundY - 2}
        rx="10"
        ry="3"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        style={{ animation: 'garden-water-ripple 0.9s ease-out 0.3s infinite', transformOrigin: `${x}px ${groundY - 2}px` }}
      />
    </g>
  );
}

function Plant({ x, groundY, stage, style, faded, variant }: PlantProps) {  const opacity = faded ? 0.35 : 1;
  const petal = PETAL_COLORS[variant % PETAL_COLORS.length];
  const leaf = LEAF_GREENS[variant % LEAF_GREENS.length];
  const stemColor = leaf;

  // --- Rose: layered, cupped, spiraling petals ---
  if (style === 'bluete_rose') {
    const h = 10 + stage * 6.5;
    const headR = 4 + Math.min(stage, 7) * 1.3;
    return (
      <g opacity={opacity}>
        {stage >= 1 && (
          <path d={`M${x},${groundY} C${x + 1},${groundY - h * 0.5} ${x - 2},${groundY - h * 0.8} ${x},${groundY - h}`} stroke={stemColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}
        {stage >= 2 && (
          <path d={`M${x},${groundY - h * 0.45} C${x - 7},${groundY - h * 0.45 - 5} ${x - 10},${groundY - h * 0.45} ${x - 13},${groundY - h * 0.45 + 3}`} stroke={leaf} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
        {stage >= 3 && (
          <path d={`M${x},${groundY - h * 0.7} C${x + 8},${groundY - h * 0.7 - 5} ${x + 11},${groundY - h * 0.7} ${x + 14},${groundY - h * 0.7 + 3}`} stroke={leaf} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
        {stage >= 4 && (
          <g>
            <circle cx={x} cy={groundY - h} r={headR * 0.55} fill={petal} opacity="0.5" />
            {[0, 90, 180, 270].map((a) => {
              const rad = (a * Math.PI) / 180;
              const px = x + Math.cos(rad) * headR * 0.42;
              const py = groundY - h + Math.sin(rad) * headR * 0.42;
              return <ellipse key={a} cx={px} cy={py} rx={headR * 0.5} ry={headR * 0.36} fill={petal} opacity="0.75" transform={`rotate(${a + 20} ${px} ${py})`} />;
            })}
            {stage >= 5 &&
              [45, 135, 225, 315].map((a) => {
                const rad = (a * Math.PI) / 180;
                const px = x + Math.cos(rad) * headR * 0.75;
                const py = groundY - h + Math.sin(rad) * headR * 0.75;
                return <ellipse key={a} cx={px} cy={py} rx={headR * 0.48} ry={headR * 0.34} fill={petal} opacity="0.92" transform={`rotate(${a + 15} ${px} ${py})`} />;
              })}
          </g>
        )}
        {stage >= 6 && (
          <g opacity="0.85">
            <circle cx={x - 16} cy={groundY - h * 0.5} r={headR * 0.4} fill={petal} opacity="0.9" />
          </g>
        )}
      </g>
    );
  }

  // --- Daisy: many thin white/pale petals, yellow center ---
  if (style === 'bluete_gaensebluemchen') {
    const h = 8 + stage * 6;
    const petalCount = 10;
    const r = 4 + Math.min(stage, 7);
    return (
      <g opacity={opacity}>
        {stage >= 1 && <path d={`M${x},${groundY} L${x},${groundY - h}`} stroke={stemColor} strokeWidth="1.8" strokeLinecap="round" />}
        {stage >= 3 && (
          <path d={`M${x},${groundY - h * 0.5} C${x - 6},${groundY - h * 0.5 - 4} ${x - 9},${groundY - h * 0.5} ${x - 11},${groundY - h * 0.5 + 3}`} stroke={leaf} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        )}
        {stage >= 4 && (
          <g>
            {Array.from({ length: petalCount }, (_, i) => {
              const angle = (360 / petalCount) * i;
              const rad = (angle * Math.PI) / 180;
              const px = x + Math.cos(rad) * r * 1.1;
              const py = groundY - h + Math.sin(rad) * r * 1.1;
              return <ellipse key={i} cx={px} cy={py} rx={r * 0.32} ry={r * 0.85} fill="#FBF7EF" stroke="#E8DFCB" strokeWidth="0.5" transform={`rotate(${angle} ${px} ${py})`} />;
            })}
            <circle cx={x} cy={groundY - h} r={r * 0.5} fill="#E8B23D" />
          </g>
        )}
        {stage >= 6 && (
          <g transform={`translate(-16, ${-h * 0.35})`} opacity="0.9">
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (360 / 8) * i;
              const rad = (angle * Math.PI) / 180;
              const px = x + Math.cos(rad) * (r * 0.7);
              const py = groundY - h * 0.7 + Math.sin(rad) * (r * 0.7);
              return <ellipse key={i} cx={px} cy={py} rx={r * 0.22} ry={r * 0.55} fill="#FBF7EF" stroke="#E8DFCB" strokeWidth="0.4" transform={`rotate(${angle} ${px} ${py})`} />;
            })}
            <circle cx={x} cy={groundY - h * 0.7} r={r * 0.32} fill="#E8B23D" />
          </g>
        )}
      </g>
    );
  }

  // --- Poppy: large ruffled petals, dark center ---
  if (style === 'bluete_mohn') {
    const h = 10 + stage * 6.5;
    const r = 5 + Math.min(stage, 7) * 1.2;
    return (
      <g opacity={opacity}>
        {stage >= 1 && (
          <path d={`M${x},${groundY} C${x - 2},${groundY - h * 0.6} ${x + 2},${groundY - h * 0.85} ${x},${groundY - h}`} stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {stage >= 3 && (
          <path d={`M${x},${groundY - h * 0.5} C${x + 7},${groundY - h * 0.5 - 4} ${x + 10},${groundY - h * 0.5} ${x + 12},${groundY - h * 0.5 + 4}`} stroke={leaf} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        )}
        {stage >= 4 && (
          <g>
            {[315, 45, 135, 225].map((a) => {
              const rad = (a * Math.PI) / 180;
              const px = x + Math.cos(rad) * r * 0.55;
              const py = groundY - h + Math.sin(rad) * r * 0.55;
              return <ellipse key={a} cx={px} cy={py} rx={r * 0.75} ry={r * 0.62} fill="#D1443A" opacity="0.88" transform={`rotate(${a} ${px} ${py})`} />;
            })}
            <circle cx={x} cy={groundY - h} r={r * 0.28} fill="#2A2320" />
          </g>
        )}
        {stage >= 6 && (
          <g transform="translate(15, -6)" opacity="0.85">
            <circle cx={x} cy={groundY - h * 0.55} r={r * 0.32} fill="#2A2320" />
            {[0, 120, 240].map((a) => {
              const rad = (a * Math.PI) / 180;
              const px = x + Math.cos(rad) * r * 0.4;
              const py = groundY - h * 0.55 + Math.sin(rad) * r * 0.4;
              return <ellipse key={a} cx={px} cy={py} rx={r * 0.4} ry={r * 0.32} fill="#D1443A" opacity="0.8" transform={`rotate(${a} ${px} ${py})`} />;
            })}
          </g>
        )}
      </g>
    );
  }

  // --- Tulip: simple closed cup-shaped bloom on a straight stem ---
  if (style === 'bluete_tulpe') {
    const h = 9 + stage * 6;
    const bloomW = 4 + Math.min(stage, 7) * 1.1;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <path d={`M${x},${groundY} L${x},${groundY - h}`} stroke={stemColor} strokeWidth="2.1" strokeLinecap="round" />}
        {stage >= 3 && (
          <path
            d={`M${x - 3},${groundY - h * 0.4} C${x - 9},${groundY - h * 0.35} ${x - 10},${groundY - h * 0.55} ${x - 6},${groundY - h * 0.65}`}
            stroke={leaf}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {stage >= 4 && (
          <path
            d={`M${x - bloomW},${groundY - h} Q${x - bloomW},${groundY - h - bloomW * 1.6} ${x},${groundY - h - bloomW * 1.7} Q${x + bloomW},${groundY - h - bloomW * 1.6} ${x + bloomW},${groundY - h} Q${x},${groundY - h + bloomW * 0.55} ${x - bloomW},${groundY - h} Z`}
            fill={petal}
            opacity="0.92"
          />
        )}
        {stage >= 6 && (
          <path
            d={`M${x - 16},${groundY - h * 0.55} Q${x - 16},${groundY - h * 0.55 - bloomW * 1.3} ${x - 13},${groundY - h * 0.55 - bloomW * 1.4} Q${x - 10},${groundY - h * 0.55 - bloomW * 1.3} ${x - 10},${groundY - h * 0.55} Q${x - 13},${groundY - h * 0.55 + bloomW * 0.45} ${x - 16},${groundY - h * 0.55} Z`}
            fill={petal}
            opacity="0.8"
          />
        )}
      </g>
    );
  }

  // --- Sunflower: large flower head, many pointed petals, dark center ---
  if (style === 'bluete_sonnenblume') {
    const h = 12 + stage * 7.5;
    const r = 5 + Math.min(stage, 7) * 1.4;
    const petalCount = 12;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <path d={`M${x},${groundY} C${x - 2},${groundY - h * 0.5} ${x + 2},${groundY - h * 0.85} ${x},${groundY - h}`} stroke={stemColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
        {stage >= 2 && (
          <ellipse cx={x - 8} cy={groundY - h * 0.35} rx="7" ry="4" fill={leaf} opacity="0.8" transform={`rotate(-20 ${x - 8} ${groundY - h * 0.35})`} />
        )}
        {stage >= 4 && (
          <g>
            {Array.from({ length: petalCount }, (_, i) => {
              const angle = (360 / petalCount) * i;
              const rad = (angle * Math.PI) / 180;
              const px = x + Math.cos(rad) * r * 1.15;
              const py = groundY - h + Math.sin(rad) * r * 1.15;
              return <ellipse key={i} cx={px} cy={py} rx={r * 0.36} ry={r * 0.92} fill="#E8B23D" transform={`rotate(${angle} ${px} ${py})`} />;
            })}
            <circle cx={x} cy={groundY - h} r={r * 0.62} fill="#5C4A2E" />
          </g>
        )}
      </g>
    );
  }

  // --- Lavender: several small purple flower spikes, narrow leaves ---
  if (style === 'bluete_lavendel') {
    const h = 8 + stage * 5.5;
    const spikes = Math.min(4, 1 + Math.floor(stage / 1.5));
    return (
      <g opacity={opacity}>
        {stage >= 1 && <path d={`M${x - 4},${groundY} L${x - 4},${groundY - h * 0.85}`} stroke={stemColor} strokeWidth="1.5" strokeLinecap="round" />}
        {stage >= 2 &&
          Array.from({ length: spikes }, (_, i) => {
            const sx = x - 4 + (i - spikes / 2) * 4.5;
            const sh = h * (0.75 + (i % 2) * 0.2);
            return <line key={i} x1={sx} y1={groundY} x2={sx} y2={groundY - sh * 0.85} stroke={stemColor} strokeWidth="1.3" strokeLinecap="round" />;
          })}
        {stage >= 4 &&
          Array.from({ length: spikes }, (_, i) => {
            const sx = x - 4 + (i - spikes / 2) * 4.5;
            const sh = h * (0.75 + (i % 2) * 0.2);
            const topY = groundY - sh * 0.85;
            return (
              <g key={i}>
                {[0, 3, 6, 9].map((dy) => (
                  <circle key={dy} cx={sx} cy={topY - dy} r="1.7" fill={petal} opacity="0.85" />
                ))}
              </g>
            );
          })}
      </g>
    );
  }

  if (style === 'strauch') {
    const size = 4 + stage * 2.2;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <rect x={x - 1.3} y={groundY - 5 - size * 0.4} width="2.6" height={5 + size * 0.4} fill={stemColor} />}
        {stage >= 2 && (
          <>
            <ellipse cx={x} cy={groundY - 6 - size} rx={size} ry={size * 0.8} fill={leaf} opacity="0.85" />
            <ellipse cx={x - size * 0.5} cy={groundY - 4 - size * 0.7} rx={size * 0.65} ry={size * 0.5} fill={leaf} opacity="0.65" />
            <ellipse cx={x + size * 0.5} cy={groundY - 4 - size * 0.6} rx={size * 0.6} ry={size * 0.48} fill={leaf} opacity="0.65" />
          </>
        )}
        {stage >= 4 && (
          <>
            <ellipse cx={x - size * 0.7} cy={groundY - 8 - size * 0.9} rx={size * 0.5} ry={size * 0.4} fill={leaf} opacity="0.55" />
            <ellipse cx={x + size * 0.65} cy={groundY - 9 - size} rx={size * 0.5} ry={size * 0.4} fill={leaf} opacity="0.55" />
          </>
        )}
        {stage >= 5 &&
          [-0.5, 0.1, 0.6].map((f, i) => (
            <circle key={i} cx={x + f * size} cy={groundY - 7 - size * (0.7 + i * 0.15)} r={1.8} fill={petal} opacity="0.9" />
          ))}
        {stage >= 6 && <circle cx={x - size * 0.2} cy={groundY - 10 - size * 0.9} r="1.8" fill={petal} opacity="0.9" />}
      </g>
    );
  }

  if (style === 'ranke') {
    const reach = 14 + stage * 5;
    const path = `M${x},${groundY} C${x + 8},${groundY - reach * 0.35} ${x - 9},${groundY - reach * 0.65} ${x + 6},${groundY - reach}`;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <path d={path} stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />}
        {stage >= 2 &&
          Array.from({ length: Math.min(4, Math.ceil(stage / 1.5)) }, (_, i) => {
            const t = (i + 1) / 5;
            const px = x + Math.sin(t * Math.PI * 1.4) * 8;
            const py = groundY - reach * t;
            return (
              <ellipse
                key={i}
                cx={px + (i % 2 === 0 ? 4 : -4)}
                cy={py}
                rx="4"
                ry="2.4"
                fill={leaf}
                opacity="0.8"
                transform={`rotate(${i % 2 === 0 ? -30 : 30} ${px} ${py})`}
              />
            );
          })}
        {stage >= 5 && <circle cx={x + 6} cy={groundY - reach} r="3" fill={petal} opacity="0.9" />}
        {stage >= 6 && <circle cx={x - 2} cy={groundY - reach * 0.7} r="2.4" fill={petal} opacity="0.8" />}
      </g>
    );
  }

  if (style === 'sukkulente') {
    const size = 3.5 + stage * 1.5;
    const leafCount = Math.min(8, 3 + stage);
    return (
      <g opacity={opacity}>
        {stage >= 1 &&
          Array.from({ length: leafCount }, (_, i) => {
            const angle = (360 / leafCount) * i;
            const rad = (angle * Math.PI) / 180;
            const r = size * (0.6 + (i % 2) * 0.25);
            const px = x + Math.cos(rad) * r * 0.5;
            const py = groundY - 2 + Math.sin(rad) * r * 0.28;
            return (
              <ellipse
                key={i}
                cx={px}
                cy={py}
                rx={r * 0.5}
                ry={r * 0.85}
                fill={leaf}
                opacity={0.55 + (i % 3) * 0.15}
                transform={`rotate(${angle} ${px} ${py})`}
              />
            );
          })}
        {stage >= 5 && <ellipse cx={x} cy={groundY - 2 - size} rx="2.4" ry="3.4" fill={petal} opacity="0.85" />}
      </g>
    );
  }

  // --- Round tree: classic trunk + oval canopy ---
  if (style === 'baum_rund') {
    const trunkH = 6 + Math.min(stage, 3) * 4;
    const canopyR = 3 + stage * 3.4;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <rect x={x - (1.2 + stage * 0.25)} y={groundY - trunkH} width={2.4 + stage * 0.5} height={trunkH} fill="#8A6A4A" />}
        {stage >= 2 && <circle cx={x} cy={groundY - trunkH - canopyR * 0.55} r={canopyR} fill={leaf} opacity="0.8" />}
        {stage >= 4 && (
          <>
            <circle cx={x - canopyR * 0.55} cy={groundY - trunkH - canopyR * 0.3} r={canopyR * 0.62} fill={leaf} opacity="0.6" />
            <circle cx={x + canopyR * 0.55} cy={groundY - trunkH - canopyR * 0.4} r={canopyR * 0.58} fill={leaf} opacity="0.6" />
          </>
        )}
        {stage >= 5 && <circle cx={x} cy={groundY - trunkH - canopyR * 0.9} r={canopyR * 0.55} fill={leaf} opacity="0.7" />}
        {stage >= 6 &&
          [-0.5, 0, 0.5].map((f, i) => (
            <circle key={i} cx={x + f * canopyR} cy={groundY - trunkH - canopyR * (0.5 + i * 0.15)} r="2" fill={petal} opacity="0.85" />
          ))}
      </g>
    );
  }

  // --- Slender tree: tall, narrow, columnar (cypress-like) ---
  if (style === 'baum_schlank') {
    const h = 12 + stage * 8;
    const w = 3 + Math.min(stage, 7) * 1.1;
    return (
      <g opacity={opacity}>
        {stage >= 1 && <rect x={x - 1} y={groundY - Math.min(h, 10)} width="2" height={Math.min(h, 10)} fill="#8A6A4A" />}
        {stage >= 2 && (
          <path
            d={`M${x},${groundY - h} L${x - w},${groundY - h * 0.15} Q${x},${groundY - h * 0.05} ${x + w},${groundY - h * 0.15} Z`}
            fill={leaf}
            opacity="0.82"
          />
        )}
        {stage >= 4 && (
          <path
            d={`M${x},${groundY - h * 1.08} L${x - w * 0.65},${groundY - h * 0.4} Q${x},${groundY - h * 0.32} ${x + w * 0.65},${groundY - h * 0.4} Z`}
            fill={leaf}
            opacity="0.55"
          />
        )}
        {stage >= 6 &&
          [0.3, 0.6].map((f, i) => (
            <circle key={i} cx={x + (i === 0 ? -1 : 1) * w * 0.4} cy={groundY - h * (0.4 + f * 0.3)} r="1.6" fill={petal} opacity="0.8" />
          ))}
      </g>
    );
  }

  // --- Blossom tree: round canopy densely covered in small blossoms ---
  if (style === 'baum_bluetenbaum') {
    const trunkH = 6 + Math.min(stage, 3) * 4;
    const canopyR = 3 + stage * 3.2;
    const blossomCount = Math.min(14, stage * 2);
    return (
      <g opacity={opacity}>
        {stage >= 1 && <rect x={x - (1.2 + stage * 0.25)} y={groundY - trunkH} width={2.4 + stage * 0.5} height={trunkH} fill="#8A6A4A" />}
        {stage >= 2 && <circle cx={x} cy={groundY - trunkH - canopyR * 0.55} r={canopyR} fill={leaf} opacity="0.5" />}
        {stage >= 4 &&
          Array.from({ length: blossomCount }, (_, i) => {
            const angle = (360 / blossomCount) * i + (i % 2) * 15;
            const rad = (angle * Math.PI) / 180;
            const rr = canopyR * (0.35 + (i % 3) * 0.25);
            const bx = x + Math.cos(rad) * rr;
            const by = groundY - trunkH - canopyR * 0.55 + Math.sin(rad) * rr * 0.8;
            return <circle key={i} cx={bx} cy={by} r={1.6} fill={petal} opacity="0.9" />;
          })}
      </g>
    );
  }

  // --- Conifer: triangular, layered evergreen silhouette ---
  if (style === 'baum_nadelbaum') {
    const h = 12 + stage * 8;
    const w = 3 + Math.min(stage, 7) * 1.6;
    const tiers = Math.min(4, 1 + Math.floor(stage / 1.6));
    return (
      <g opacity={opacity}>
        {stage >= 1 && <rect x={x - 1} y={groundY - Math.min(h, 8)} width="2" height={Math.min(h, 8)} fill="#8A6A4A" />}
        {stage >= 2 &&
          Array.from({ length: tiers }, (_, i) => {
            const tierFrac = (i + 1) / tiers;
            const tierY = groundY - 6 - h * tierFrac * 0.85;
            const tierW = w * (1 - i * 0.22);
            return (
              <path
                key={i}
                d={`M${x},${tierY - h * 0.22} L${x - tierW},${tierY + h * 0.1} L${x + tierW},${tierY + h * 0.1} Z`}
                fill={leaf}
                opacity={0.55 + i * 0.12}
              />
            );
          })}
        {stage >= 6 && <circle cx={x} cy={groundY - 6 - h * 0.15} r="1.8" fill={petal} opacity="0.8" />}
      </g>
    );
  }

  // --- Spreading tree: wide canopy, visible branch clusters (oak-like) ---
  const trunkH = 5 + Math.min(stage, 3) * 3.5;
  const spread = 4 + stage * 4;
  return (
    <g opacity={opacity}>
      {stage >= 1 && <rect x={x - (1.4 + stage * 0.3)} y={groundY - trunkH} width={2.8 + stage * 0.6} height={trunkH} fill="#8A6A4A" />}
      {stage >= 2 && (
        <>
          <path d={`M${x},${groundY - trunkH} L${x - spread * 0.6},${groundY - trunkH - spread * 0.4}`} stroke="#8A6A4A" strokeWidth="1.6" />
          <path d={`M${x},${groundY - trunkH} L${x + spread * 0.6},${groundY - trunkH - spread * 0.35}`} stroke="#8A6A4A" strokeWidth="1.6" />
        </>
      )}
      {stage >= 3 && (
        <ellipse cx={x} cy={groundY - trunkH - spread * 0.35} rx={spread} ry={spread * 0.55} fill={leaf} opacity="0.75" />
      )}
      {stage >= 5 && (
        <>
          <ellipse cx={x - spread * 0.7} cy={groundY - trunkH - spread * 0.15} rx={spread * 0.45} ry={spread * 0.3} fill={leaf} opacity="0.55" />
          <ellipse cx={x + spread * 0.7} cy={groundY - trunkH - spread * 0.2} rx={spread * 0.45} ry={spread * 0.3} fill={leaf} opacity="0.55" />
        </>
      )}
      {stage >= 6 &&
        [-0.6, 0, 0.6].map((f, i) => (
          <circle key={i} cx={x + f * spread} cy={groundY - trunkH - spread * (0.3 + i * 0.1)} r="2" fill={petal} opacity="0.8" />
        ))}
    </g>
  );
}

interface GardenSceneProps {
  entries: GardenEntry[];
  width?: number;
  height?: number;
  previewMode?: boolean;
  /** entry ids that reached a new growth stage since the garden was
   * last opened — see gardenGrowthAnimation.ts. Purely additive: when
   * empty (the default), nothing here changes from before. */
  justGrewIds?: Set<string>;
  /** the entry currently mid watering-animation (see checkIn() in
   * GardenPage.tsx) — plays a watering can pouring onto that one
   * plant, immediately on the click that caused it rather than only
   * being inferred afterwards. */
  wateringId?: string | null;
}

function variantForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return hash;
}

/** Small deterministic pseudo-random generator seeded by index, so the
 * scattered background elements below stay in the same place across
 * re-renders instead of jittering every time the component updates. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

/**
 * The "does the whole garden ever feel like a landscape, not N isolated
 * boxes" answer (see Punkt 3.6/3.7) — a background layer of small grass
 * tufts, distant flower dots, and (at high engagement) faint far-off
 * tree silhouettes, whose DENSITY scales with cumulative progress
 * across every entry in the garden combined. This is deliberately
 * decorative and untied to any single plant reaching a stage cap: it's
 * how the garden as a whole keeps visibly developing at 200+ combined
 * days, long after individual plants have reached their own richest
 * stage, without inventing new per-plant stages indefinitely.
 */
function LushnessLayer({ totalProgress, groundY }: { totalProgress: number; groundY: number }) {
  // 0 at a brand new garden, growing gradually, capped at 5 so it stays
  // a gentle background layer rather than eventually overwhelming the
  // actual tracked plants, which remain the visual focus.
  const tier = Math.min(5, Math.floor(totalProgress / 40));
  if (tier <= 0) return null;

  const tuftCount = tier * 4;
  const farTreeCount = tier >= 3 ? tier - 2 : 0;

  return (
    <g opacity="0.55" aria-hidden="true">
      {Array.from({ length: tuftCount }, (_, i) => {
        const x = 8 + seeded(i + 1) * 304;
        const y = groundY + 3 + seeded(i + 50) * 5;
        const isFlower = i % 5 === 0;
        return isFlower ? (
          <circle key={`f${i}`} cx={x} cy={y} r="1.4" fill="var(--color-accent-clay)" opacity="0.6" />
        ) : (
          <path
            key={`t${i}`}
            d={`M${x},${y} L${x - 1.5},${y - 4} M${x},${y} L${x},${y - 5} M${x},${y} L${x + 1.5},${y - 4}`}
            stroke="var(--color-primary)"
            strokeWidth="0.8"
            opacity="0.5"
          />
        );
      })}
      {Array.from({ length: farTreeCount }, (_, i) => {
        const x = 20 + seeded(i + 200) * 280;
        const h = 10 + seeded(i + 300) * 6;
        return (
          <path
            key={`bg-tree-${i}`}
            d={`M${x},${groundY - 2} L${x},${groundY - h * 0.35} M${x},${groundY - h * 0.3} C${x - 6},${groundY - h * 0.5} ${x - 6},${groundY - h} ${x},${groundY - h * 0.9} C${x + 6},${groundY - h} ${x + 6},${groundY - h * 0.5} ${x},${groundY - h * 0.3} Z`}
            fill="var(--color-primary)"
            opacity="0.28"
          />
        );
      })}
    </g>
  );
}

const SKY_GRADIENT_STOPS: Record<SkyPhase, [string, string]> = {
  sunrise: ['#fde4c8', '#fbd3a8'],
  day: ['#cfe6f5', '#e6f1f7'],
  sunset: ['#f3c6a1', '#e8a898'],
  night: ['#2b3350', '#3c4568'],
};

/** "Lebendiger machen — auch der Garten"-Auftrag — the same
 * time-of-day/season rhythm SkyAmbiance brought to the home screen,
 * adapted to SVG so the garden the person is literally growing also
 * visibly lives through a day and a season, not just a generic static
 * sky. Computed once per mount (garden entries changing shouldn't
 * reroll the sky), sun/moon variant randomized the same way as the
 * home screen for visual variety. */
function GardenSky({ groundY }: { groundY: number }) {
  const { phase, season, arch, moonVariant } = useMemo(() => {
    const { phase, season, arch } = currentPhaseAndSeason();
    return { phase, season, arch, moonVariant: pick(['crescent', 'craters', 'starry'] as const) };
  }, []);

  const isNight = phase === 'night';
  const cx = 30 + arch * 250;
  const cy = groundY - 20 - arch * 110;
  const [c1, c2] = SKY_GRADIENT_STOPS[phase];

  return (
    <>
      <defs>
        <linearGradient id="garden-sky-time" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height={groundY} fill="url(#garden-sky-time)" opacity={isNight ? 0.4 : 0.45} />

      {isNight && moonVariant === 'starry' &&
        [
          { x: 40, y: 20 }, { x: 260, y: 35 }, { x: 30, y: 70 }, { x: 180, y: 15 }, { x: 280, y: 90 },
        ].map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={1.3} fill="#fff" opacity={0.75} />)}

      {isNight ? (
        moonVariant === 'crescent' ? (
          <g>
            <circle cx={cx} cy={cy} r={11} fill="#c9d3e8" opacity={0.9} />
            <circle cx={cx + 4} cy={cy - 2} r={11} fill={c2} />
          </g>
        ) : moonVariant === 'craters' ? (
          <g>
            <circle cx={cx} cy={cy} r={11} fill="#d9d6c9" opacity={0.9} />
            <circle cx={cx - 3} cy={cy - 3} r={1.8} fill="rgba(160,155,140,0.4)" />
            <circle cx={cx + 3} cy={cy + 2} r={2.2} fill="rgba(160,155,140,0.35)" />
          </g>
        ) : (
          <circle cx={cx} cy={cy} r={11} fill="#c9d3e8" opacity={0.9} />
        )
      ) : (
        <g>
          <circle cx={cx} cy={cy} r={13} fill="#ffc23d" opacity={0.85} />
          <circle cx={cx - 2} cy={cy - 2} r={13} fill="#fff2b8" opacity={0.5} />
        </g>
      )}

      <GardenSeasonParticles season={season} groundY={groundY} />
    </>
  );
}

function GardenSeasonParticles({ season, groundY }: { season: Season; groundY: number }) {
  const positions = [40, 90, 140, 190, 240, 280];
  if (season === 'herbst') {
    const colors = ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'];
    return (
      <>
        {positions.map((x, i) => (
          <ellipse key={i} cx={x} cy={20 + (i % 3) * 30} rx={3} ry={2} fill={colors[i % colors.length]} opacity={0.6} transform={`rotate(${i * 25} ${x} ${20 + (i % 3) * 30})`} />
        ))}
      </>
    );
  }
  if (season === 'winter') {
    return (
      <>
        {positions.map((x, i) => (
          <circle key={i} cx={x} cy={15 + (i % 3) * 35} r={1.6} fill="#fff" opacity={0.75} />
        ))}
      </>
    );
  }
  if (season === 'fruehling') {
    return (
      <>
        {positions.map((x, i) => (
          <circle key={i} cx={x} cy={18 + (i % 3) * 28} r={2.2} fill={i % 2 === 0 ? '#f6c9d6' : '#fdeef2'} opacity={0.65} />
        ))}
      </>
    );
  }
  // sommer — a few warm drifting light points near the ground
  return (
    <>
      {positions.slice(0, 4).map((x, i) => (
        <circle key={i} cx={x} cy={groundY - 20 - (i % 2) * 15} r={1.8} fill="#fff4c2" opacity={0.6} />
      ))}
    </>
  );
}

export function GardenScene({ entries, width = 320, height = 190, previewMode = false, justGrewIds, wateringId }: GardenSceneProps) {
  const groundY = 160;
  const visible = entries.filter((e) => e.status !== 'ended');
  const slots = Math.max(visible.length, 1);
  const spacing = 280 / (slots + 1);
  const totalProgress = previewMode ? 250 : visible.reduce((sum, e) => sum + progressFor(e), 0);

  return (
    <svg
      viewBox="0 0 320 190"
      width="100%"
      height={height}
      style={{ maxWidth: width, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-bg-soft)" />
          <stop offset="100%" stopColor="var(--color-surface)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height={groundY} fill="url(#garden-sky)" opacity="0.5" />
      {!previewMode && <GardenSky groundY={groundY} />}
      <path d={`M0,${groundY} Q160,${groundY - 8} 320,${groundY}`} fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d={`M0,${groundY + 2} Q160,${groundY - 6} 320,${groundY + 2} L320,190 L0,190 Z`} fill="var(--color-primary-soft)" opacity="0.18" />
      <LushnessLayer totalProgress={totalProgress} groundY={groundY} />

      {visible.length === 0 && !previewMode && <circle cx="160" cy={groundY - 2} r="2.5" fill="var(--color-text-faint)" />}

      {visible.map((entry, i) => {
        const x = 20 + spacing * (i + 1);
        const stage = previewMode ? 6 : stageForProgress(progressFor(entry));
        const justGrew = justGrewIds?.has(entry.id);
        return (
          <g
            key={entry.id}
            className={justGrew ? 'garden-grow-animate' : undefined}
            style={justGrew ? { transformOrigin: `${x}px ${groundY}px`, animation: 'garden-grow 1.6s cubic-bezier(0.34, 1.2, 0.64, 1) both' } : undefined}
          >
            <Plant
              x={x}
              groundY={groundY}
              stage={stage}
              style={normalizePlantStyle(entry.plantStyle)}
              variant={variantForId(entry.id)}
            />
            {stage >= 8 && <MaturitySparkle x={x} groundY={groundY} stage={stage} variant={variantForId(entry.id)} />}
            {wateringId === entry.id && <WateringAnimation x={x} groundY={groundY} />}
          </g>
        );
      })}
    </svg>
  );
}
