import { createRepository } from '../../services/storage/repository';
import type { PolyvagalCheckIn } from '../../data/types';

export const polyvagalRepo = createRepository<PolyvagalCheckIn>('polyvagal-checkins');

export function todaysCheckIns(): PolyvagalCheckIn[] {
  const today = new Date().toDateString();
  return polyvagalRepo
    .getAll()
    .filter((c) => new Date(c.createdAt).toDateString() === today)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** "Verlauf soll Tag/Woche/Monat zeigen"-Auftrag — check-ins from the
 * last N days (inclusive of today), for the week/month tabs on the
 * Verlauf chart. */
export function checkInsInLastDays(days: number): PolyvagalCheckIn[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return polyvagalRepo
    .getAll()
    .filter((c) => new Date(c.createdAt).getTime() >= cutoff)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
