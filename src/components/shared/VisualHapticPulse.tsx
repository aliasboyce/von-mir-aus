import { useEffect, useRef, useState } from 'react';
import { registerVisualHapticListener } from '../../services/visualHapticBus';

/**
 * "Haptik-Alternative fuers iPhone"-Auftrag — a very soft, warm glow
 * along the screen edges, briefly appearing and fading, standing in
 * for the vibration iOS Safari doesn't support. Each pulse gets a
 * fresh key so the CSS animation restarts cleanly even if pulses
 * arrive close together (e.g. two taps in quick succession).
 */
export function VisualHapticPulse() {
  const [pulse, setPulse] = useState<{ id: number; intensity: 'tap' | 'select' | 'settle' } | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    return registerVisualHapticListener((intensity) => {
      counter.current += 1;
      setPulse({ id: counter.current, intensity });
    });
  }, []);

  if (!pulse) return null;

  const duration = pulse.intensity === 'settle' ? 420 : pulse.intensity === 'select' ? 320 : 220;
  const cls = pulse.intensity === 'settle' ? 'visual-haptic-pulse visual-haptic-pulse--strong' : 'visual-haptic-pulse';

  return (
    <div
      key={pulse.id}
      aria-hidden="true"
      className={cls}
      style={{ animationDuration: `${duration}ms` }}
      onAnimationEnd={() => setPulse(null)}
    />
  );
}
