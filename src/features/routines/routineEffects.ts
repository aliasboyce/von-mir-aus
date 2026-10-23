import { createId } from '../../services/storage/repository';
import { logActivity } from '../../services/activityLog';
import { resourcesRepo } from '../resources/resourcesRepo';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { savedMedicationsRepo } from '../mediLog/savedMedicationsRepo';
import { recurringMedicationsRepo, doseForDate, todayDayKey } from '../mediLog/recurringMedicationsRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';
import type { MediLogEntry } from '../../data/types';
import type { RoutineCard } from './routinesRepo';

/** the medications a card can carry: regular ones (with times) first, then the saved ones */
export function mediOptions(): { key: string; kind: 'saved' | 'recurring'; id: string; name: string; sub?: string }[] {
  const rec = recurringMedicationsRepo
    .getAll()
    .filter((r) => r.active)
    .map((r) => ({ key: `recurring:${r.id}`, kind: 'recurring' as const, id: r.id, name: r.name, sub: [r.doseValue != null ? `${r.doseValue}${r.doseUnit ? ' ' + r.doseUnit : ''}` : '', r.times.join(', ')].filter(Boolean).join(' · ') }));
  const recNames = new Set(rec.map((r) => r.name.trim().toLowerCase()));
  const saved = savedMedicationsRepo
    .getAll()
    .filter((m) => !recNames.has(m.name.trim().toLowerCase()))
    .map((m) => ({ key: `saved:${m.id}`, kind: 'saved' as const, id: m.id, name: m.name, sub: m.typicalDoseValue != null ? `${m.typicalDoseValue}${m.typicalDoseUnit ? ' ' + m.typicalDoseUnit : ''}` : undefined }));
  return [...rec, ...saved];
}

/** name of the medication on a card (undefined if it was deleted meanwhile) */
export function mediNameOf(medi: RoutineCard['medi']): string | undefined {
  if (!medi) return undefined;
  return medi.kind === 'recurring' ? recurringMedicationsRepo.getById(medi.id)?.name : savedMedicationsRepo.getById(medi.id)?.name;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * The card with a medication was done: the intake is entered in the medication log (and, for a regular
 * medication, the matching scheduled time of today is ticked, so the reminder does not ask again).
 * Returns the name that was entered, or undefined if nothing new was needed (already ticked today).
 */
export function logMediForCard(medi: RoutineCard['medi'], routineTitle: string, lang: 'de' | 'en' = 'de'): string | undefined {
  if (!medi) return undefined;
  const now = new Date();
  const nowIso = now.toISOString();
  const note = lang === 'en' ? `Via routine "${routineTitle}"` : `Über Routine „${routineTitle}“`;
  const base: Omit<MediLogEntry, 'name'> = { id: createId('medi'), takenAt: nowIso, createdAt: nowIso, updatedAt: nowIso, status: 'taken', note };
  if (medi.kind === 'recurring') {
    const r = recurringMedicationsRepo.getById(medi.id);
    if (!r) return undefined;
    const entries = mediLogRepo.getAll();
    const handled = (time: string) => entries.some((e) => e.recurringMedicationId === r.id && e.recurringTimeSlot === time && e.takenAt.slice(0, 10) === todayStr());
    const scheduledToday = r.days.includes(todayDayKey());
    const open = [...r.times].sort().filter((t) => !handled(t));
    if (scheduledToday && r.times.length > 0 && open.length === 0) return undefined; // all of today's doses are already ticked
    const dose = doseForDate(r, nowIso);
    mediLogRepo.save({ ...base, name: r.name, doseValue: dose.doseValue, doseUnit: dose.doseUnit, amount: dose.doseValue != null ? `${dose.doseValue}${dose.doseUnit ? ' ' + dose.doseUnit : ''}` : undefined, medicationId: r.medicationId, ...(scheduledToday && open[0] ? { recurringMedicationId: r.id, recurringTimeSlot: open[0] } : {}) });
    return r.name;
  }
  const m = savedMedicationsRepo.getById(medi.id);
  if (!m) return undefined;
  // the same medication twice within ten minutes is one intake (the routine was repeated)
  const recent = mediLogRepo.getAll().some((e) => e.medicationId === m.id && e.status !== 'skipped' && Math.abs(now.getTime() - new Date(e.takenAt).getTime()) < 10 * 60 * 1000);
  if (recent) return undefined;
  mediLogRepo.save({ ...base, name: m.name, doseValue: m.typicalDoseValue, doseUnit: m.typicalDoseUnit, amount: m.typicalDoseValue != null ? `${m.typicalDoseValue}${m.typicalDoseUnit ? ' ' + m.typicalDoseUnit : ''}` : undefined, medicationId: m.id });
  return m.name;
}

const SKILL_GROUP = 'faehigkeiten';

/**
 * A card with a resource was done: the resource counts as used (look-back, "recently used"), and if it is a
 * skill, a skill use is entered too, so the skill statistics and the look-back know about it.
 */
export function recordResourceUse(resourceId: string, routineTitle: string, startedAt: Date, lang: 'de' | 'en' = 'de'): { title: string; skill: boolean } | undefined {
  const res = resourcesRepo.getById(resourceId);
  if (!res) return undefined;
  const now = new Date();
  const isSkill = !!res.skillDetails || RESOURCE_CATEGORY_TO_GROUP[res.category] === SKILL_GROUP;
  logActivity('resource', res.title, res.id);
  if (isSkill) {
    skillUsesRepo.save({
      id: createId('skuse'),
      skillId: res.id,
      skillTitle: res.title,
      startedAt: startedAt.toISOString(),
      endedAt: now.toISOString(),
      durationSec: Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 1000)),
      kind: 'skill',
      note: lang === 'en' ? `Done as part of the routine "${routineTitle}"` : `Als Teil der Routine „${routineTitle}“ gemacht`,
    });
  }
  return { title: res.title, skill: isSkill };
}
