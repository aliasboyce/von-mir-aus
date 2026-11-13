import { createKeyValueStore } from './storage/keyValueStore';

/**
 * Welche Wesen die Person schon einmal bei sich hatte. Daraus entstehen im Sammelalbum
 * automatisch Begleiter-Karten – eine pro Wesen. Nur lokal, nur die Wesen-ID und das erste Datum.
 */
export interface UsedCompanion { id: string; firstUsedAt: string }
const store = createKeyValueStore<UsedCompanion[]>('companions-used', []);

export function getUsedCompanions(): UsedCompanion[] {
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

/** Merkt sich ein benutztes Wesen (einmalig). Gibt true zurück, wenn es neu war. */
export function recordUsedCompanion(id: string | undefined): boolean {
  if (!id) return false;
  const list = getUsedCompanions();
  if (list.some((c) => c.id === id)) return false;
  store.set([...list, { id, firstUsedAt: new Date().toISOString() }]);
  return true;
}
