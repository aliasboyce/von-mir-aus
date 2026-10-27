import { useEffect } from 'react';
import { appointmentsRepo, calendarCategoriesRepo, type Appointment } from '../calendar/calendarRepo';
import { useSettings } from '../../state/SettingsContext';
import { BUDGET_CHANGED, addDays, billsRepo, money, budgetSettingsStore, nowIso, recurringRepo, todayStr } from './budgetModel';
import { occurrences, tickKey } from './budgetCalc';
import { ticksRepo } from './budgetModel';

/**
 * Fälligkeiten stehen auf Wunsch im Kalender – mit Erinnerung vorab (kommt ins Postfach wie jeder Termin).
 * Der Kalender-Eintrag gehört dem Budget-Planer: Datum, Betrag und Erinnerung ändert man dort, Abhaken entfernt ihn.
 * Die Nachfrage „Wie war dein Termin?“ gibt es für diese Einträge nicht.
 */
export const BUDGET_CATEGORY_ID = 'cal_finanzen';
const PREFIX = 'bud-';
const HORIZON_DAYS = 75;

function ensureCategory(lang: 'de' | 'en') {
  if (!calendarCategoriesRepo.getById(BUDGET_CATEGORY_ID)) calendarCategoriesRepo.save({ id: BUDGET_CATEGORY_ID, label: lang === 'en' ? 'Money' : 'Geld', color: '#3f8f9b' });
}

interface Wanted { id: string; title: string; date: string; time: string; remind: number | null; note?: string }

function wanted(lang: 'de' | 'en'): Wanted[] {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const cur = budgetSettingsStore.get().currency;
  const out: Wanted[] = [];
  const t = todayStr();
  const to = addDays(t, HORIZON_DAYS);
  billsRepo.getAll().forEach((b) => {
    if (b.cal && !b.paid && b.due) out.push({ id: `${PREFIX}bill-${b.id}`, title: `${b.emoji || '🧾'} ${b.title} · ${money(b.amount, cur, lang)}`, date: b.due, time: '09:00', remind: b.remind ?? null, note: b.where ? `${L('Liegt', 'Kept')}: ${b.where}` : undefined });
  });
  const ticks = new Set(ticksRepo.getAll().map((x) => x.id));
  recurringRepo.getAll().forEach((r) => {
    if (r.paused) return;
    if (r.cal) {
      occurrences(r, t, to).forEach((d) => {
        if (ticks.has(tickKey(r.id, d))) return;
        out.push({ id: `${PREFIX}rec-${r.id}-${d}`, title: `${r.emoji} ${r.label} · ${money(r.amount, cur, lang)}`, date: d, time: '09:00', remind: r.remind ?? null });
      });
    }
    if (r.info?.calCancel && r.info.cancelUntil && r.info.cancelUntil >= t) {
      out.push({ id: `${PREFIX}cancel-${r.id}`, title: `✂️ ${L('Kündigungsfrist', 'Cancellation deadline')}: ${r.label}`, date: r.info.cancelUntil, time: '09:00', remind: r.remind ?? 4320, note: r.info.keptAt ? `${L('Unterlagen', 'Papers')}: ${r.info.keptAt}` : undefined });
    }
  });
  return out;
}

export function syncBudgetCalendar(lang: 'de' | 'en'): void {
  const want = wanted(lang);
  const existing = appointmentsRepo.getAll().filter((a) => a.id.startsWith(PREFIX));
  const keep = new Set(want.map((w) => w.id));
  existing.forEach((a) => { if (!keep.has(a.id)) appointmentsRepo.remove(a.id); });
  if (want.length === 0) return;
  ensureCategory(lang);
  const now = nowIso();
  want.forEach((w) => {
    const old = existing.find((a) => a.id === w.id);
    const changed = !old || old.date !== w.date || old.time !== w.time || (old.reminderMinutes ?? null) !== w.remind;
    if (old && !changed && old.title === w.title && old.note === w.note) return;
    const a: Appointment = {
      ...(old ?? { createdAt: now }),
      id: w.id,
      title: w.title,
      date: w.date,
      time: w.time,
      categoryId: BUDGET_CATEGORY_ID,
      note: w.note,
      reminderMinutes: w.remind,
      reminderDeliveredAt: changed ? undefined : old?.reminderDeliveredAt,
      followUpDeliveredAt: old?.followUpDeliveredAt ?? now,
      updatedAt: now,
    };
    appointmentsRepo.save(a);
  });
}

/** Läuft einmal in der App-Hülle: hält die Kalender-Einträge des Budget-Planers aktuell (auch ohne die Seite zu öffnen). */
export function BudgetSync() {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  useEffect(() => {
    const run = () => { try { syncBudgetCalendar(lang); } catch { /* ignore */ } };
    run();
    const id = window.setInterval(run, 60 * 60 * 1000);
    window.addEventListener(BUDGET_CHANGED, run);
    return () => { window.clearInterval(id); window.removeEventListener(BUDGET_CHANGED, run); };
  }, [lang]);
  return null;
}
