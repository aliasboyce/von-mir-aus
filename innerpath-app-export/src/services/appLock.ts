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
  /** when the current PIN was set (ISO) */
  setAt?: string;
  /** a random key K (wrapped by the current PIN) – it protects the old PINs and the way back via the security question */
  k?: { salt: string; wrap: string };
  /** the current PIN, encrypted with K (so that it can be moved to the history when it changes – also after a recovery) */
  cur?: string;
  /** earlier PINs, encrypted with K, with the date they were replaced (the dates are readable, the PINs only with the current PIN) */
  history?: { enc: string; at: string }[];
  /** the optional security question; K is wrapped once per key word of the answer */
  rec?: { qid: string; qtext?: string; salt: string; wraps: string[] };
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

/* ───── small crypto helpers (AES-GCM, keys from PBKDF2) – only used for the old PINs and the security question ───── */
const canCrypto = () => !!globalThis.crypto?.subtle;
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const fromB64 = (b: string) => Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0));
const rnd = (n: number) => crypto.getRandomValues(new Uint8Array(n));

async function kdfKey(secret: string, salt: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 60000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function aesEnc(key: CryptoKey, plain: Uint8Array): Promise<string> {
  const iv = rnd(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plain as BufferSource));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64(out);
}
async function aesDec(key: CryptoKey, b64: string): Promise<Uint8Array | null> {
  try {
    const all = fromB64(b64);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) as BufferSource }, key, all.slice(12) as BufferSource));
  } catch {
    return null;
  }
}
const txt = (s: string) => new TextEncoder().encode(s);
const untxt = (u: Uint8Array) => new TextDecoder().decode(u);
const importK = (raw: Uint8Array) => crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);

/** K, opened with the current PIN */
async function openK(c: LockConfig, pin: string): Promise<Uint8Array | null> {
  if (!c.k || !canCrypto()) return null;
  return aesDec(await kdfKey(pin, c.k.salt), c.k.wrap);
}
async function wrapK(raw: Uint8Array, pin: string): Promise<{ salt: string; wrap: string }> {
  const salt = toB64(rnd(12));
  return { salt, wrap: await aesEnc(await kdfKey(pin, salt), raw) };
}

/* ───── the security question ───── */

const STOP = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'mein', 'meine', 'meinen', 'meinem', 'meiner', 'mir', 'ich', 'war', 'waren', 'hiess', 'hat', 'hatte', 'und', 'oder', 'in', 'im', 'an', 'am', 'auf', 'bei', 'von', 'vom', 'zu', 'zum', 'zur', 'mit', 'the', 'a', 'my', 'was', 'is', 'of', 'called', 'named', 'es', 'ist', 'sie', 'er']);

/** the way a word is written is made forgiving: Umlaute, double letters, ph/f, c/k … */
function skeleton(word: string): string {
  let w = word
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  w = w.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  w = w.replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/th/g, 't').replace(/dt/g, 't').replace(/c/g, 'k').replace(/y/g, 'i').replace(/v/g, 'f');
  w = w.replace(/(.)\1+/g, '$1');
  return w;
}

/** the key words of an answer: each one in its forgiving spelling, plus its first four letters (so "Mathe" also finds "Mathematik") */
export function answerKeys(answer: string): string[] {
  const raw = answer
    .toLowerCase()
    .split(/[^a-zA-Z0-9äöüÄÖÜß]+/)
    .filter(Boolean);
  const kept = raw.filter((w) => !STOP.has(skeleton(w)) && skeleton(w).length >= 2);
  const words = (kept.length ? kept : raw).map(skeleton).filter((w) => w.length >= 2).slice(0, 8);
  const keys = new Set<string>();
  words.forEach((w) => {
    keys.add(w);
    if (w.length >= 4) keys.add('p:' + w.slice(0, 4));
  });
  return [...keys];
}

export const hasRecovery = () => !!getLockConfig()?.rec;

