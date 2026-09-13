import type { UserSettings } from '../data/types';

/**
 * "Haptisches Feedback"-Auftrag — the Web Vibration API
 * (navigator.vibrate) is the only haptics mechanism reliably
 * available to a PWA without a native wrapper. It works on Android
 * Chrome; iOS Safari does not implement it at all (no vibration API
 * on iOS web/PWA as of this writing) — calls simply become silent
 * no-ops there rather than erroring, so this degrades gracefully.
 *
 * "Visueller Ersatz irritiert"-Auftrag — a visual glow-pulse fallback
 * for iOS (where real vibration isn't possible) was tried and
 * removed again per direct feedback ("blitzt komisch, irritiert").
 * iOS users simply don't get a haptic-equivalent cue for now; sound
 * (which works fine there) carries the feedback instead.
 *
 * Three short, deliberately subtle patterns — never used everywhere,
 * only at the specific moments named in each call site:
 *   tap    — "I really just tapped something" confirmation (short)
 *   select — choosing a state/value that gets saved (slightly longer)
 *   settle — a small completion moment (bridge finished, pass ended)
 */
type HapticKind = 'tap' | 'select' | 'settle';

const PATTERNS: Record<HapticKind, number | number[]> = {
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
