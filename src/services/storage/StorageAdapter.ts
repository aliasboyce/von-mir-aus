/**
 * A StorageAdapter is the one place that knows how data is actually
 * persisted. Today it's localStorage (synchronous, simple, offline by
 * definition). Later this can be swapped for IndexedDB or a sync-aware
 * adapter (e.g. Supabase) without touching any feature code, because
 * features only ever talk to a Repository (see repository.ts), never to
 * localStorage directly.
 */
import { notifyStorageWriteFailed } from './storageFailureNotice';

export interface StorageAdapter {
  getItem<T>(key: string): T | null;
  /** returns true on success, false if the write failed (e.g. quota
   * exceeded) — callers that need to know (like a photo upload) can react;
   * everyone else can ignore the return value as before. */
  setItem<T>(key: string, value: T): boolean;
  removeItem(key: string): void;
  /** all keys currently stored under the app's namespace */
  listKeys(prefix?: string): string[];
}

const NAMESPACE = 'innerpath';

function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

/**
 * localStorage-backed adapter. Wrapped in try/catch everywhere so that a
 * full/blocked storage (private browsing, quota) degrades gracefully
 * instead of crashing the app — losing data silently is still better than
 * a white screen, and callers can check the return value.
 */
class LocalStorageAdapter implements StorageAdapter {
  getItem<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(namespacedKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`[storage] Failed to read "${key}"`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      window.localStorage.setItem(namespacedKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[storage] Failed to write "${key}"`, error);
      notifyStorageWriteFailed();
      return false;
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(namespacedKey(key));
    } catch (error) {
      console.error(`[storage] Failed to remove "${key}"`, error);
    }
  }

  listKeys(prefix = ''): string[] {
    try {
      const fullPrefix = namespacedKey(prefix);
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          keys.push(key.slice(NAMESPACE.length + 1));
        }
      }
      return keys;
    } catch (error) {
      console.error('[storage] Failed to list keys', error);
      return [];
    }
  }
}

export const storageAdapter: StorageAdapter = new LocalStorageAdapter();
