import { useEffect, useState } from 'react';
import type { WeatherCondition } from '../../data/types';

interface WeatherAnimationProps {
  condition: WeatherCondition;
}

/**
 * A brief (2.5s), calm animation that makes the just-picked weather
 * condition felt, not just read as a word - deliberately restrained:
 * no bright flashes, no fast movement, no full-bleed takeover.
 */
export function WeatherAnimation({ condition }: WeatherAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timeout);
  }, [condition]);

  if (!visible) return null;

  const isSun = condition === 'klar' || condition === 'sonnig';
  const isClouds = condition === 'bewoelkt' || condition === 'windig';
  const isRain = condition === 'regnerisch';
  const isStorm = condition === 'gewitter';
  const isMist = condition === 'nebel';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[var(--radius-lg)]" aria-hidden="true">
      {isSun && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 20%, var(--color-accent-clay) 0%, transparent 65%)',
            opacity: 0.22,
            animation: 'weather-sun-glow 2.5s ease-out both',
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
              animation: `weather-cloud-drift 2.5s ease-in-out ${i * 0.2}s both`,
            }}
          />
        ))}

      {isRain &&
        Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${8 + i * 9}%`,
              top: -10,
              width: 2,
              height: 12,
              background: 'var(--color-primary)',
              opacity: 0.3,
              animation: `weather-rain-fall 1.1s linear ${i * 0.12}s infinite`,
            }}
          />
        ))}

      {isStorm && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: 'var(--color-text)', opacity: 0.05, animation: 'weather-storm-flash 2.5s ease-in-out both' }}
          />
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${10 + i * 11}%`,
                top: -10,
                width: 2,
                height: 16,
                background: 'var(--color-primary)',
                opacity: 0.35,
                animation: `weather-rain-fall 0.7s linear ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {isMist && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--color-text-faint) 50%, transparent 100%)',
            opacity: 0.14,
            animation: 'weather-mist-drift 2.5s ease-in-out both',
          }}
        />
      )}
    </div>
  );
}
