import { createKeyValueStore } from './storage/keyValueStore';

/**
 * "Alles soll mal kommen": picks items in random order, but never repeats one until every item of the list has been
 * shown once (then the bag is refilled). The bag lives in local storage under `key`, so it survives reloads.
 * A changed list (different length) simply starts a fresh bag.
 */
interface Bag {
  size: number;
  left: number[];
}

export function nextFromBag<T>(key: string, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  const store = createKeyValueStore<Bag | null>('bag-' + key, null);
  let bag = store.get();
  if (!bag || bag.size !== items.length || !Array.isArray(bag.left) || bag.left.length === 0) {
    bag = { size: items.length, left: items.map((_, i) => i) };
  }
  const pos = Math.floor(Math.random() * bag.left.length);
  const idx = bag.left[pos];
  const left = bag.left.filter((_, i) => i !== pos);
  store.set({ size: items.length, left });
  return items[idx];
}
