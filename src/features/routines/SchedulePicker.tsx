import { useL } from '../projects/useL';
import { pill } from '../budget/budgetUi';
import { PER_WEEK_PRESETS, WEEKDAY_SHORT, type SchedulePattern } from './routineSchedule';

type Mode = 'daily' | 'everyN' | 'weekdays';

/** Rhythmus wählen: jeden Tag / jeden n-ten Tag / bestimmte Wochentage (mit Vorschlägen „n× pro Woche“). */
export function SchedulePicker({ pattern, onChange }: { pattern: SchedulePattern; onChange: (p: SchedulePattern) => void }) {
  const { L, lang } = useL();
  const days = pattern.kind === 'weekdays' ? pattern.days : [];
  const setMode = (m: Mode) => onChange(m === 'daily' ? { kind: 'daily' } : m === 'everyN' ? { kind: 'everyN', n: 2 } : { kind: 'weekdays', days: [0, 2, 4] });
  const toggle = (d: number) => onChange({ kind: 'weekdays', days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort() });
  const lbl = 'block text-[12.5px] text-[var(--color-text-muted)] mb-1';
  return (
    <div className="flex flex-col gap-2.5" data-testid="schedule-picker">
      <div className="flex gap-1.5 flex-wrap">
        {([['daily', L('Jeden Tag', 'Every day')], ['everyN', L('Alle … Tage', 'Every … days')], ['weekdays', L('Wochentage', 'Weekdays')]] as [Mode, string][]).map(([k, t]) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={pill(pattern.kind === k)} style={pattern.kind === k ? { background: 'var(--color-primary)' } : undefined} data-testid={`sched-mode-${k}`}>{t}</button>
        ))}
      </div>
      {pattern.kind === 'everyN' && (
        <label className="block">
          <span className={lbl}>{L('Alle wie viele Tage?', 'Every how many days?')}</span>
          <select className="input" value={pattern.n} onChange={(e) => onChange({ kind: 'everyN', n: Number(e.target.value) })} data-testid="sched-n">
            {[2, 3, 4, 5, 6, 7, 10, 14].map((n) => <option key={n} value={n}>{n === 2 ? L('Jeden zweiten Tag', 'Every second day') : L(`Alle ${n} Tage`, `Every ${n} days`)}</option>)}
          </select>
        </label>
      )}
      {pattern.kind === 'weekdays' && (
        <div>
          <span className={lbl}>{L('An welchen Tagen?', 'On which days?')}</span>
          <div className="flex gap-1.5 flex-wrap mb-2" role="group">
            {WEEKDAY_SHORT[lang].map((name, d) => (
              <button key={d} type="button" onClick={() => toggle(d)} aria-pressed={days.includes(d)} className="min-w-[44px] min-h-[44px] rounded-full text-[13px] border" style={days.includes(d) ? { background: 'var(--color-primary)', color: 'var(--color-surface)', borderColor: 'var(--color-primary)' } : { borderColor: 'var(--color-border-strong)', color: 'var(--color-text)' }} data-testid={`sched-day-${d}`}>{name}</button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[12px] text-[var(--color-text-faint)]">{L('Vorschlag:', 'Suggestion:')}</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onChange({ kind: 'weekdays', days: PER_WEEK_PRESETS[n] })} className="px-3 min-h-[40px] rounded-full text-[12.5px] border border-[var(--color-border)] text-[var(--color-text-muted)]" data-testid={`sched-perweek-${n}`}>{n}× {L('pro Woche', 'a week')}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Schnell-Uhrzeiten: morgens / mittags / abends */
export function TimeQuick({ time, onChange }: { time: string; onChange: (t: string) => void }) {
  const { L } = useL();
  return (
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {([['08:00', L('Morgens', 'Morning')], ['12:30', L('Mittags', 'Noon')], ['20:00', L('Abends', 'Evening')]] as [string, string][]).map(([t, label]) => (
        <button key={t} type="button" onClick={() => onChange(t)} aria-pressed={time === t} className="px-3 min-h-[40px] rounded-full text-[12.5px] border" style={time === t ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>{label} {t}</button>
      ))}
    </div>
  );
}
