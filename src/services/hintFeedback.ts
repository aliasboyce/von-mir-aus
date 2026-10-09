import { playSound } from './sounds';
import type { UserSettings } from '../data/types';

/**
 * "Nicht-visuell: Hinweise still / mit Klang / mit Vibration" — what a NEW
 * reminder does besides appearing in the Postfach, while the app is open.
 * Separate from the click-sound and haptic switches (those are about
 * tapping); this one is only about incoming hints. Default is 'still':
 * nothing should startle anyone unless they chose it. A chosen sound plays
 * even when click sounds are off, because it was asked for explicitly.
 */
export type HintMode = NonNullable<UserSettings['hintMode']>;

export function vibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function notifyHint(mode: HintMode | undefined): void {
  if (mode === 'klang') {
    playSound('settle', { soundsEnabled: true });
  } else if (mode === 'vibration' && vibrationSupported()) {
    navigator.vibrate([180, 90, 180]);
  }
}
