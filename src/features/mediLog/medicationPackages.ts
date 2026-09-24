import type { MedicationPackage, MediLogEntry } from '../../data/types';

function matchingEntries(pkg: MedicationPackage, entries: MediLogEntry[]): MediLogEntry[] {
  const openedTime = new Date(pkg.openedAt).getTime();
  return entries.filter(
    (e) => e.medicationId === pkg.medicationId && e.status !== 'skipped' && new Date(e.takenAt).getTime() >= openedTime,
  );
}

/** "Bedarfsmedikation, mal 1 mal 2 Tabletten"-Auftrag — each matching
 * entry's own doseValue (when the person logged one) is used as the
 * tablet count for that specific dose, so someone who sometimes takes
 * 1 and sometimes 2 gets an accurate running total. The package's
 * tabletsPerDose is only a fallback for entries that don't have a
 * doseValue at all — never a fixed multiplier applied to every entry
 * regardless of what was actually logged. Computed live from the log
 * rather than stored as a running counter, so editing or deleting a
 * past entry automatically keeps the numbers correct too. */
export function tabletsUsed(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  return matchingEntries(pkg, entries).reduce((sum, e) => sum + (e.doseValue ?? pkg.tabletsPerDose), 0);
}

export function tabletsRemaining(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  return Math.max(0, pkg.totalTablets - tabletsUsed(pkg, entries));
}

/** Average tablets-per-day for this package's medication, from the
 * entries logged since it was opened — the basis for turning "tablets
 * remaining" into a day estimate for the 1-week/3-day thresholds.
 * Works directly in tablets (not "doses") so it stays accurate
 * whether every dose used the same amount or not. Falls back to
 * tabletsPerDose/day (a reasonable default for most scheduled
 * medications) if there's not yet enough history to compute a rate. */
function tabletsPerDay(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  const matching = matchingEntries(pkg, entries);
  if (matching.length < 2) return pkg.tabletsPerDose;
  const openedTime = new Date(pkg.openedAt).getTime();
  const days = Math.max(1, (Date.now() - openedTime) / 86400000);
  return tabletsUsed(pkg, entries) / days;
}

export function daysUntilEmpty(pkg: MedicationPackage, entries: MediLogEntry[]): number {
  const rate = tabletsPerDay(pkg, entries);
  if (rate <= 0) return Infinity;
  return tabletsRemaining(pkg, entries) / rate;
}

export type PackageLowStockLevel = 'none' | 'oneWeek' | 'threeDays';

export function lowStockLevel(pkg: MedicationPackage, entries: MediLogEntry[]): PackageLowStockLevel {
  const days = daysUntilEmpty(pkg, entries);
  if (days <= 3) return 'threeDays';
  if (days <= 7) return 'oneWeek';
  return 'none';
}
