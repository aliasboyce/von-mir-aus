import { useState } from 'react';
import { ArrowUp, CalendarPlus, Check, ChevronDown, ChevronRight, Trash2, Undo2 } from 'lucide-react';
import { newStep, stamp, type ProjectStep } from './projectModel';
import { AddRow, RemindSelect, SmallLabel } from './ui';
import { KIND_COLOR } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import type { ProjectApi } from './projectApi';

function StepCard({ s, first, api, onChange, onDone, onUp, onDelete }: { s: ProjectStep; first: boolean; api: ProjectApi; onChange: (p: Partial<ProjectStep>) => void; onDone: () => void; onUp?: () => void; onDelete: () => void }) {
  const { L, lang } = api;
  const [cal, setCal] = useState(false);
  const scheduled = !!s.date;
  const c = KIND_COLOR.steps;
  return (
    <div className={`rounded-2xl p-3 ${first ? 'proj-glow' : ''}`} style={{ ['--tile-c' as string]: c, background: `color-mix(in srgb, ${c} ${first ? 16 : 7}%, var(--color-surface))`, border: `2px solid color-mix(in srgb, ${c} ${first ? 90 : 40}%, transparent)` }} data-testid={first ? 'step-current' : 'step-card'}>
      {first && <p className="text-[11.5px] mb-1" style={{ color: c }}>✨ {L('Jetzt dran', 'Up now')}</p>}
      <div className="flex items-start gap-2.5">
        <button type="button" onClick={onDone} className="w-9 h-9 shrink-0 rounded-full border-2 flex items-center justify-center" style={{ borderColor: c, color: c }} aria-label={L('Geschafft', 'Done')} data-testid="step-done"><Check size={18} /></button>
        <input className="flex-1 min-w-0 bg-transparent outline-none text-[16px] leading-snug py-1.5" value={s.text} onChange={(e) => onChange({ text: e.target.value })} aria-label={L('Schritt', 'Step')} data-testid="step-text" />
        {onUp && <button type="button" onClick={onUp} className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Nach vorne', 'Move to front')} data-testid="step-up"><ArrowUp size={16} /></button>}
        <button type="button" onClick={onDelete} className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--color-text-faint)]" aria-label={L('Entfernen', 'Remove')} data-testid="step-delete"><Trash2 size={15} /></button>
      </div>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-[11.5px] text-[var(--color-text-faint)]">{stamp(s.createdAt, lang)}</span>
        <button type="button" onClick={() => setCal((v) => !v)} aria-expanded={cal} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] border" style={scheduled ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' } : { borderColor: 'var(--color-border-strong)', color: 'var(--color-text-muted)' }} data-testid="step-calendar">
          <CalendarPlus size={14} />{scheduled ? `${new Date(`${s.date}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' })} ${s.time || '09:00'}` : L('In den Kalender', 'Into the calendar')}
        </button>
      </div>
      {cal && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl p-2.5 bg-[var(--color-surface)]" data-testid="step-calendar-form">
          <label><SmallLabel>{L('Tag', 'Day')}</SmallLabel><input type="date" className="input" value={s.date ?? ''} onChange={(e) => onChange({ date: e.target.value || undefined, time: e.target.value ? s.time || '09:00' : undefined })} data-testid="step-date" /></label>
          <label><SmallLabel>{L('Uhrzeit', 'Time')}</SmallLabel><input type="time" className="input" value={s.time ?? ''} onChange={(e) => onChange({ time: e.target.value || undefined })} data-testid="step-time" /></label>
          <div className="col-span-2"><RemindSelect value={s.remind} onChange={(v) => onChange({ remind: v })} L={L} testId="step-remind" /></div>
          <p className="col-span-2 text-[12px] text-[var(--color-text-faint)]">{L('Im Kalender kannst du ihn später verschieben oder abhaken – hier ändert er sich mit.', 'In the calendar you can move or tick it off later – it changes here, too.')}</p>
          {scheduled && <button type="button" onClick={() => { onChange({ date: undefined, time: undefined, remind: undefined }); setCal(false); }} className="col-span-2 text-[12.5px] underline text-[var(--color-text-muted)]" data-testid="step-unschedule">{L('Wieder aus dem Kalender nehmen', 'Take it out of the calendar again')}</button>}
        </div>
      )}
    </div>
  );
}

export function ProjectSteps({ api }: { api: ProjectApi }) {
  const { p, L, lang, update } = api;
  const [showDone, setShowDone] = useState(false);
  const steps = p.steps ?? [];
  const open = steps.filter((s) => !s.done);
  const done = steps.filter((s) => s.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const patch = (id: string, ch: Partial<ProjectStep>) => update((c) => ({ ...c, steps: (c.steps ?? []).map((s) => (s.id === id ? { ...s, ...ch } : s)) }));
  const finish = (id: string) => update((c) => ({ ...c, steps: (c.steps ?? []).map((s) => (s.id === id ? { ...s, done: true, doneAt: new Date().toISOString() } : s)) }));
  const front = (id: string) => update((c) => {
    const list = c.steps ?? [];
    const it = list.find((s) => s.id === id);
    if (!it) return c;
    const firstOpen = list.findIndex((s) => !s.done);
    const rest = list.filter((s) => s.id !== id);
    rest.splice(Math.max(0, firstOpen), 0, it);
    return { ...c, steps: rest };
  });
  return (
    <ProjectSubShell api={api} current="schritte" icon="➡️" title={L('Nächste Schritte', 'Next steps')} color={KIND_COLOR.steps}>
      <AddRow placeholder={L('Was wäre ein kleiner nächster Schritt?', 'What would be a small next step?')} onAdd={(t) => update((c) => ({ ...c, steps: [...(c.steps ?? []), newStep(t)] }))} testId="step-add" />
      <div className="flex flex-col gap-2.5 mt-4" data-testid="step-list">
        {open.length === 0 && <p className="text-center text-[14px] text-[var(--color-text-muted)] py-6">{steps.length ? `🎉 ${L('Alle Schritte geschafft.', 'All steps done.')}` : L('Noch kein Schritt. Ein winziger reicht.', 'No step yet. A tiny one is enough.')}</p>}
        {open.map((s, i) => (
          <StepCard key={s.id} s={s} first={i === 0} api={api} onChange={(ch) => patch(s.id, ch)} onDone={() => finish(s.id)} onUp={i > 0 ? () => front(s.id) : undefined} onDelete={() => update((c) => ({ ...c, steps: (c.steps ?? []).filter((x) => x.id !== s.id) }))} />
        ))}
      </div>
      {done.length > 0 && (
        <div className="mt-5">
          <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="flex items-center gap-1.5 text-[14px] text-[var(--color-text-muted)]" data-testid="steps-done-toggle">{showDone ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{L('Geschafft', 'Done')} ({done.length})</button>
          {showDone && (
            <div className="flex flex-col gap-1.5 mt-2" data-testid="steps-done-list">
              {done.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-[var(--color-surface-muted)]">
                  <span className="text-[14px]">✓</span>
                  <span className="flex-1 min-w-0 text-[14px] text-[var(--color-text-muted)] line-through truncate">{s.text}</span>
                  <span className="text-[11px] text-[var(--color-text-faint)] shrink-0">{s.doneAt ? stamp(s.doneAt, lang) : ''}</span>
                  <button type="button" onClick={() => patch(s.id, { done: false, doneAt: undefined })} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Wieder öffnen', 'Reopen')}><Undo2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ProjectSubShell>
  );
}
