import { appointmentsRepo, calendarCategoriesRepo, type Appointment } from '../calendar/calendarRepo';
import { logEntry, LOG_MAX, projectsRepo, type Project, type Remind } from './projectModel';

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
          if (s.date && !s.done) out.push({ itemId: s.id, title: `${s.text || '…'} (${m.title || '…'})`, date: s.date, time: s.time || '09:00', remind: undefined });
        });
      });
    }
    if (b.kind === 'tasks') b.items.forEach((t) => { if (t.due && t.status !== 'done') out.push({ itemId: t.id, title: t.text || '…', date: t.due, time: t.time || '09:00', remind: t.remind }); });
    if (b.kind === 'reminders') b.items.forEach((r) => { if (r.date && !r.done) out.push({ itemId: r.id, title: r.text || '…', date: r.date, time: r.time || '09:00', remind: r.remind ?? 0 }); });
  });
  (p.steps ?? []).forEach((s) => { if (s.date && !s.done) out.push({ itemId: s.id, title: s.text || '…', date: s.date, time: s.time || '09:00', remind: s.remind }); });
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

/**
 * Im Kalender wurde ein Projekt-Termin verschoben oder abgehakt → zurück ins Projekt schreiben.
 * Gibt true zurück, wenn das Projekt-Element gefunden und geändert wurde.
 */
export function applyCalendarChange(a: Appointment, change: { date?: string; time?: string; done?: boolean }, lang: 'de' | 'en'): boolean {
  if (!a.projectId) return false;
  const p = projectsRepo.getById(a.projectId);
  if (!p) return false;
  const itemId = a.id.startsWith(`prj-${p.id}-`) ? a.id.slice(`prj-${p.id}-`.length) : '';
  if (!itemId) return false;
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const now = new Date().toISOString();
  let hit = false;
  let doneText = '';
  let blockId: string | undefined;
  let kind: 'step' | 'task' | 'milestone' = 'step';
  const setDT = <T extends { date?: string; time?: string }>(o: T): T => ({ ...o, ...(change.date ? { date: change.date } : {}), ...(change.time ? { time: change.time } : {}) });
  const blocks = p.blocks.map((b) => {
    if (b.kind === 'timeline') {
      return { ...b, milestones: b.milestones.map((m) => {
        if (m.id === itemId) {
          hit = true;
          if (change.done) { doneText = m.title; blockId = b.id; kind = 'milestone'; }
          return { ...setDT(m), ...(change.done ? { done: true, steps: m.steps.map((s) => ({ ...s, done: true })) } : {}) };
        }
        const steps = m.steps.map((s) => {
          if (s.id !== itemId) return s;
          hit = true;
          if (change.done) { doneText = s.text; blockId = b.id; kind = 'milestone'; }
          return { ...setDT(s), ...(change.done ? { done: true } : {}) };
        });
        return steps.some((s, i) => s !== m.steps[i]) ? { ...m, steps, ...(steps.length && steps.every((s) => s.done) ? { done: true } : {}) } : m;
      }) };
    }
    if (b.kind === 'tasks') {
      return { ...b, items: b.items.map((t) => {
        if (t.id !== itemId) return t;
        hit = true;
        if (change.done) { doneText = t.text; blockId = b.id; kind = 'task'; }
        return { ...t, ...(change.date ? { due: change.date } : {}), ...(change.time ? { time: change.time } : {}), ...(change.done ? { status: 'done' as const } : {}) };
      }) };
    }
    if (b.kind === 'reminders') {
      return { ...b, items: b.items.map((r) => {
        if (r.id !== itemId) return r;
        hit = true;
        if (change.done) { doneText = r.text; blockId = b.id; }
        return { ...r, ...(change.date ? { date: change.date } : {}), ...(change.time ? { time: change.time } : {}), ...(change.done ? { done: true } : {}) };
      }) };
    }
    return b;
  });
  let steps = p.steps;
  if (p.steps?.some((s) => s.id === itemId)) {
    hit = true;
    steps = p.steps.map((s) => {
      if (s.id !== itemId) return s;
      if (change.done) doneText = s.text;
      return { ...setDT(s), ...(change.done ? { done: true, doneAt: now } : {}) };
    });
  }
  if (!hit) return false;
  const log = change.done
    ? [...(p.log ?? []), logEntry(kind, L(`Im Kalender abgehakt: ${doneText || '…'}`, `Ticked off in the calendar: ${doneText || '…'}`), blockId)].slice(-LOG_MAX)
    : [...(p.log ?? []), logEntry('step', L(`Verschoben auf ${change.date ?? a.date} ${change.time ?? a.time}: ${a.title}`, `Moved to ${change.date ?? a.date} ${change.time ?? a.time}: ${a.title}`))].slice(-LOG_MAX);
  const next: Project = { ...p, blocks, steps, log, updatedAt: now };
  projectsRepo.save(next);
  syncProjectCalendar(next, lang);
  return true;
}
