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
