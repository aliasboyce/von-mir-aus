import { createId } from '../../services/storage/repository';
import { appointmentsRepo } from '../calendar/calendarRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { mindmapRepo } from '../mindmap/mindmapModel';
import { notifySlipsChanged } from './slipDelivery';
import { parkNotesRepo, waitItemsRepo, type ParkNote, type SlipOrigin, type SlipTarget, type WaitItem } from './parkboxRepo';

const tilt = () => Math.round((Math.random() * 6 - 3) * 10) / 10;

/** A fresh slip in the general Parkbox. */
export function newSlip(text: string, origin: SlipOrigin = 'park', extra: Partial<ParkNote> = {}): ParkNote {
  const now = new Date().toISOString();
  return { id: createId('park'), text, priority: 2, archived: false, paper: 0, tilt: tilt(), origin, createdAt: now, updatedAt: now, ...extra };
}

/** Pin an existing slip to an appointment, a person or a mind map. */
export function attachNote(n: ParkNote, kind: SlipTarget, id: string): ParkNote {
  const next: ParkNote = { ...n, attach: { kind, id }, projectId: undefined, origin: n.origin ?? (n.projectId ? 'project' : 'park'), archived: false, done: false, doneAt: undefined, deliverAt: undefined, deliveredAt: undefined, updatedAt: new Date().toISOString() };
  parkNotesRepo.save(next);
  notifySlipsChanged();
  return next;
}

/** A waiting-room item becomes a (blue) slip pinned somewhere; the item itself leaves the waiting room. */
export function attachWaitItem(w: WaitItem, kind: SlipTarget, id: string): ParkNote {
  const slip = newSlip(w.title, 'wait', { attach: { kind, id }, waitSnapshot: { title: w.title, kind: w.kind, need: w.need, note: w.note } });
  parkNotesRepo.save(slip);
  waitItemsRepo.remove(w.id);
  notifySlipsChanged();
  return slip;
}

export const slipsAt = (kind: SlipTarget, id: string): ParkNote[] =>
  parkNotesRepo.getAll().filter((n) => n.attach?.kind === kind && n.attach.id === id).sort((a, b) => Number(!!a.done) - Number(!!b.done) || b.createdAt.localeCompare(a.createdAt));

export function toggleSlipDone(id: string): void {
  const n = parkNotesRepo.getById(id);
  if (!n) return;
  const done = !n.done;
  parkNotesRepo.save({ ...n, done, doneAt: done ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() });
  notifySlipsChanged();
}

/** Back into the general Parkbox (yellow again). */
export function slipToPark(id: string): void {
  const n = parkNotesRepo.getById(id);
  if (!n) return;
  parkNotesRepo.save({ ...n, attach: undefined, projectId: undefined, origin: 'park', done: false, doneAt: undefined, archived: false, waitSnapshot: undefined, updatedAt: new Date().toISOString() });
  notifySlipsChanged();
}

/** Back into the waiting room as an item (the slip disappears, the item takes its seat). */
export function slipToWait(id: string): void {
  const n = parkNotesRepo.getById(id);
  if (!n) return;
  const now = new Date().toISOString();
  const snap = n.waitSnapshot;
  waitItemsRepo.save({ id: createId('wait'), title: snap?.title ?? n.text, kind: snap?.kind ?? 'idee', need: snap?.need, note: snap?.note, createdAt: now, updatedAt: now });
  parkNotesRepo.remove(id);
  notifySlipsChanged();
}

export function removeSlip(id: string): void {
  parkNotesRepo.remove(id);
  notifySlipsChanged();
}

/** Where a pinned slip hangs (for lists that show slips from all places). */
export function slipPlace(n: ParkNote, lang: 'de' | 'en'): { icon: string; label: string; to: string } | null {
  if (!n.attach) return null;
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  if (n.attach.kind === 'appointment') {
    const a = appointmentsRepo.getById(n.attach.id);
    return { icon: '📅', label: a ? `${a.title} (${a.date.split('-').reverse().join('.')})` : L('Termin (gelöscht)', 'Appointment (deleted)'), to: '/kalender' };
  }
  if (n.attach.kind === 'person') {
    const q = networkRepo.getById(n.attach.id);
    return { icon: '🤝', label: q ? q.name : L('Person (gelöscht)', 'Person (deleted)'), to: '/sicherheit/netzwerk' };
  }
  const m = mindmapRepo.getById(n.attach.id);
  return { icon: '🗺️', label: m ? m.title || L('Mindmap', 'Mind map') : L('Mindmap (gelöscht)', 'Mind map (deleted)'), to: m ? `/entdecken/mindmap/${m.id}` : '/entdecken/mindmap' };
}
