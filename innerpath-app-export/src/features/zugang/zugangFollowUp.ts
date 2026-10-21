import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * After a Zugang pass has been saved and the person goes on to USE what was
 * suggested (Ressourcen or a Brücke), this remembers which pass it was and
 * which of the chosen Ressourcen were already opened. The "Wie war es
 * danach?" page is shown once the use is closed — never before.
 */
export interface ZugangFollowUp {
  entryId: string;
  /** ids of chosen Ressourcen that have already been opened */
  opened: string[];
  createdAt: string;
}

const store = createKeyValueStore<ZugangFollowUp | null>('zugang-followup', null);

/** Pending follow-ups older than this are not offered any more. */
export const FOLLOWUP_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function startFollowUp(entryId: string): void {
  store.set({ entryId, opened: [], createdAt: new Date().toISOString() });
}

export function getFollowUp(): ZugangFollowUp | null {
  const f = store.get();
  if (!f) return null;
  const ts = Date.parse(f.createdAt);
  if (Number.isNaN(ts) || Date.now() - ts > FOLLOWUP_MAX_AGE_MS) return null;
  return f;
}

export function markOpened(entryId: string, resourceId: string): void {
  const f = store.get();
  if (!f || f.entryId !== entryId) return;
  if (!f.opened.includes(resourceId)) store.set({ ...f, opened: [...f.opened, resourceId] });
}

export function clearFollowUp(): void {
  store.set(null);
}
