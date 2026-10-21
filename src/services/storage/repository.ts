import { storageAdapter } from './StorageAdapter';

interface WithId {
  id: string;
}

/**
 * A small repository factory for entity collections (network entries,
 * resources, bridges, diary entries, …). Keeps CRUD logic, id generation
 * and persistence in one place so feature code stays declarative:
 *
 *   const bridgesRepo = createRepository<Bridge>('bridges');
 *   bridgesRepo.getAll();
 *   bridgesRepo.save(bridge);
 *
 * This is intentionally storage-engine-agnostic: it only talks to the
 * StorageAdapter interface, so swapping localStorage for IndexedDB later
 * only means changing StorageAdapter's implementation.
 */
export function createRepository<T extends WithId>(collectionKey: string) {
  function readAll(): T[] {
    return storageAdapter.getItem<T[]>(collectionKey) ?? [];
  }

  function writeAll(items: T[]): boolean {
    return storageAdapter.setItem(collectionKey, items);
  }

  return {
    getAll(): T[] {
      return readAll();
    },

    getById(id: string): T | undefined {
      return readAll().find((item) => item.id === id);
    },

    /** Insert or update (matched by id). Returns the saved item — use this
     * for the vast majority of call sites where a rare, already-logged
     * storage failure isn't something the UI needs to react to. */
    save(item: T): T {
      const items = readAll();
      const index = items.findIndex((existing) => existing.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.push(item);
      }
      writeAll(items);
      return item;
    },

    /** Same as save(), but returns whether the write actually succeeded —
     * for the few places (like a photo upload) where silently losing the
     * data would be confusing, so the UI can show a real error instead. */
    trySave(item: T): boolean {
      const items = readAll();
      const index = items.findIndex((existing) => existing.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.push(item);
      }
      return writeAll(items);
    },

    remove(id: string): void {
      writeAll(readAll().filter((item) => item.id !== id));
    },

    /** Replace the whole collection at once (e.g. reordering, import). */
    replaceAll(items: T[]): void {
      writeAll(items);
    },

    /** Used once to plant demo content if the collection is still empty. */
    seedIfEmpty(seed: T[]): void {
      if (readAll().length === 0) {
        writeAll(seed);
      }
    },
  };
}

/** Generates a reasonably unique id without pulling in a uuid dependency. */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
