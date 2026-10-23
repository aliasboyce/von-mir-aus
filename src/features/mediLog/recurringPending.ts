import { todayDayKey } from './recurringMedicationsRepo';
import type { MediLogEntry, RecurringMedication } from '../../data/types';

export interface PendingInstance {
  recurring: RecurringMedication;
  time: string;
}

function currentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A scheduled time only counts as "pending" once it's actually due (its
 * time has passed for today) and hasn't already been answered - either
 * confirmed taken or explicitly marked skipped - for today specifically.
 * Deliberately does not resurface anything from previous days: a missed
 * confirmation from yesterday isn't retroactively asked about, since
 * that would feel like nagging rather than gentle documentation.
 */
export function pendingRecurringInstances(
  recurring: RecurringMedication[],
  entries: MediLogEntry[],
): PendingInstance[] {
  const today = todayKey();
  const weekday = todayDayKey();
  const nowStr = currentTimeStr();
  const pending: PendingInstance[] = [];

  for (const r of recurring) {
    if (!r.active) continue;
    if (!r.days.includes(weekday)) continue;
    for (const time of r.times) {
      if (time > nowStr) continue;
      const alreadyHandled = entries.some(
        (e) =>
          e.recurringMedicationId === r.id &&
          e.recurringTimeSlot === time &&
          e.takenAt.slice(0, 10) === today,
      );
      if (!alreadyHandled) pending.push({ recurring: r, time });
    }
  }

  return pending;
}
