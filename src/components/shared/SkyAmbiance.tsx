import { useMemo } from 'react';
import { phaseFor, seasonFor, archProgress, pick, type SkyPhase } from '../../services/skyTime';

const SKY_GRADIENTS: Record<SkyPhase, string> = {
  sunrise: 'linear-gradient(180deg, #fde4c8 0%, #fbd3a8 35%, var(--color-bg) 100%)',
  day: 'linear-gradient(180deg, #cfe6f5 0%, #e6f1f7 35%, var(--color-bg) 100%)',
  sunset: 'linear-gradient(180deg, #f3c6a1 0%, #e8a898 35%, var(--color-bg) 100%)',
  night: 'linear-gradient(180deg, #2b3350 0%, #3c4568 35%, var(--color-bg) 100%)',
};


/** "D, E und I abwechselnd"-Auftrag — three chosen moon looks, one
 * picked at random per mount so the night sky doesn't always look
 * identical: a cool silver-blue crescent, a cream-toned full moon
 * with faint craters, and a cool silver-blue full moon with a few
 * stars scattered around it. */
type MoonVariant = 'crescent' | 'craters' | 'starry';
const MOON_VARIANTS: MoonVariant[] = ['crescent', 'craters', 'starry'];
const STAR_POSITIONS = [
  { top: '18%', left: '14%', size: 2 },
  { top: '32%', left: '78%', size: 2 },
  { top: '58%', left: '10%', size: 1.5 },
  { top: '12%', left: '55%', size: 1.5 },
  { top: '70%', left: '82%', size: 2 },
];

/** "Herbst: Wechsel aus A, B und C"-Auftrag — three leaf looks: the
 * original small four-brown-tone set, a bigger-leaf version of the
 * same colors, and a higher-contrast red/yellow/brown mix. */
type HerbstVariant = 'klein' | 'gross' | 'kontrast';
const HERBST_VARIANTS: HerbstVariant[] = ['klein', 'gross', 'kontrast'];
const HERBST_COLORS: Record<HerbstVariant, string[]> = {
  klein: ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'],
  gross: ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'],
  kontrast: ['#d43d2f', '#e8b800', '#a8542f', '#c7883a'],
};
const HERBST_SIZE: Record<HerbstVariant, { w: number; h: number }> = {
  klein: { w: 7, h: 5 },
  gross: { w: 13, h: 9 },
  kontrast: { w: 7, h: 5 },
};

/** "Winter: B Schneeflocken und C und D in Abwechslung"-Auftrag —
 * three looks: real snowflake glyphs, a denser field of plain dots,
 * and the plain-dot look with a soft glow. */
type WinterVariant = 'flocken' | 'dicht' | 'glitzer';
const WINTER_VARIANTS: WinterVariant[] = ['flocken', 'dicht', 'glitzer'];

/** "Fruehling: A und D im Mix"-Auftrag — the original round petals,
 * alternating with a paler, more understated version. */
type FruehlingVariant = 'normal' | 'dezent';
const FRUEHLING_VARIANTS: FruehlingVariant[] = ['normal', 'dezent'];

/** "Sommer: Gluehwuermchen und Schmetterlinge"-Auftrag. */
type SommerVariant = 'gluehwuermchen' | 'schmetterlinge';
const SOMMER_VARIANTS: SommerVariant[] = ['gluehwuermchen', 'schmetterlinge'];

/**
 * "Die App soll lebendiger werden, naturnah, rhythmisch — Sonne geht
 * morgens auf, mittags scheint sie, abends/nachts der Mond, dazu eine
 * Jahreszeit"-Auftrag, verfeinert nach Bildvergleich mit dem Nutzer. A
 * calm, low-opacity ambient background layer for the home screen: sky
 * color and sun/moon position follow the actual local time of day
 * (recomputed once per mount, not a ticking clock — this is ambience
 * on opening the app, not a live animation to watch). Sun styling is
 * one fixed, chosen combination (golden + rays + glints); moon and
 * every season each cycle randomly between a few chosen looks so the
 * sky doesn't look identical every time. Purely decorative:
 * aria-hidden, pointer-events none, sits behind all real content.
 */
