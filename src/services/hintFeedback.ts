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

/** Sound and vibration can be chosen together ('beides'). */
export function notifyHint(mode: HintMode | undefined): void {
  if (mode === 'klang' || mode === 'beides') {
    playSound('settle', { soundsEnabled: true });
  }
  if ((mode === 'vibration' || mode === 'beides') && vibrationSupported()) {
    navigator.vibrate([180, 90, 180]);
  }
}

/** The two switches behind a hint mode, and back. */
export function hintFlags(mode: HintMode | undefined): { sound: boolean; vibration: boolean } {
  return { sound: mode === 'klang' || mode === 'beides', vibration: mode === 'vibration' || mode === 'beides' };
}

export function hintModeFrom(sound: boolean, vibration: boolean): HintMode {
  return sound && vibration ? 'beides' : sound ? 'klang' : vibration ? 'vibration' : 'still';
}
