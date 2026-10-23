import { storageAdapter } from './StorageAdapter';

/**
 * For singleton pieces of data (settings, the one safety plan) rather than
 * collections. Thin wrapper so feature code never imports storageAdapter
 * directly — keeps the storage layer swappable in one place.
 */
export function createKeyValueStore<T>(key: string, fallback: T) {
  return {
    get(): T {
      return storageAdapter.getItem<T>(key) ?? fallback;
    },
    set(value: T): void {
      storageAdapter.setItem(key, value);
    },
  };
}
