/**
 * Own photos, videos and audio files are too big for localStorage. They live in the browser's IndexedDB
 * on this device only (never uploaded, never part of links or shared files) and are referenced by id.
 * Every function fails soft: if IndexedDB is unavailable (private window, blocked storage) nothing throws.
 */
const DB_NAME = 'von-mir-aus-media';
const STORE = 'files';
export const MAX_MEDIA_BYTES = 200 * 1024 * 1024;

export type OwnMediaKind = 'image' | 'video' | 'audio';
export interface OwnMediaRef {
  id: string;
  kind: OwnMediaKind;
  name: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      }),
  );
}

export function kindOfFile(file: File): OwnMediaKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

/** Saves the file and returns its reference, or null when it is too big / unsupported / storage failed. */
export async function saveOwnMedia(file: File | Blob, name = 'Datei'): Promise<OwnMediaRef | null> {
  const kind = file instanceof File ? kindOfFile(file) : (file.type.startsWith('image/') ? 'image' : null);
  if (!kind || file.size > MAX_MEDIA_BYTES) return null;
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await run('readwrite', (s) => s.put(file, id));
    return { id, kind, name: file instanceof File ? file.name : name };
  } catch {
    return null;
  }
}

const urlCache = new Map<string, string>();
/** An object URL for the stored file (cached), or null if it is gone. */
export async function ownMediaUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  try {
    const blob = await run<Blob | undefined>('readonly', (s) => s.get(id));
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  } catch {
    return null;
  }
}

export async function deleteOwnMedia(id: string): Promise<void> {
  const cached = urlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    urlCache.delete(id);
  }
  try {
    await run('readwrite', (s) => s.delete(id));
  } catch {
    // nothing to clean up
  }
}

export async function clearAllOwnMedia(): Promise<void> {
  urlCache.forEach((u) => URL.revokeObjectURL(u));
  urlCache.clear();
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    // nothing to clear
  }
}

/** Every stored file with its id (for the full backup). Never throws. */
export async function listAllOwnMedia(): Promise<{ id: string; blob: Blob }[]> {
  try {
    const db = await open();
    return await new Promise((resolve) => {
      const out: { id: string; blob: Blob }[] = [];
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          if (cur.value instanceof Blob) out.push({ id: String(cur.key), blob: cur.value });
          cur.continue();
        } else {
          db.close();
          resolve(out);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(out);
      };
    });
  } catch {
    return [];
  }
}

/** Puts a file back under its old id (restoring a backup). Returns false when it could not be stored. */
export async function putOwnMediaWithId(id: string, blob: Blob): Promise<boolean> {
  try {
    await run('readwrite', (s) => s.put(blob, id));
    const cached = urlCache.get(id);
    if (cached) {
      URL.revokeObjectURL(cached);
      urlCache.delete(id);
    }
    return true;
  } catch {
    return false;
  }
}
