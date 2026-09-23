import type { WeatherCondition } from '../../data/types';

interface WeatherAnimationProps {
  condition: WeatherCondition;
}

/**
 * A calm, restrained ambient effect for the just-picked weather
 * condition — no bright flashes, no fast movement, no full-bleed
 * takeover.
 *
 * "Fuer jedes Wetter die passende Animation"-Auftrag — extended from
 * the original five conditions to cover all fifteen. Related
 * conditions share a visual family (brise/bewoelkt/windig all drift,
 * schnee/hagel/regnerisch all fall) rather than each getting a wholly
 * separate effect, so the set reads as one coherent system.
 *
 * "Als leiser Hintergrund bestehen bleiben, nicht nur kurz
 * aufblitzen"-Auftrag — this used to force itself invisible after a
 * fixed 2.5s via its own internal timer, regardless of how long the
 * person actually stayed on the reflect step reading their result.
 * Now it simply renders for as long as the caller keeps it mounted;
 * every effect below loops gently (weather-*-fall effects already
 * did, the ambient glow/drift ones are now infinite too) instead of
 * playing once and freezing on its final, invisible frame.
 */
export function WeatherAnimation({ condition }: WeatherAnimationProps) {
  const isSun = condition === 'klar' || condition === 'sonnig';
  const isClouds = condition === 'bewoelkt' || condition === 'windig';
  const isBreeze = condition === 'brise';
  const isRain = condition === 'regnerisch' || condition === 'sturm' || condition === 'hurrikan';
  const isStorm = condition === 'gewitter' || condition === 'sturm' || condition === 'hurrikan';
  const isMist = condition === 'nebel';
  const isSnow = condition === 'schnee';
  const isHail = condition === 'hagel';
  const isTornado = condition === 'tornado' || condition === 'hurrikan';
  const isHeat = condition === 'hitze';
  const isFrost = condition === 'frost';
  // Sturm/Hurrikan intensify the shared rain effect rather than
  // needing their own particle system — more drops, faster fall.
  const rainCount = condition === 'hurrikan' ? 16 : condition === 'sturm' ? 13 : condition === 'gewitter' ? 8 : 10;
  const rainSpeed = condition === 'hurrikan' ? 0.5 : condition === 'sturm' ? 0.6 : condition === 'gewitter' ? 0.7 : 1.1;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[var(--radius-lg)]" aria-hidden="true">
      {isSun && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 20%, var(--color-accent-clay) 0%, transparent 65%)',
            opacity: 0.22,
            animation: 'weather-sun-glow 6s ease-in-out infinite',
          }}
        />
      )}

      {isClouds &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${18 + i * 16}%`,
              width: 70 - i * 10,
              height: 22 - i * 3,
              background: 'var(--color-text-faint)',
              opacity: 0.16,
              animation: `weather-cloud-drift 7s ease-in-out ${i * 0.6}s infinite`,
            }}
          />
        ))}

      {isBreeze &&
        [0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${25 + i * 14}%`,
              left: '5%',
              width: 34,
              height: 3,
              background: 'var(--color-primary)',
              opacity: 0.18,
              animation: `weather-breeze-drift 5s ease-in-out ${i * 0.5}s infinite`,
            }}
          />
        ))}

      {isRain &&
        Array.from({ length: rainCount }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(100 / rainCount) * i + 3}%`,
              top: -10,
              width: 2,
              height: 12,
              background: 'var(--color-primary)',
              opacity: 0.3,
              animation: `weather-rain-fall ${rainSpeed}s linear ${i * 0.08}s infinite`,
            }}
          />
        ))}

      {isSnow &&
        Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(100 / 12) * i + 3}%`,
              top: -10,
              width: 4,
              height: 4,
              background: 'var(--color-surface)',
              boxShadow: '0 0 2px var(--color-text-faint)',
              opacity: 0.4,
              animation: `weather-snow-fall ${1.6 + (i % 3) * 0.3}s linear ${i * 0.15}s infinite`,
            }}
          />
        ))}

      {isHail &&
        Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(100 / 9) * i + 4}%`,
              top: -10,
              width: 3,
              height: 6,
              background: 'var(--color-text-faint)',
              opacity: 0.4,
              animation: `weather-hail-fall 0.6s linear ${i * 0.09}s infinite`,
            }}
          />
        ))}

      {isStorm && (
        <div
          className="absolute inset-0"
          style={{ background: 'var(--color-text)', opacity: 0.05, animation: 'weather-storm-flash 6s ease-in-out infinite' }}
        />
      )}

      {isMist && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--color-text-faint) 50%, transparent 100%)',
            opacity: 0.14,
            animation: 'weather-mist-drift 7s ease-in-out infinite',
          }}
        />
      )}

      {isTornado && (
        <div
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '45%',
            width: 90,
            height: 90,
            marginLeft: -45,
            marginTop: -45,
            border: '3px solid var(--color-text-faint)',
            borderRadius: '50% 50% 45% 45%',
            opacity: 0.18,
            animation: 'weather-tornado-spin 6s ease-in-out infinite',
          }}
        />
      )}

      {isHeat && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 60%, var(--color-accent-clay) 0%, transparent 70%)',
            opacity: 0.16,
            animation: 'weather-heat-shimmer 5s ease-in-out infinite',
          }}
        />
      )}

      {isFrost && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, var(--color-primary) 0%, transparent 60%)',
            opacity: 0.1,
            animation: 'weather-frost-crystallize 6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
