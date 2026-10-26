import { appointmentsRepo, calendarCategoriesRepo, type Appointment } from '../calendar/calendarRepo';
import type { Project, Remind } from './projectModel';

/**
 * Datierte Dinge eines Projekts (Meilensteine, kleine Schritte, Aufgaben, Erinnerungen) stehen auch im Kalender.
 * Der Kalender-Eintrag gehört dem Projekt: Das Datum ändert man im Projekt. Erinnerungen laufen über den
 * normalen Termin-Mechanismus (kommen ins Postfach). Die Nachfrage „Wie war dein Termin?“ gibt es für diese
 * Einträge nicht (followUpDeliveredAt ist gesetzt).
 */
export const PROJECT_CATEGORY_ID = 'cal_projekte';
const apptId = (projectId: string, itemId: string) => `prj-${projectId}-${itemId}`;

function ensureCategory(lang: 'de' | 'en') {
  if (!calendarCategoriesRepo.getById(PROJECT_CATEGORY_ID)) {
    calendarCategoriesRepo.save({ id: PROJECT_CATEGORY_ID, label: lang === 'en' ? 'Projects' : 'Projekte', color: '#4a8f9e' });
  }
}

interface Wanted { itemId: string; title: string; date: string; time: string; remind: Remind }

function wanted(p: Project): Wanted[] {
  if (p.archived || p.status === 'done') return [];
  const out: Wanted[] = [];
  p.blocks.forEach((b) => {
    if (b.kind === 'timeline') {
      b.milestones.forEach((m) => {
        if (m.date && !m.done) out.push({ itemId: m.id, title: m.title || '…', date: m.date, time: m.time || '09:00', remind: m.remind });
        m.steps.forEach((s) => {
          if (s.date && !s.done) out.push({ itemId: s.id, title: `${s.text || '…'} (${m.title || '…'})`, date: s.date, time: '09:00', remind: undefined });
        });
      });
    }
    if (b.kind === 'tasks') b.items.forEach((t) => { if (t.due && t.status !== 'done') out.push({ itemId: t.id, title: t.text || '…', date: t.due, time: t.time || '09:00', remind: t.remind }); });
    if (b.kind === 'reminders') b.items.forEach((r) => { if (r.date) out.push({ itemId: r.id, title: r.text || '…', date: r.date, time: r.time || '09:00', remind: r.remind ?? 0 }); });
  });
  return out;
}

/** gleicht die Kalender-Einträge des Projekts mit dem aktuellen Stand ab */
export function syncProjectCalendar(p: Project, lang: 'de' | 'en'): void {
  const want = wanted(p);
  const prefix = `prj-${p.id}-`;
  const existing = appointmentsRepo.getAll().filter((a) => a.projectId === p.id || a.id.startsWith(prefix));
  const keep = new Set(want.map((w) => apptId(p.id, w.itemId)));
  existing.forEach((a) => { if (!keep.has(a.id)) appointmentsRepo.remove(a.id); });
  if (want.length === 0) return;
  ensureCategory(lang);
  const now = new Date().toISOString();
  want.forEach((w) => {
    const id = apptId(p.id, w.itemId);
    const old = existing.find((a) => a.id === id);
    const title = `${w.title} · ${p.title}`;
    const reminderMinutes = w.remind ?? null;
    if (old && old.title === title && old.date === w.date && old.time === w.time && (old.reminderMinutes ?? null) === reminderMinutes) return;
    const changed = !old || old.date !== w.date || old.time !== w.time || (old.reminderMinutes ?? null) !== reminderMinutes;
    const a: Appointment = {
      ...(old ?? { createdAt: now }),
      id,
      title,
      date: w.date,
      time: w.time,
      categoryId: PROJECT_CATEGORY_ID,
      note: old?.note,
      reminderMinutes,
      reminderDeliveredAt: changed ? undefined : old?.reminderDeliveredAt,
      followUpDeliveredAt: old?.followUpDeliveredAt ?? now,
      projectId: p.id,
      updatedAt: now,
    };
    appointmentsRepo.save(a);
  });
}

export function removeProjectCalendar(projectId: string): void {
  appointmentsRepo.getAll().filter((a) => a.projectId === projectId).forEach((a) => appointmentsRepo.remove(a.id));
}
