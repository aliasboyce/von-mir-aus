import { createKeyValueStore } from './storage/keyValueStore';

/** 1 = default size. Bounds chosen so the companion can never become so
 * small it's hard to tap, or so large it risks covering important
 * buttons or spilling off a narrow phone screen. */
export const COMPANION_SCALE_MIN = 0.75;
export const COMPANION_SCALE_MAX = 1.5;
const DEFAULT_SCALE = 1;

const store = createKeyValueStore<number>('companion-scale', DEFAULT_SCALE);

export function getCompanionScale(): number {
  const value = store.get();
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_SCALE;
  return Math.max(COMPANION_SCALE_MIN, Math.min(COMPANION_SCALE_MAX, value));
}

export function setCompanionScale(scale: number): void {
  store.set(Math.max(COMPANION_SCALE_MIN, Math.min(COMPANION_SCALE_MAX, scale)));
}
