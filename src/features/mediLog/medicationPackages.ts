import type { MedicationPackage, MediLogEntry } from '../../data/types';

/** Tablets used so far = count of matching, actually-taken log entries
 * (medicationId match, status !== 'skipped', at/after the package's
 * openedAt) times tabletsPerDose. Computed live from the log rather
 * than stored as a running counter, so editing or deleting a past
 * entry automatically keeps the package's numbers correct too. */
export function tabletsUsed(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  const openedTime = new Date(pkg.openedAt).getTime();
  const matching = entries.filter(
    (e) => e.medicationId === pkg.medicationId && e.status !== 'skipped' && new Date(e.takenAt).getTime() >= openedTime,
  );
  return matching.length * pkg.tabletsPerDose;
}

export function tabletsRemaining(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  return Math.max(0, pkg.totalTablets - tabletsUsed(pkg, entries));
}

/** Doses remaining (not tablets) — what "1 week before empty" should
 * actually count against, since a person takes doses on a rhythm, not
 * tablets one at a time throughout the day. */
function dosesRemaining(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  return Math.floor(tabletsRemaining(pkg, entries) / pkg.tabletsPerDose);
}

/** Average doses-per-day for this package's medication, from the
 * entries logged since it was opened — the basis for turning "doses
 * remaining" into a day estimate for the 1-week/3-day thresholds.
 * Falls back to 1/day (a reasonable default for most scheduled
 * medications) if there's not yet enough history to compute a rate. */
function dosesPerDay(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  const openedTime = new Date(pkg.openedAt).getTime();
  const matching = entries.filter(
    (e) => e.medicationId === pkg.medicationId && e.status !== 'skipped' && new Date(e.takenAt).getTime() >= openedTime,
  );
  if (matching.length < 2) return 1;
  const days = Math.max(1, (Date.now() - openedTime) / 86400000);
  return matching.length / days;
}

export function daysUntilEmpty(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  const rate = dosesPerDay(pkg, entries);
  return dosesRemaining(pkg, entries) / rate;
}

export type PackageLowStockLevel = 'none' | 'oneWeek' | 'threeDays';

export function lowStockLevel(pkg: MedicationPackage, entries: MediLogEntry[]): PackageLowStockLevel {
  const days = daysUntilEmpty(pkg, entries);
  if (days <= 3) return 'threeDays';
  if (days <= 7) return 'oneWeek';
  return 'none';
}
