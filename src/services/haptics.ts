import type { UserSettings } from '../data/types';

/**
 * "Haptisches Feedback"-Auftrag — the Web Vibration API
 * (navigator.vibrate) is the only haptics mechanism reliably
 * available to a PWA without a native wrapper. It works on Android
 * Chrome; iOS Safari does not implement it at all (no vibration API
 * on iOS web/PWA as of this writing) — calls simply become silent
 * no-ops there rather than erroring, so this degrades gracefully
 * instead of needing per-platform branching.
 *
 * Three short, deliberately subtle patterns — never used everywhere,
 * only at the specific moments named in each call site:
 *   tap    — "I really just tapped something" confirmation (short)
 *   select — choosing a state/value that gets saved (slightly longer)
 *   settle — a small completion moment (bridge finished, pass ended)
 */
type HapticKind = 'tap' | 'select' | 'settle';

const PATTERNS: Record<HapticKind, number | number[]> = {
  // "Haptik geht gar nichts"-Auftrag — raised from 10/18ms. Many phone
  // vibration motors have a brief physical ramp-up before reaching
  // full amplitude, so pulses under ~20ms can be scheduled correctly
  // and still be effectively imperceptible. These are still short and
  // subtle, just long enough to actually register as a tap.
  tap: 25,
  select: 35,
  settle: [20, 50, 20],
};

export function triggerHaptic(kind: HapticKind, settings: Pick<UserSettings, 'hapticsEnabled'>) {
  if (!settings.hapticsEnabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw if called outside a user gesture — never
    // let a missing/failed vibration break the actual interaction.
  }
}
