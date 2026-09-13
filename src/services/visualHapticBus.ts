type Listener = (intensity: 'tap' | 'select' | 'settle') => void;

let listener: Listener | null = null;

export function registerVisualHapticListener(fn: Listener) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function showVisualHapticPulse(intensity: 'tap' | 'select' | 'settle') {
  listener?.(intensity);
}
