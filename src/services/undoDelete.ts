/**
 * Feinschliff F6: „Rückgängig“ nach dem Löschen.
 *
 * Jede Löschung über ein Repository (createRepository().remove) wird hier kurz
 * gemerkt. Kurz danach erscheint ein ruhiger Hinweis „Gelöscht · Rückgängig“.
 * Die bisherigen Sicherheitsfragen vor dem Löschen bleiben unverändert.
 *
 * Nur Löschungen, die direkt nach einer Berührung/Taste der Person passieren,
 * zählen (keine automatischen Aufräum-Vorgänge). Mehrere Löschungen innerhalb
 * von 350 ms werden zu einem Rückgängig zusammengefasst.
 *
 * Rückgängig machen/abschalten: UndoToast aus AppShell entfernen
 * (oder in repository.ts den Aufruf recordRemoval löschen).
 */
import { storageAdapter } from './storage/StorageAdapter';

interface Removed { key: string; item: { id: string }; index: number }
export interface UndoOffer { count: number; undo: () => void }

const OFFER_MS = 7000;
const COLLECT_MS = 350;
const INTERACTION_WINDOW_MS = 2500;

let lastInteraction = 0;
let batch: Removed[] = [];
let collectTimer: number | undefined;
let expireTimer: number | undefined;
let current: { removed: Removed[]; media: string[] } | null = null;
let deferredMedia: string[] = [];
const offerListeners = new Set<(o: UndoOffer | null) => void>();
const restoredListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  const mark = () => { lastInteraction = Date.now(); };
  window.addEventListener('pointerdown', mark, true);
  window.addEventListener('keydown', mark, true);
  window.addEventListener('touchstart', mark, true);
}

export function onUndoOffer(l: (o: UndoOffer | null) => void): () => void {
  offerListeners.add(l);
  return () => { offerListeners.delete(l); };
}
export function onRestored(l: () => void): () => void {
  restoredListeners.add(l);
  return () => { restoredListeners.delete(l); };
}

function emit(o: UndoOffer | null) { offerListeners.forEach((l) => l(o)); }

async function flushMedia() {
  const ids = deferredMedia; deferredMedia = [];
  if (!ids.length) return;
  const { deleteOwnMediaNow } = await import('./mediaStore');
  for (const id of ids) await deleteOwnMediaNow(id);
}

function expire() {
  window.clearTimeout(expireTimer);
  current = null;
  emit(null);
  void flushMedia();
}

function publish() {
  collectTimer = undefined;
  const removed = batch; batch = [];
  if (!removed.length) return;
  // ein früheres Angebot verfällt jetzt endgültig
  if (current) { window.clearTimeout(expireTimer); void flushMedia(); }
  current = { removed, media: [] };
  emit({
    count: removed.length,
    undo: () => {
      if (!current) return;
      const mine = current.removed;
      window.clearTimeout(expireTimer);
      current = null;
      deferredMedia = []; // Bilder/Dateien bleiben erhalten
      for (const r of [...mine].reverse()) {
        const list = storageAdapter.getItem<{ id: string }[]>(r.key) ?? [];
        if (list.some((x) => x.id === r.item.id)) continue;
        list.splice(Math.min(r.index, list.length), 0, r.item);
        storageAdapter.setItem(r.key, list);
      }
      emit(null);
      restoredListeners.forEach((l) => l());
    },
  });
  expireTimer = window.setTimeout(expire, OFFER_MS);
}

/** Von createRepository().remove aufgerufen. */
export function recordRemoval(key: string, item: { id: string }, index: number): void {
  if (typeof window === 'undefined') return;
  if (Date.now() - lastInteraction > INTERACTION_WINDOW_MS) return;
  batch.push({ key, item, index });
  if (collectTimer === undefined) collectTimer = window.setTimeout(publish, COLLECT_MS);
}

/** Solange ein Rückgängig-Angebot offen ist, wird das Löschen von Bildern/Dateien aufgeschoben. */
export function deferMediaDelete(id: string): boolean {
  if (collectTimer === undefined && !current) return false;
  deferredMedia.push(id);
  return true;
}
