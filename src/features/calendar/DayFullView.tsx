import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Play, ArrowRight, X } from 'lucide-react';
import { useL } from '../projects/useL';
import { useSettings } from '../../state/SettingsContext';
import { networkRepo } from '../safetyNet/networkRepo';
import { routinesRepo } from '../routines/routinesRepo';
import { describePattern, markHandled, schedulesOnDay, type RoutineSchedule } from '../routines/routineSchedule';
import { appointmentsOnDay, calendarCategoriesRepo, parseDay, wishesOnDay, wishesRepo, type Appointment } from './calendarRepo';
import { planInfo } from './PlanSheet';

type Item = { time: string; kind: 'appt'; a: Appointment } | { time: string; kind: 'sched'; s: RoutineSchedule };

/**
 * „Tag groß“: der gewählte Tag füllt den ganzen Bildschirm – Termine, Routinen (mit großem Starten-Knopf) und
 * „Ich muss gar nichts, aber ich will“ in einer ruhigen Zeitleiste. Nichts muss abgehakt werden; es wird nichts gezählt.
 */
export function DayFullView({ day, todayKey, onClose, onEditAppt, onEditSched }: { day: string; todayKey: string; onClose: () => void; onEditAppt: (a: Appointment) => void; onEditSched: (s: RoutineSchedule) => void }) {
  const { L, lang } = useL();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [, setV] = useState(0);
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(t); }, []);
  const categories = calendarCategoriesRepo.getAll();
  const people = networkRepo.getAll();
  const items: Item[] = [
    ...appointmentsOnDay(day).map((a) => ({ time: a.time, kind: 'appt' as const, a })),
    ...schedulesOnDay(day).map((s) => ({ time: s.time, kind: 'sched' as const, s })),
  ].sort((x, y) => x.time.localeCompare(y.time));
  const wishes = wishesOnDay(day);
  const isToday = day === todayKey;
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const markerIdx = isToday ? items.findIndex((i) => i.time > nowHM) : -1;
  const big = 'w-full text-left rounded-[22px] p-4 flex items-center gap-3.5';

  return createPortal(
    <div className="fixed inset-0 z-[260] overflow-y-auto" style={{ background: 'var(--color-bg)' }} data-testid="day-full">
      <div className="max-w-[560px] mx-auto px-5 pb-16" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            {isToday && <p className="text-[13px] uppercase tracking-wide text-[var(--color-primary)]">{L('Heute', 'Today')}</p>}
            <h1 className="text-[30px] leading-tight font-light">{parseDay(day).toLocaleDateString(locale, { weekday: 'long' })}</h1>
            <p className="text-[16px] text-[var(--color-text-muted)]">{parseDay(day).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={onClose} aria-label={L('Schließen', 'Close')} className="w-12 h-12 rounded-full border border-[var(--color-border-strong)] flex items-center justify-center shrink-0" data-testid="day-full-close"><X size={22} /></button>
        </div>

        {items.length === 0 && <p className="text-[15px] text-[var(--color-text-muted)] mb-6" data-testid="day-full-empty">{L('Für diesen Tag steht nichts an.', 'Nothing is planned for this day.')}</p>}
        <div className="flex flex-col gap-3 mb-8">
          {items.map((it, i) => (
            <div key={it.kind === 'appt' ? it.a.id : `${it.s.id}`}>
              {markerIdx === i && <div className="flex items-center gap-2 my-1 text-[12px] text-[var(--color-primary)]" aria-hidden="true"><span className="flex-1 border-t-2 border-[var(--color-primary)]" />{L('jetzt', 'now')} {nowHM}</div>}
              {it.kind === 'sched' ? (
                (() => {
                  const r = routinesRepo.getById(it.s.routineId);
                  const color = r?.color ?? '#6fbf73';
                  return (
                    <div className="flex items-stretch rounded-[22px] overflow-hidden" style={{ background: `${color}1f`, border: `2px dashed ${color}` }} data-testid="day-full-routine">
                      <button onClick={() => onEditSched(it.s)} className="flex-1 min-w-0 text-left flex items-center gap-3.5 p-4">
                        <span className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0" style={{ background: `${color}40` }} aria-hidden>{r?.emoji ?? '🌱'}</span>
                        <span className="min-w-0">
                          <span className="block text-[13px] tabular-nums text-[var(--color-text-muted)]">{it.s.time} · {L('Routine', 'Routine')} · {describePattern(it.s, lang)}</span>
                          <span className="block text-[18px] leading-snug">{r?.title}</span>
                        </span>
                      </button>
                      <button onClick={() => { markHandled(it.s.id, day); navigate(`/entdecken/routinen/${it.s.routineId}/start`); }} className="shrink-0 w-[92px] flex flex-col items-center justify-center gap-1 text-[14px]" style={{ background: `${color}40` }} data-testid="day-full-start"><Play size={22} />{L('Starten', 'Start')}</button>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const a = it.a;
                  const pi = planInfo(a);
                  const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
                  const color = pi?.color ?? categories.find((c) => c.id === a.categoryId)?.color ?? 'var(--color-text-faint)';
                  return (
                    <div className="flex items-stretch rounded-[22px] overflow-hidden" style={{ background: pi ? `${color}1f` : 'var(--color-surface)', border: pi ? `2px dashed ${color}` : '1px solid var(--color-border)', borderLeft: pi ? undefined : `6px solid ${color}` }}>
                      <button onClick={() => onEditAppt(a)} className={`${big} flex-1`}>
                        {pi && <span className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0" style={{ background: `${color}40` }} aria-hidden>{pi.emoji}</span>}
                        <span className="min-w-0">
                          <span className="block text-[13px] tabular-nums text-[var(--color-text-muted)]">{a.time}{a.endTime ? `–${a.endTime}` : ''}{person ? ` · ${person.name}` : ''}</span>
                          <span className="block text-[18px] leading-snug">{a.title}</span>
                          {a.note && <span className="block text-[13.5px] text-[var(--color-text-muted)] mt-1 whitespace-pre-line">{a.note}</span>}
                        </span>
                      </button>
                      {pi?.exists && <button onClick={() => navigate(pi.open)} className="shrink-0 w-[92px] flex flex-col items-center justify-center gap-1 text-[14px]" style={{ background: `${color}40` }}>{a.plan?.kind === 'routine' ? <Play size={22} /> : <ArrowRight size={22} />}{lang === 'en' ? pi.openLabelEn : pi.openLabelDe}</button>}
                    </div>
                  );
                })()
              )}
            </div>
          ))}
          {isToday && markerIdx === -1 && items.length > 0 && <div className="flex items-center gap-2 my-1 text-[12px] text-[var(--color-primary)]" aria-hidden="true"><span className="flex-1 border-t-2 border-[var(--color-primary)]" />{L('jetzt', 'now')} {nowHM}</div>}
        </div>

        {wishes.length > 0 && (
          <div className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[14px] font-medium mb-2">{L('Ich muss gar nichts, aber ich will:', 'I don’t have to, but I’d like to:')}</p>
            {wishes.map((w) => (
              <button key={w.id} onClick={() => { wishesRepo.save({ ...w, done: !w.done }); setV((v) => v + 1); }} aria-pressed={w.done} className="w-full flex items-center gap-3 min-h-[52px] text-left">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={w.done ? { background: 'var(--color-text-faint)', color: '#fff' } : { border: '1.5px solid var(--color-primary)' }}>{w.done && <Check size={15} />}</span>
                <span className="text-[16px]" style={{ textDecoration: w.done ? 'line-through' : 'none', opacity: w.done ? 0.7 : 1 }}>{w.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
