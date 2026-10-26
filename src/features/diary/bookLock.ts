/**
 * Ein eigenes Wort nur für EIN Tagebuch (zusätzlich zur App-Sperre, die es weiter gibt). Wie die App-Sperre ein
 * Sichtschutz, keine Verschlüsselung: gespeichert wird nur ein gesalzener Hash des Wortes, nie das Wort selbst.
 * Aufgeschlossen bleibt ein Tagebuch, bis die App eine Weile im Hintergrund war, neu geladen wird oder man es wieder sperrt.
 */
import { useSyncExternalStore } from 'react';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { hashSecret } from '../../services/appLock';
import { effectiveDiaryCategory } from './diaryCategories';

interface BookCode {
  salt: string;
  hash: string;
}

const store = createKeyValueStore<Record<string, BookCode>>('diary-book-codes', {});
const unlocked = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
const bump = () => {
  version++;
  listeners.forEach((l) => l());
};

/** the word is compared forgivingly: no difference in upper/lower case or surrounding spaces */
const norm = (w: string) => w.trim().toLowerCase().normalize('NFC');
const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');

export const hasBookCode = (categoryId: string | undefined) => !!store.get()[effectiveDiaryCategory(categoryId)];
export const isBookLocked = (categoryId: string | undefined) => {
  const id = effectiveDiaryCategory(categoryId);
  return !!store.get()[id] && !unlocked.has(id);
};
/** categories that currently hide their entries */
export const lockedBookIds = () => Object.keys(store.get()).filter((id) => !unlocked.has(id));

export const validBookWord = (w: string) => norm(w).length >= 3 && !/\s/.test(norm(w));

export async function setBookCode(categoryId: string, word: string): Promise<boolean> {
  if (!validBookWord(word)) return false;
  const salt = newSalt();
  const hash = await hashSecret(norm(word), salt);
  store.set({ ...store.get(), [categoryId]: { salt, hash } });
  unlocked.add(categoryId); // whoever just set it is inside
  bump();
  return true;
}

export async function unlockBook(categoryId: string, word: string): Promise<boolean> {
  const c = store.get()[categoryId];
  if (!c) return true;
  if ((await hashSecret(norm(word), c.salt)) !== c.hash) return false;
  unlocked.add(categoryId);
  bump();
  return true;
}

export function lockBook(categoryId: string) {
  unlocked.delete(categoryId);
  bump();
}

export function lockAllBooks() {
  unlocked.clear();
  bump();
}

export function removeBookCode(categoryId: string) {
  const next = { ...store.get() };
  delete next[categoryId];
  store.set(next);
  unlocked.delete(categoryId);
  bump();
}

/** re-renders when a code is set / removed / unlocked / locked */
export const useBookLocks = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );

// the app was in the background for a while → close the books again
let hiddenAt = 0;
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 2 * 60 * 1000) {
      hiddenAt = 0;
      lockAllBooks();
    }
  });
}
