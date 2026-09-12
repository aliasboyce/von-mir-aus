import { createRepository } from '../../services/storage/repository';
import type { TensionEntry } from '../../data/types';

export const tensionRepo = createRepository<TensionEntry>('tension-entries');

export function todaysTensionEntries(): TensionEntry[] {
  const today = new Date().toDateString();
  return tensionRepo
    .getAll()
    .filter((e) => new Date(e.createdAt).toDateString() === today)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
