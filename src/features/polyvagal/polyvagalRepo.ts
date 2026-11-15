import { createRepository } from '../../services/storage/repository';
import type { PolyvagalCheckIn } from '../../data/types';
import { tensionRepo } from './tensionRepo';

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

/** Notiz eines Eintrags ändern (leer = Notiz entfernen) */
export function setCheckInNote(id: string, note: string) {
  const c = polyvagalRepo.getById(id);
  if (!c) return;
  const clean = note.trim().slice(0, 400);
  polyvagalRepo.save({ ...c, note: clean || undefined });
}

/** Einen Wert löschen (z. B. aus Versehen eingetragen) – samt dem Spannungswert, der beim selben Eintragen gespeichert wurde. */
export function deleteCheckIn(id: string) {
  const c = polyvagalRepo.getById(id);
  if (!c) return;
  const at = new Date(c.createdAt).getTime();
  tensionRepo
    .getAll()
    .filter((e) => Math.abs(new Date(e.createdAt).getTime() - at) < 3000 && (c.tensionValue === undefined || e.value === c.tensionValue))
    .forEach((e) => tensionRepo.remove(e.id));
  polyvagalRepo.remove(id);
}
