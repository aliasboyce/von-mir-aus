/**
 * Optionale App-Sperre. A privacy screen, not encryption: it keeps curious eyes out of the app,
 * the data itself stays in the browser storage as before (and the privacy page says so).
 * Only a salted hash of the PIN is stored, never the PIN.
 */
import { useSyncExternalStore } from 'react';
import { createKeyValueStore } from './storage/keyValueStore';

export interface LockConfig {
  salt: string;
  hash: string;
  length: number;
  /** minutes in the background before the app locks again; 0 = at once, -1 = only when the app is opened */
  lockAfterMin: number;
}

const configStore = createKeyValueStore<LockConfig | null>('app-lock', null);

export const getLockConfig = (): LockConfig | null => configStore.get();

const hex = (buf: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(buf as ArrayBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

async function derive(pin: string, salt: string): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 60000 }, key, 256);
      return hex(bits);
    }
  } catch {
    // fall through to the simple hash
  }
  let h = 2166136261;
  const s = salt + pin;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'f' + (h >>> 0).toString(16);
}

export const validPin = (pin: string) => /^\d{4,6}$/.test(pin);

export async function setPin(pin: string, lockAfterMin = 1): Promise<void> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(12)));
  configStore.set({ salt, hash: await derive(pin, salt), length: pin.length, lockAfterMin });
}

export async function checkPin(pin: string): Promise<boolean> {
  const c = getLockConfig();
  if (!c) return true;
  return (await derive(pin, c.salt)) === c.hash;
}

export function setLockAfter(min: number): void {
  const c = getLockConfig();
  if (c) configStore.set({ ...c, lockAfterMin: min });
}

export function removeLock(): void {
  configStore.set(null);
  unlockNow();
}

/* ───── the "locked right now" state (in memory only: every app start begins locked when a PIN exists) ───── */
let locked = !!getLockConfig();
let covered = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const sub = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const lockNow = () => {
  if (getLockConfig()) {
    locked = true;
    emit();
  }
};
export const unlockNow = () => {
  locked = false;
  emit();
};
export const useLocked = () => useSyncExternalStore(sub, () => locked);

/** "Schnell weg": a neutral cover over everything; double tap brings the app back (or the PIN, if there is one) */
export const coverNow = () => {
  covered = true;
  emit();
};
export const uncover = () => {
  covered = false;
  emit();
};
export const useCovered = () => useSyncExternalStore(sub, () => covered);
