import { useMemo } from 'react';
import { phaseFor, seasonFor, pick, type SkyPhase } from '../../services/skyTime';
import { useResolvedTheme } from '../../state/ThemeEffect';

/**
 * "Kugeln komplett weg, stattdessen nur Sonnenlicht und Sternenhimmel
 * ohne Koerper"-Auftrag — no circular sun/moon shape anywhere. Every
 * phase is purely a sky colour/glow treatment; night additionally
 * scatters stars. Six phases across the day (see skyTime.ts for the
 * exact hour boundaries), each background chosen from mockups shown
 * to and picked by the user directly:
 *   day            → 'D' (a bare radial colour shift, no shape)
 *   sunriseGlow    → 'A' (warm glow low on the horizon)
 *   sunriseGolden  → 'C' (whole sky tinted golden)
 *   sunsetGolden   → 'C' (whole sky in evening colour)
 *   sunsetGlow     → 'A' (deeper/redder horizon glow)
 *   night          → 'B'/'C'/'D'/'E' cycling at random per mount
 */
const SKY_BACKGROUNDS: Record<Exclude<SkyPhase, 'night'>, string> = {
  sunriseGlow: 'linear-gradient(180deg, #d8e6f0 0%, #f5d5c8 55%, #ffe4c2 78%, var(--color-bg) 100%)',
  sunriseGolden: 'linear-gradient(180deg, #fef3e2 0%, #fbe8d3 45%, var(--color-bg) 100%)',
  day: 'radial-gradient(circle at 70% -10%, #ffe4a8 0%, #cfe6f5 32%, var(--color-bg) 100%)',
  sunsetGolden: 'linear-gradient(180deg, #c9a8c4 0%, #e0a898 45%, var(--color-bg) 100%)',
  sunsetGlow: 'linear-gradient(180deg, #b8a8c4 0%, #d9a7ab 45%, #e8926e 75%, var(--color-bg) 100%)',
};
/** "Im Dunkelmodus ist die hellere Schrift nicht mehr lesbar"-Auftrag
 * — the light-mode gradients above are all light/warm, which is
 * exactly wrong once dark mode makes the page's own text light-
 * coloured too. Same phases, same character (still warm for
 * sunrise/sunset, still a bare colour-shift for day), but every stop
 * darkened enough that light text reads clearly on top. */
const SKY_BACKGROUNDS_DARK: Record<Exclude<SkyPhase, 'night'>, string> = {
  sunriseGlow: 'linear-gradient(180deg, #1f2937 0%, #3d2f35 55%, #4a3327 78%, var(--color-bg) 100%)',
  sunriseGolden: 'linear-gradient(180deg, #2e2a22 0%, #3a3226 45%, var(--color-bg) 100%)',
  day: 'radial-gradient(circle at 70% -10%, #3d3524 0%, #1f2937 32%, var(--color-bg) 100%)',
  sunsetGolden: 'linear-gradient(180deg, #2f2530 0%, #3d2b26 45%, var(--color-bg) 100%)',
  sunsetGlow: 'linear-gradient(180deg, #241f2e 0%, #332530 45%, #3d2820 75%, var(--color-bg) 100%)',
};
const NIGHT_BASE = 'linear-gradient(180deg, #2b3350 0%, #3c4568 35%, var(--color-bg) 100%)';

type NightVariant = 'stars' | 'glow' | 'dense' | 'veil' | 'twinkle';
const NIGHT_VARIANTS: NightVariant[] = ['glow', 'dense', 'veil', 'twinkle'];

const LEAF_COLORS = ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'];

