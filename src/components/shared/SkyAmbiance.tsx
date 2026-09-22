import { useMemo } from 'react';

type SkyPhase = 'sunrise' | 'day' | 'sunset' | 'night';
type Season = 'fruehling' | 'sommer' | 'herbst' | 'winter';

function phaseFor(hour: number): SkyPhase {
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'sunset';
  return 'night';
}

function seasonFor(month: number): Season {
  // Northern-hemisphere meteorological seasons (month is 0-11)
  if (month >= 2 && month <= 4) return 'fruehling';
  if (month >= 5 && month <= 7) return 'sommer';
  if (month >= 8 && month <= 10) return 'herbst';
  return 'winter';
}

const SKY_GRADIENTS: Record<SkyPhase, string> = {
  sunrise: 'linear-gradient(180deg, #fde4c8 0%, #fbd3a8 35%, var(--color-bg) 100%)',
  day: 'linear-gradient(180deg, #cfe6f5 0%, #e6f1f7 35%, var(--color-bg) 100%)',
  sunset: 'linear-gradient(180deg, #f3c6a1 0%, #e8a898 35%, var(--color-bg) 100%)',
  night: 'linear-gradient(180deg, #2b3350 0%, #3c4568 35%, var(--color-bg) 100%)',
};

/** 0 (just risen, low on the horizon) to 1 (highest point) to 0 (about to
 * set) — a simple arc, not literal astronomy, just enough to feel like
 * the sun/moon is genuinely somewhere in its day. */
function archProgress(hour: number, phase: SkyPhase): number {
  if (phase === 'sunrise') return Math.min(1, (hour - 5) / 3) * 0.4;
  if (phase === 'day') return 0.4 + Math.sin(((hour - 8) / 10) * Math.PI) * 0.6;
  if (phase === 'sunset') return Math.max(0, 1 - (hour - 18) / 3) * 0.4;
  // night: moon arcs gently too, peaking around 1-2am
  const nightHour = hour >= 21 ? hour - 21 : hour + 3; // 0..8 across 21:00-05:00
  return Math.max(0.08, Math.sin((nightHour / 8) * Math.PI) * 0.55);
}

const LEAF_COLORS = ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'];
const SEASON_PARTICLE_COUNT = 7;

/**
 * "Die App soll lebendiger werden, naturnah, rhythmisch — Sonne geht
 * morgens auf, mittags scheint sie, abends/nachts der Mond, dazu eine
 * Jahreszeit"-Auftrag. A calm, low-opacity ambient background layer for
 * the home screen: sky color and sun/moon position follow the actual
 * local time of day (recomputed once per mount, not a ticking clock —
 * this is ambience on opening the app, not a live animation to watch),
 * and a season-appropriate particle drift (falling leaves in autumn,
 * snow in winter, petals in spring, warm drifting light in summer)
 * layers on top. Purely decorative: aria-hidden, pointer-events none,
 * sits behind all real content.
 */
export function SkyAmbiance() {
  const { phase, season, arch } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const ph = phaseFor(hour);
    return { phase: ph, season: seasonFor(now.getMonth()), arch: archProgress(hour, ph) };
  }, []);

  const isNight = phase === 'night';
  // Horizontal position drifts a little with the arc too, purely for
  // visual variety — not meant to track a real compass direction.
  const cx = 12 + arch * 76; // percent
  const cy = 90 - arch * 78; // percent, higher arch = higher in the sky

  return (
    // z-index -1 (not 0) is deliberate: within the relative-positioned
    // page wrapper this sits in, a negative z-index paints before ALL
    // normal in-flow content (title, buttons, cards) regardless of
    // their own z-index, so nothing on the page needs its own
    // stacking fix just to read correctly on top of this background.
    <div className="absolute inset-x-0 top-0 h-[220px] overflow-hidden rounded-t-[inherit] pointer-events-none" aria-hidden="true" style={{ zIndex: -1 }}>
      <div className="absolute inset-0" style={{ background: SKY_GRADIENTS[phase], animation: 'sky-settle-in 1.4s ease-out both' }} />

      {/* Sun or moon, positioned along the day's arc */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${cx}%`,
          top: `${cy}%`,
          width: isNight ? 34 : 42,
          height: isNight ? 34 : 42,
          transform: 'translate(-50%, -50%)',
          background: isNight
            ? 'radial-gradient(circle at 35% 35%, #f4f2ea 0%, #d9d6c9 60%, #c3c0b3 100%)'
            : 'radial-gradient(circle at 35% 35%, #fff6d8 0%, #ffd873 55%, #f7a94d 100%)',
          boxShadow: isNight ? '0 0 18px 6px rgba(217,214,201,0.35)' : '0 0 28px 10px rgba(255,190,90,0.35)',
          animation: 'sky-settle-in 1.6s ease-out both',
        }}
      />

      {/* Seasonal particles */}
      {season === 'herbst' &&
        Array.from({ length: SEASON_PARTICLE_COUNT }, (_, i) => (
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
        Array.from({ length: SEASON_PARTICLE_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${6 + i * 13}%`,
              top: -10,
              width: 4,
              height: 4,
              background: '#ffffff',
              animation: `snow-fall-ambient ${8 + (i % 3)}s linear ${i * 1.3}s infinite`,
            }}
          />
        ))}
      {season === 'fruehling' &&
        Array.from({ length: SEASON_PARTICLE_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 13}%`,
              top: -10,
              width: 6,
              height: 6,
              background: i % 2 === 0 ? '#f6c9d6' : '#fdeef2',
              animation: `petal-fall ${8 + (i % 3)}s linear ${i * 1.2}s infinite`,
            }}
          />
        ))}
      {season === 'sommer' &&
        Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${15 + i * 17}%`,
              top: `${20 + (i % 3) * 15}%`,
              width: 3,
              height: 3,
              background: '#fff4c2',
              animation: `pollen-drift ${4 + (i % 3)}s ease-in-out ${i * 0.6}s infinite`,
            }}
          />
        ))}
    </div>
  );
}
