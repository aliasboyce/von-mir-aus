import { useEffect, useState } from 'react';

interface GardenSunriseAnimationProps {
  active: boolean;
  onDone: () => void;
}

/**
 * A brief, gentle sunrise wash over the whole page, shown once when the
 * garden actually grew since it was last opened — see
 * gardenGrowthAnimation.ts for the "did it grow" detection this reuses.
 * Deliberately simple: a warm radial glow that fades in, holds briefly,
 * then fades back out, never a literal animated sun/horizon scene —
 * "schön und emotional, aber nicht hektisch" ruled out anything busier
 * than a soft light wash. Respects reduceMotion by simply never
 * mounting (checked by the caller), and removes itself from the DOM
 * entirely once finished rather than staying as an invisible layer.
 */
export function GardenSunriseAnimation({ active, onDone }: GardenSunriseAnimationProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>('in');

  useEffect(() => {
    if (!active) return;
    setPhase('in');
    const t1 = setTimeout(() => setPhase('hold'), 1200);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => {
      setPhase('done');
      onDone();
    }, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active || phase === 'done') return null;

  const opacity = phase === 'in' ? 1 : phase === 'hold' ? 1 : 0;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 1.2s ease-in-out',
        background: 'radial-gradient(ellipse at 50% 85%, rgba(255,209,140,0.55) 0%, rgba(255,180,120,0.28) 35%, rgba(255,180,120,0) 70%)',
      }}
    />
  );
}
