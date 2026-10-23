import { createRepository } from '../../services/storage/repository';
import type { RecurringMedication, RecurringMedicationDay } from '../../data/types';

export const recurringMedicationsRepo = createRepository<RecurringMedication>('recurring-medications');

export const ALL_DAYS: RecurringMedicationDay[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

const JS_DAY_TO_KEY: RecurringMedicationDay[] = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

export function todayDayKey(): RecurringMedicationDay {
  return JS_DAY_TO_KEY[new Date().getDay()];
}

/**
 * Resolves the dose that was actually in effect for a given date,
 * according to the medication's dose history (see RecurringDoseChange)
 * — the last change with an effectiveFrom on or before that date wins.
 * Falls back to the plain doseValue/doseUnit when there's no history at
 * all, so a medication that's never had a dose change keeps working
 * exactly as before this feature existed.
 */
export function doseForDate(
  recurring: RecurringMedication,
  dateIso: string,
): { doseValue?: number; doseUnit?: string } {
  const history = recurring.doseHistory;
  if (!history || history.length === 0) {
    return { doseValue: recurring.doseValue, doseUnit: recurring.doseUnit };
  }
  const day = dateIso.slice(0, 10);
  const applicable = [...history].filter((h) => h.effectiveFrom <= day).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (applicable.length === 0) {
    // date is before any recorded change — the earliest history entry
    // is, by construction (see applyDoseChange), the dose that was in
    // effect from this medication's creation onward.
    const earliest = [...history].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0];
    return { doseValue: earliest.doseValue, doseUnit: earliest.doseUnit };
  }
  return { doseValue: applicable[0].doseValue, doseUnit: applicable[0].doseUnit };
}
