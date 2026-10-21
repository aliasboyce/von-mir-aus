import { createKeyValueStore } from './storage/keyValueStore';

/**
 * "Auf der Entdecken-Seite sollen sich Seiten archivieren lassen (dann
 * ganz unten, etwas dunkler/graeulich) und anpinnen (die man als
 * erstes oben haben moechte)" — which tiles (by key) are pinned, in the
 * order they were pinned, and which are archived. Global across all the
 * Entdecken groups; a tile is in exactly one of: its group, pinned,
 * archived.
 */
const pinsStore = createKeyValueStore<string[]>('explore-pins', []);
const archivedStore = createKeyValueStore<string[]>('explore-archived', []);

export const getPins = () => pinsStore.get() ?? [];
export const getArchived = () => archivedStore.get() ?? [];

export function togglePin(key: string): string[] {
  const pins = getPins();
  const next = pins.includes(key) ? pins.filter((k) => k !== key) : [...pins, key];
  pinsStore.set(next);
  // pinning something un-archives it
  if (next.includes(key)) archivedStore.set(getArchived().filter((k) => k !== key));
  return next;
}

export function toggleArchive(key: string): string[] {
  const archived = getArchived();
  const next = archived.includes(key) ? archived.filter((k) => k !== key) : [...archived, key];
  archivedStore.set(next);
  // archiving something un-pins it
  if (next.includes(key)) pinsStore.set(getPins().filter((k) => k !== key));
  return next;
}