export function SkyAmbiance() {
  const resolvedTheme = useResolvedTheme();
  const { phase, season, nightVariant } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    return {
      phase: phaseFor(hour),
      season: seasonFor(now.getMonth()),
      nightVariant: pick(NIGHT_VARIANTS),
    };
  }, []);

  const isNight = phase === 'night';
  const backgrounds = resolvedTheme === 'dark' ? SKY_BACKGROUNDS_DARK : SKY_BACKGROUNDS;
  const background = isNight ? NIGHT_BASE : backgrounds[phase];

  return (
    <div className="absolute inset-x-0 top-0 h-[220px] overflow-hidden rounded-t-[inherit] pointer-events-none" aria-hidden="true" style={{ zIndex: -1 }}>
      <div className="absolute inset-0" style={{ background, animation: 'sky-settle-in 1.4s ease-out both' }} />

      {isNight && <NightStars variant={nightVariant} />}

      {season === 'herbst' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 13}%`,
              top: -10,
              width: 7,
              height: 5,
              borderRadius: '2px 8px',
              background: LEAF_COLORS[i % LEAF_COLORS.length],
              animation: `leaf-fall ${7 + (i % 3)}s linear ${i * 1.1}s infinite`,
            }}
          />
        ))}
      {season === 'winter' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ left: `${6 + i * 13}%`, top: -10, width: 4, height: 4, background: '#ffffff', animation: `snow-fall-ambient ${8 + (i % 3)}s linear ${i * 1.3}s infinite` }}
          />
        ))}
      {season === 'fruehling' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ left: `${8 + i * 13}%`, top: -10, width: 6, height: 6, background: i % 2 === 0 ? '#f6c9d6' : '#fdeef2', animation: `petal-fall ${8 + (i % 3)}s linear ${i * 1.2}s infinite` }}
          />
        ))}
      {season === 'sommer' &&
        Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ left: `${15 + i * 17}%`, top: `${20 + (i % 3) * 15}%`, width: 3, height: 3, background: '#fff4c2', animation: `pollen-drift ${4 + (i % 3)}s ease-in-out ${i * 0.6}s infinite` }}
          />
        ))}
    </div>
  );
}

const STAR_POSITIONS = [
  { top: '10%', left: '10%' }, { top: '18%', left: '78%' }, { top: '32%', left: '30%' },
  { top: '8%', left: '55%' }, { top: '45%', left: '85%' }, { top: '55%', left: '15%' },
  { top: '28%', left: '92%' }, { top: '60%', left: '45%' }, { top: '40%', left: '5%' },
];

/** The four chosen night looks: B (glow) / C (dense) / D (veil) / E
 * (twinkle) — 'stars' (mockup A, plain scatter only) exists in the
 * type for completeness but isn't in the random pool per the user's
 * choice of B/C/D/E. */
function NightStars({ variant }: { variant: NightVariant }) {
  if (variant === 'glow') {
    return (
      <>
        <div className="absolute rounded-full" style={{ top: 10, left: '35%', width: 140, height: 140, background: 'radial-gradient(circle, rgba(220,225,250,0.3) 0%, transparent 65%)' }} />
        {STAR_POSITIONS.slice(0, 5).map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{ top: s.top, left: s.left, width: 2, height: 2, background: '#fff', opacity: 0.8 }} />
        ))}
      </>
    );
  }
  if (variant === 'dense') {
    return (
      <>
        {STAR_POSITIONS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ top: s.top, left: s.left, width: i % 3 === 0 ? 2.5 : 1.5, height: i % 3 === 0 ? 2.5 : 1.5, background: '#fff', opacity: 0.85, boxShadow: i % 3 === 0 ? '0 0 3px 1px rgba(255,255,255,0.5)' : 'none' }}
          />
        ))}
      </>
    );
  }
  if (variant === 'veil') {
    return (
      <>
        <div className="absolute inset-x-0 top-0" style={{ height: 90, background: 'linear-gradient(180deg, rgba(200,210,240,0.16) 0%, transparent 100%)' }} />
        {STAR_POSITIONS.slice(0, 5).map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{ top: s.top, left: s.left, width: 2, height: 2, background: '#fff', opacity: 0.8 }} />
        ))}
      </>
    );
  }
  // twinkle — varying sizes/opacity, no glow area
  return (
    <>
      {STAR_POSITIONS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{ top: s.top, left: s.left, width: i % 2 === 0 ? 2 : 1, height: i % 2 === 0 ? 2 : 1, background: '#fff', opacity: 0.4 + (i % 4) * 0.15 }}
        />
      ))}
    </>
  );
}
