import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { DeleteButton, ghostBtn, primaryBtn, pill } from '../budget/budgetUi';
import { useL } from '../projects/useL';
import { createId } from '../../services/storage/repository';
import { routinesRepo } from '../routines/routinesRepo';
import { projectsRepo, emojiOf } from '../projects/projectModel';
import { PROJECT_CATEGORY_ID } from '../projects/projectCalendar';
import { appointmentsRepo, calendarCategoriesRepo, dayKey, type Appointment } from './calendarRepo';

export const ROUTINE_CATEGORY_ID = 'cal_routinen';

/** Kategorie „Routinen“ / „Projekte“ anlegen, falls es sie noch nicht gibt */
function ensureCategory(kind: 'routine' | 'project', lang: 'de' | 'en'): string {
  const id = kind === 'routine' ? ROUTINE_CATEGORY_ID : PROJECT_CATEGORY_ID;
  if (!calendarCategoriesRepo.getById(id)) {
    calendarCategoriesRepo.save({ id, label: kind === 'routine' ? (lang === 'en' ? 'Routines' : 'Routinen') : (lang === 'en' ? 'Projects' : 'Projekte'), color: kind === 'routine' ? '#6fbf73' : '#4a8f9e' });
  }
  return id;
}

/** Wie sieht der Eintrag im Kalender aus? (Symbol, Name, Farbe, Ziel) */
export function planInfo(a: Appointment): { emoji: string; label: string; color: string; open: string; openLabelDe: string; openLabelEn: string; exists: boolean } | null {
  if (!a.plan) return null;
  if (a.plan.kind === 'routine') {
    const r = routinesRepo.getById(a.plan.refId);
    return { emoji: r?.emoji ?? '🌱', label: 'Routine', color: r?.color ?? '#6fbf73', open: `/entdecken/routinen/${a.plan.refId}/start`, openLabelDe: 'Starten', openLabelEn: 'Start', exists: !!r };
  }
  const p = projectsRepo.getById(a.plan.refId);
  return { emoji: p ? emojiOf(p) : '🧩', label: 'Projekt', color: p?.color ?? '#4a8f9e', open: `/entdecken/projekte/${a.plan.refId}`, openLabelDe: 'Öffnen', openLabelEn: 'Open', exists: !!p };
}

type Repeat = 'once' | 'daily' | 'weekly';

/**
 * Eine Routine oder ein Projekt im Kalender einplanen (neu oder ändern).
 * Der Eintrag ist ein ganz normaler Kalender-Eintrag (Erinnerung möglich), nur mit einem Verweis – und er sieht anders aus.
 */