/** set or change the question; needs the current PIN (K stays the same) */
export async function setRecovery(pin: string, qid: string, answer: string, qtext?: string): Promise<boolean> {
  const c = getLockConfig();
  if (!c || !canCrypto()) return false;
  const keys = answerKeys(answer);
  if (!keys.length) return false;
  const raw = await openK(c, pin);
  if (!raw) return false;
  const salt = toB64(rnd(12));
  const wraps: string[] = [];
  for (const k of keys) wraps.push(await aesEnc(await kdfKey(k, salt), raw));
  configStore.set({ ...c, rec: { qid, qtext: qid === 'own' ? qtext?.trim() : undefined, salt, wraps } });
  return true;
}
export function removeRecovery(): void {
  const c = getLockConfig();
  if (c) configStore.set({ ...c, rec: undefined });
}

/** the answer is right if it contains one of the key words (forgiving spelling) */
async function openKWithAnswer(c: LockConfig, answer: string): Promise<Uint8Array | null> {
  if (!c.rec || !canCrypto()) return null;
  for (const k of answerKeys(answer)) {
    const key = await kdfKey(k, c.rec.salt);
    for (const w of c.rec.wraps) {
      const raw = await aesDec(key, w);
      if (raw) return raw;
    }
  }
  return null;
}
export async function answerIsRight(answer: string): Promise<boolean> {
  const c = getLockConfig();
  return !!c && !!(await openKWithAnswer(c, answer));
}

/** a new PIN: the old one goes into the history (with the date); K and the question stay */
async function applyNewPin(c: LockConfig, raw: Uint8Array | null, newPin: string): Promise<void> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(12)));
  const hash = await derive(newPin, salt);
  const next: LockConfig = { ...c, salt, hash, length: newPin.length, setAt: new Date().toISOString() };
  if (raw && canCrypto()) {
    const key = await importK(raw);
    const history = [...(c.history ?? [])];
    if (c.cur) history.push({ enc: c.cur, at: new Date().toISOString() });
    next.history = history.slice(-20);
    next.cur = await aesEnc(key, txt(newPin));
    next.k = await wrapK(raw, newPin);
  }
  configStore.set(next);
}

/** normal change (the current PIN was checked before) */
export async function changePin(oldPin: string, newPin: string): Promise<void> {
  const c = getLockConfig();
  if (!c) return;
  await applyNewPin(c, await openK(c, oldPin), newPin);
}

/** after the right answer: a new PIN without knowing the old one */
export async function resetPinWithAnswer(answer: string, newPin: string): Promise<boolean> {
  const c = getLockConfig();
  if (!c) return false;
  const raw = await openKWithAnswer(c, answer);
  if (!raw) return false;
  await applyNewPin(c, raw, newPin);
  return true;
}

/** the earlier PINs, only readable with the current PIN */
export async function readPinHistory(pin: string): Promise<{ at: string; pin: string }[] | null> {
  const c = getLockConfig();
  if (!c) return null;
  const raw = await openK(c, pin);
  if (!raw) return null;
  const key = await importK(raw);
  const out: { at: string; pin: string }[] = [];
  for (const h of c.history ?? []) {
    const d = await aesDec(key, h.enc);
    out.push({ at: h.at, pin: d ? untxt(d) : '????' });
  }
  return out;
}

export async function setPin(pin: string, lockAfterMin = 1): Promise<void> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(12)));
  const cfg: LockConfig = { salt, hash: await derive(pin, salt), length: pin.length, lockAfterMin, setAt: new Date().toISOString() };
  if (canCrypto()) {
    const raw = rnd(32);
    cfg.k = await wrapK(raw, pin);
    cfg.cur = await aesEnc(await importK(raw), txt(pin));
  }
  configStore.set(cfg);
}

/** a lock from an earlier version has no K yet – it is added the first time the right PIN is entered */
async function ensureKey(pin: string): Promise<void> {
  const c = getLockConfig();
  if (!c || c.k || !canCrypto()) return;
  const raw = rnd(32);
  configStore.set({ ...c, k: await wrapK(raw, pin), cur: await aesEnc(await importK(raw), txt(pin)) });
}

export async function checkPin(pin: string): Promise<boolean> {
  const c = getLockConfig();
  if (!c) return true;
  const ok = (await derive(pin, c.salt)) === c.hash;
  if (ok && !c.k) void ensureKey(pin);
  return ok;
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
