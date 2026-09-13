import type { UserSettings } from '../data/types';
import { showVisualHapticPulse } from './visualHapticBus';

/**
 * "Haptisches Feedback"-Auftrag — the Web Vibration API
 * (navigator.vibrate) is the only haptics mechanism reliably
 * available to a PWA without a native wrapper. It works on Android
 * Chrome; iOS Safari does not implement it at all (no vibration API
 * on iOS web/PWA as of this writing).
 *
 * "Haptik-Alternative fuers iPhone"-Auftrag — rather than just
 * silently doing nothing on iOS, a very soft VISUAL pulse (a brief,
 * gentle glow around the screen edge, see visualHapticBus.ts +
 * VisualHapticPulse.tsx) stands in for the missing vibration wherever
 * it's genuinely unsupported. Real vibration is always tried first;
 * the visual pulse only fires as a fallback when the API doesn't
 * exist at all, never as a double-up alongside a real vibration.
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

const supportsVibration = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function triggerHaptic(kind: HapticKind, settings: Pick<UserSettings, 'hapticsEnabled'>) {
  if (!settings.hapticsEnabled) return;
  if (!supportsVibration) {
    // No real vibration possible on this device/browser at all (iOS) —
    // the visual pulse is the whole point of the fallback here, not
    // an extra on top of a working vibration.
    showVisualHapticPulse(kind);
    return;
  }
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw if called outside a user gesture — never
    // let a missing/failed vibration break the actual interaction.
  }
}

/** TEMPORAER — fuer die Haptik-Auswahl mit dem Nutzer. */
export function previewVibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // preview only
  }
}