export function PlanSheet({ kind, day, existing, onClose, onSaved }: { kind: 'routine' | 'project'; day: string; existing?: Appointment; onClose: () => void; onSaved: (a: Appointment) => void }) {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const routines = routinesRepo.getAll();
  const projects = projectsRepo.getAll().filter((p) => !p.archived && p.status !== 'done');
  const options = kind === 'routine'
    ? routines.map((r) => ({ id: r.id, emoji: r.emoji, title: r.title, color: r.color }))
    : projects.map((p) => ({ id: p.id, emoji: emojiOf(p), title: p.title, color: p.color }));
  const [refId, setRefId] = useState<string | undefined>(existing?.plan?.refId ?? (options.length === 1 ? options[0].id : undefined));
  const [date, setDate] = useState(existing?.date ?? day);
  const [time, setTime] = useState(existing?.time ?? (kind === 'routine' ? '08:00' : '10:00'));
  const [reminder, setReminder] = useState<number | null>(existing ? existing.reminderMinutes ?? null : null);
  const [repeat, setRepeat] = useState<Repeat>('once');
  const chosen = options.find((o) => o.id === refId);
  const info = existing ? planInfo(existing) : null;

  const save = () => {
    if (!chosen) return;
    const cat = ensureCategory(kind, lang);
    const now = new Date().toISOString();
    const make = (d: string, id?: string): Appointment => ({
      ...(existing ?? { createdAt: now }),
      id: id ?? existing?.id ?? createId('plan'),
      title: chosen.title || (kind === 'routine' ? L('Routine', 'Routine') : L('Projekt', 'Project')),
      date: d,
      time,
      categoryId: cat,
      plan: { kind, refId: chosen.id },
      reminderMinutes: reminder,
      reminderDeliveredAt: existing && existing.date === d && existing.time === time ? existing.reminderDeliveredAt : undefined,
      // keine „Wie war dein Termin?“-Nachfrage für eingeplante Routinen / Projekte
      followUpDeliveredAt: existing?.followUpDeliveredAt ?? now,
      updatedAt: now,
    });
    let first: Appointment;
    if (existing || repeat === 'once') {
      first = make(date);
      appointmentsRepo.save(first);
    } else {
      const n = repeat === 'daily' ? 7 : 4;
      const step = repeat === 'daily' ? 1 : 7;
      const [y, m, dd] = date.split('-').map(Number);
      first = make(date, createId('plan'));
      for (let i = 0; i < n; i++) {
        const d = new Date(y, m - 1, dd + i * step);
        const a = i === 0 ? first : make(dayKey(d), createId('plan'));
        appointmentsRepo.save(a);
      }
    }
    onSaved(first);
  };

  const title = existing ? (kind === 'routine' ? L('Routine im Kalender', 'Routine in the calendar') : L('Projekt im Kalender', 'Project in the calendar')) : (kind === 'routine' ? L('Routine einplanen', 'Plan a routine') : L('Projekt einplanen', 'Plan a project'));
  const lbl = 'block text-[12.5px] text-[var(--color-text-muted)] mb-1';
  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col gap-3.5" data-testid="plan-sheet">
        {options.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)]" data-testid="plan-none">
            {kind === 'routine' ? L('Du hast noch keine Routine. Leg zuerst eine unter „Routinen & mein Garten“ an.', 'You have no routine yet. Create one first under “Routines & my garden”.') : L('Du hast noch kein offenes Projekt. Leg zuerst eins unter „Meine Projekte“ an.', 'You have no open project yet. Create one first under “My projects”.')}
          </p>
        ) : (
          <div>
            <span className={lbl}>{kind === 'routine' ? L('Welche Routine?', 'Which routine?') : L('Welches Projekt?', 'Which project?')}</span>
            <ul className="flex flex-col gap-1.5 max-h-[34vh] overflow-y-auto" data-testid="plan-options">
              {options.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setRefId(o.id)} aria-pressed={refId === o.id} className="w-full flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 min-h-[48px] border" style={{ borderColor: refId === o.id ? o.color : 'var(--color-border)', background: refId === o.id ? `${o.color}26` : 'var(--color-surface)', outline: refId === o.id ? `2px solid ${o.color}` : 'none' }} data-testid={`plan-option-${o.id}`}>
                    <span className="text-[20px]" aria-hidden>{o.emoji}</span>
                    <span className="flex-1 text-[14.5px] text-[var(--color-text)]">{o.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {options.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block"><span className={lbl}>{L('Tag', 'Day')}</span><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} data-testid="plan-date" /></label>
              <label className="block"><span className={lbl}>{L('Uhrzeit', 'Time')}</span><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} data-testid="plan-time" /></label>
            </div>
            <label className="block">
              <span className={lbl}>{L('Erinnerung (ins Postfach)', 'Reminder (to the Postfach)')}</span>
              <select className="input" value={reminder === null ? 'none' : String(reminder)} onChange={(e) => setReminder(e.target.value === 'none' ? null : Number(e.target.value))} data-testid="plan-reminder">
                <option value="none">{L('Keine', 'None')}</option>
                <option value="0">{L('Zur Uhrzeit', 'At the time')}</option>
                <option value="15">{L('15 Minuten vorher', '15 minutes before')}</option>
                <option value="60">{L('1 Stunde vorher', '1 hour before')}</option>
                <option value="1440">{L('1 Tag vorher', '1 day before')}</option>
              </select>
            </label>
            {!existing && (
              <div>
                <span className={lbl}>{L('Wie oft?', 'How often?')}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {([['once', L('Einmal', 'Once')], ['daily', L('Jeden Tag (7 Tage)', 'Every day (7 days)')], ['weekly', L('Jede Woche (4 Wochen)', 'Every week (4 weeks)')]] as [Repeat, string][]).map(([k, t]) => (
                    <button key={k} type="button" onClick={() => setRepeat(k)} className={pill(repeat === k)} style={repeat === k ? { background: 'var(--color-primary)' } : undefined} data-testid={`plan-repeat-${k}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          {options.length > 0 && <button type="button" onClick={save} disabled={!chosen} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="plan-save">{L('Einplanen', 'Plan it')}</button>}
          {existing && info?.exists && <button type="button" onClick={() => navigate(info.open)} className={ghostBtn} data-testid="plan-open">{kind === 'routine' ? <Play size={15} /> : <ArrowRight size={15} />} {lang === 'en' ? info.openLabelEn : info.openLabelDe}</button>}
          {existing && <DeleteButton onDelete={() => { appointmentsRepo.remove(existing.id); onSaved(existing); }} L={L} label={L('Aus dem Kalender nehmen', 'Remove from calendar')} testId="plan-delete" />}
        </div>
      </div>
    </Modal>
  );
}