export function SkyAmbiance() {
  const { phase, season, arch, moonVariant, herbstVariant, winterVariant, fruehlingVariant, sommerVariant } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const ph = phaseFor(hour);
    return {
      phase: ph,
      season: seasonFor(now.getMonth()),
      arch: archProgress(hour, ph),
      moonVariant: pick(MOON_VARIANTS),
      herbstVariant: pick(HERBST_VARIANTS),
      winterVariant: pick(WINTER_VARIANTS),
      fruehlingVariant: pick(FRUEHLING_VARIANTS),
      sommerVariant: pick(SOMMER_VARIANTS),
    };
  }, []);

  const isNight = phase === 'night';
  // Horizontal position drifts a little with the arc too, purely for
  // visual variety — not meant to track a real compass direction.
  const cx = 12 + arch * 76; // percent
  const cy = 90 - arch * 78; // percent, higher arch = higher in the sky

  const moonSize = 36;
  const creamGradient = 'radial-gradient(circle at 35% 35%, #f4f2ea 0%, #d9d6c9 60%, #c3c0b3 100%)';
  const silverGradient = 'radial-gradient(circle at 35% 35%, #eef2fb 0%, #c9d3e8 55%, #9aa8c4 100%)';
  const silverGlow = '0 0 20px 7px rgba(180,195,225,0.4)';
  const creamGlow = '0 0 18px 6px rgba(217,214,201,0.35)';

  // "B kraeftiger golden, aber mit Strahlen und Glanzpunkten"-Auftrag —
  // one fixed combined sun look, not a rotation.
  const sunSize = 42;
  const sunGradient = 'radial-gradient(circle at 35% 35%, #fff2b8 0%, #ffc23d 55%, #e8880f 100%)';
  const sunGlow = '0 0 30px 11px rgba(255,170,30,0.45)';
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    // z-index -1 (not 0) is deliberate: within the relative-positioned
    // page wrapper this sits in, a negative z-index paints before ALL
    // normal in-flow content (title, buttons, cards) regardless of
    // their own z-index, so nothing on the page needs its own
    // stacking fix just to read correctly on top of this background.
    <div className="absolute inset-x-0 top-0 h-[220px] overflow-hidden rounded-t-[inherit] pointer-events-none" aria-hidden="true" style={{ zIndex: -1 }}>
      <div className="absolute inset-0" style={{ background: SKY_GRADIENTS[phase], animation: 'sky-settle-in 1.4s ease-out both' }} />

      {/* "I — Sterne im Himmel"-Auftrag — only this moon variant gets
       * them, positioned relative to the moon so they scale with its
       * arc position rather than being scattered across the whole sky. */}
      {isNight && moonVariant === 'starry' &&
        STAR_POSITIONS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, background: '#fff', opacity: 0.8 }}
          />
        ))}

      {/* Sun or one of the three moon looks, positioned along the day's arc */}
      {isNight ? (
        moonVariant === 'crescent' ? (
          <div
            className="absolute"
            style={{ left: `${cx}%`, top: `${cy}%`, width: moonSize, height: moonSize, transform: 'translate(-50%, -50%)', animation: 'sky-settle-in 1.6s ease-out both' }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: silverGradient, boxShadow: silverGlow }} />
            {/* the "dark" bite is just the night sky's own base tone,
             * offset over the lit circle to carve out a crescent shape
             * without needing an actual clip-path. */}
            <div className="absolute rounded-full" style={{ top: 0, left: moonSize * 0.32, width: moonSize, height: moonSize, background: '#3c4568' }} />
          </div>
        ) : moonVariant === 'craters' ? (
          <div
            className="absolute rounded-full"
            style={{ left: `${cx}%`, top: `${cy}%`, width: moonSize, height: moonSize, transform: 'translate(-50%, -50%)', background: creamGradient, boxShadow: creamGlow, animation: 'sky-settle-in 1.6s ease-out both' }}
          >
            <div className="absolute rounded-full" style={{ top: '22%', left: '26%', width: 6, height: 6, background: 'rgba(160,155,140,0.4)' }} />
            <div className="absolute rounded-full" style={{ top: '48%', left: '55%', width: 8, height: 8, background: 'rgba(160,155,140,0.35)' }} />
            <div className="absolute rounded-full" style={{ top: '60%', left: '20%', width: 4, height: 4, background: 'rgba(160,155,140,0.4)' }} />
          </div>
        ) : (
          <div
            className="absolute rounded-full"
            style={{ left: `${cx}%`, top: `${cy}%`, width: moonSize, height: moonSize, transform: 'translate(-50%, -50%)', background: silverGradient, boxShadow: silverGlow, animation: 'sky-settle-in 1.6s ease-out both' }}
          />
        )
      ) : (
        <div
          className="absolute"
          style={{ left: `${cx}%`, top: `${cy}%`, width: sunSize * 2, height: sunSize * 2, transform: 'translate(-50%, -50%)', animation: 'sky-settle-in 1.6s ease-out both' }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <g stroke="#ffcf70" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
              {rayAngles.map((deg) => (
                <line
                  key={deg}
                  x1={50 + Math.cos((deg * Math.PI) / 180) * 32}
                  y1={50 + Math.sin((deg * Math.PI) / 180) * 32}
                  x2={50 + Math.cos((deg * Math.PI) / 180) * 41}
                  y2={50 + Math.sin((deg * Math.PI) / 180) * 41}
                />
              ))}
            </g>
          </svg>
          <div
            className="absolute rounded-full"
            style={{ top: '50%', left: '50%', width: sunSize, height: sunSize, transform: 'translate(-50%, -50%)', background: sunGradient, boxShadow: sunGlow }}
          />
          {/* glint sparkles */}
          <div className="absolute rounded-full" style={{ top: '30%', left: '78%', width: 3, height: 3, background: '#fff3c4', boxShadow: '0 0 4px 2px rgba(255,243,196,0.7)' }} />
          <div className="absolute rounded-full" style={{ top: '68%', left: '84%', width: 2, height: 2, background: '#fff3c4', boxShadow: '0 0 3px 1px rgba(255,243,196,0.6)' }} />
        </div>
      )}

      {/* Seasonal particles */}
      {season === 'herbst' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 13}%`,
              top: -10,
              width: HERBST_SIZE[herbstVariant].w,
              height: HERBST_SIZE[herbstVariant].h,
              borderRadius: '2px 8px',
              background: HERBST_COLORS[herbstVariant][i % HERBST_COLORS[herbstVariant].length],
              animation: `leaf-fall ${7 + (i % 3)}s linear ${i * 1.1}s infinite`,
            }}
          />
        ))}
      {season === 'winter' && winterVariant === 'flocken' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${6 + i * 13}%`,
              top: -14,
              fontSize: 10 + (i % 3) * 4,
              color: '#fff',
              animation: `snow-fall-ambient ${8 + (i % 3)}s linear ${i * 1.3}s infinite`,
            }}
          >
            ❄
          </div>
        ))}
      {season === 'winter' && winterVariant === 'dicht' &&
        Array.from({ length: 13 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${4 + i * 7.5}%`,
              top: -10,
              width: 4,
              height: 4,
              background: '#ffffff',
              animation: `snow-fall-ambient ${8 + (i % 3)}s linear ${i * 0.7}s infinite`,
            }}
          />
        ))}
      {season === 'winter' && winterVariant === 'glitzer' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${6 + i * 13}%`,
              top: -10,
              width: 4,
              height: 4,
              background: '#ffffff',
              boxShadow: '0 0 5px 2px rgba(255,255,255,0.6)',
              animation: `snow-fall-ambient ${8 + (i % 3)}s linear ${i * 1.3}s infinite`,
            }}
          />
        ))}
      {season === 'fruehling' &&
        Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 13}%`,
              top: -10,
              width: 6,
              height: 6,
              opacity: fruehlingVariant === 'dezent' ? 0.5 : 1,
              background: i % 2 === 0 ? '#f6c9d6' : '#fdeef2',
              animation: `petal-fall ${8 + (i % 3)}s linear ${i * 1.2}s infinite`,
            }}
          />
        ))}
      {season === 'sommer' && sommerVariant === 'gluehwuermchen' &&
        Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${15 + i * 17}%`,
              top: `${20 + (i % 3) * 15}%`,
              width: 5,
              height: 5,
              background: '#fff4c2',
              boxShadow: '0 0 8px 3px rgba(255,244,194,0.7)',
              animation: `pollen-drift ${4 + (i % 3)}s ease-in-out ${i * 0.6}s infinite`,
            }}
          />
        ))}
      {season === 'sommer' && sommerVariant === 'schmetterlinge' &&
        Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 25}%`,
              top: `${25 + (i % 2) * 25}%`,
              fontSize: 12 + (i % 2) * 3,
              animation: `pollen-drift ${5 + (i % 2)}s ease-in-out ${i * 0.8}s infinite`,
            }}
          >
            🦋
          </div>
        ))}
    </div>
  );
}
