import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { dayKey } from '../../calendar/calendarRepo';
import { formatDate, newId, type Milestone, type TimelineBlock } from '../projectModel';
import { AddModeToggle, AddRow, DelBtn, Empty, RemindSelect, SmallLabel, type BlockProps } from '../ui';

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const dayNum = (d: string) => Math.round(new Date(`${d}T12:00:00`).getTime() / 86400000);

/** der Zeitstrahl: Start – Ende, Heute-Marke und die Meilensteine als Punkte */
export function TimelineStrip({ block, start, end, lang, L, extra = [] }: { block: TimelineBlock; start?: string; end?: string; lang: 'de' | 'en'; L: BlockProps['L']; extra?: { date: string; done: boolean }[] }) {
  const today = dayKey(new Date());
  const dated = block.milestones.filter((m) => m.date);
  const smalls = [...block.milestones.flatMap((m) => m.steps.filter((x) => x.date).map((x) => ({ date: x.date as string, done: x.done }))), ...extra];
  const all = [...dated.map((m) => m.date as string), ...smalls.map((x) => x.date), ...(start ? [start] : []), ...(end ? [end] : [])];
  if (all.length === 0) return null;
  const minD = Math.min(...all.map(dayNum), dayNum(today) > Math.max(...all.map(dayNum)) ? Infinity : dayNum(today));
  const maxD = Math.max(...all.map(dayNum), dayNum(today) < Math.min(...all.map(dayNum)) ? -Infinity : dayNum(today));
  const span = Math.max(1, maxD - minD);
  const W = 640;
  const X = (d: string) => 30 + ((dayNum(d) - minD) / span) * (W - 60);
  const tx = X(today);
  const showToday = dayNum(today) >= minD && dayNum(today) <= maxD;
  const sorted = [...dated].sort((a, b) => (a.date as string).localeCompare(b.date as string));
  return (
    <svg viewBox={`0 0 ${W} 112`} className="w-full mb-3" role="img" aria-label={L('Zeitstrahl', 'Timeline')} data-testid="timeline-strip">
      <line x1="30" y1="56" x2={W - 30} y2="56" stroke="var(--color-border-strong)" strokeWidth="4" strokeLinecap="round" />
      {showToday && <line x1="30" y1="56" x2={tx} y2="56" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" opacity="0.5" />}
      {start && <text x="30" y="106" fontSize="11" fill="var(--color-text-faint)" textAnchor="start">{formatDate(start, lang, false)}</text>}
      {end && <text x={W - 30} y="106" fontSize="11" fill="var(--color-text-faint)" textAnchor="end">{formatDate(end, lang, false)}</text>}
      {showToday && (
        <g>
          <line x1={tx} y1="38" x2={tx} y2="74" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="3 3" />
          <text x={tx} y="32" fontSize="11" fill="var(--color-primary)" textAnchor="middle">{L('heute', 'today')}</text>
        </g>
      )}
      {smalls.map((sm, i) => (
        <circle key={`sm${i}`} cx={X(sm.date)} cy="56" r="4.5" fill={sm.done ? 'var(--color-primary)' : 'var(--color-surface)'} stroke="var(--color-primary)" strokeWidth="2" opacity="0.8" />
      ))}
      {sorted.map((m, i) => {
        const x = X(m.date as string);
        const up = i % 2 === 0;
        return (
          <g key={m.id}>
            <circle cx={x} cy="56" r="9" fill={m.done ? 'var(--color-primary)' : 'var(--color-surface)'} stroke="var(--color-primary)" strokeWidth="3" />
            {m.done && <text x={x} y="60" fontSize="11" fill="#fff" textAnchor="middle">✓</text>}
            <text x={x} y={up ? 24 : 90} fontSize="11.5" fill="var(--color-text)" textAnchor={x < 90 ? 'start' : x > W - 90 ? 'end' : 'middle'}>{short(m.title || '…', 16)}</text>
            <text x={x} y={up ? 38 : 104} fontSize="10" fill="var(--color-text-faint)" textAnchor={x < 90 ? 'start' : x > W - 90 ? 'end' : 'middle'}>{formatDate(m.date, lang, false)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function BlockTimeline({ block, project, L, lang, onChange }: BlockProps<TimelineBlock>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [msDone, setMsDone] = useState(false);
  const [stDone, setStDone] = useState(false);
  const patch = (id: string, p: Partial<Milestone>) => onChange({ ...block, milestones: block.milestones.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const setStep = (m: Milestone, sid: string, p: Partial<Milestone['steps'][number]>) => {
    const steps = m.steps.map((s) => (s.id === sid ? { ...s, ...p } : s));
    patch(m.id, { steps, ...(steps.length > 0 ? { done: steps.every((s) => s.done) } : {}) });
  };
  const sorted = [...block.milestones].sort((a, b) => (a.date ? 0 : 1) - (b.date ? 0 : 1) || (a.date ?? '').localeCompare(b.date ?? ''));

  return (
    <div>
      <TimelineStrip block={block} start={project.start} end={project.end} lang={lang} L={L} extra={(project.steps ?? []).filter((x) => x.date).map((x) => ({ date: x.date as string, done: x.done }))} />
      {block.milestones.length === 0 && <Empty>{L('Noch kein Meilenstein. Ein Meilenstein ist ein Zwischenziel, z. B. „Ort steht fest“ oder „Material ist da“.', 'No milestone yet. A milestone is an interim goal, e.g. "place is fixed" or "material is here".')}</Empty>}
      <ol className="relative flex flex-col gap-2 pl-5" data-testid="milestones" style={{ borderLeft: '3px solid var(--color-border-strong)', marginLeft: 8 }}>
        {sorted.map((m) => {
          const open = openId === m.id;
          const sd = m.steps.filter((s) => s.done).length;
          return (
            <li key={m.id} className="relative rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-2" data-testid={`ms-${m.id}`}>
              <button
                type="button"
                onClick={() => patch(m.id, { done: !m.done })}
                aria-pressed={m.done}
                aria-label={L('Meilenstein geschafft', 'Milestone reached')}
                className="absolute -left-[34px] top-2.5 w-6 h-6 rounded-full border-[3px] flex items-center justify-center text-[12px] text-white"
                style={{ borderColor: 'var(--color-primary)', background: m.done ? 'var(--color-primary)' : 'var(--color-bg)' }}
                data-testid={`ms-done-${m.id}`}
              >
                {m.done ? '✓' : ''}
              </button>
              <div className="flex items-center gap-1.5">
                <input className="flex-1 min-w-0 bg-transparent outline-none text-[15px] py-1" style={{ textDecoration: m.done ? 'line-through' : 'none', opacity: m.done ? 0.65 : 1 }} value={m.title} placeholder={L('Meilenstein', 'Milestone')} onChange={(e) => patch(m.id, { title: e.target.value })} data-testid={`ms-title-${m.id}`} />
                <input type="date" className="input !h-9 !py-0 !w-[8.6rem] text-[13px]" value={m.date ?? ''} onChange={(e) => patch(m.id, { date: e.target.value || undefined, ...(e.target.value ? {} : { remind: null }) })} aria-label={L('Datum', 'Date')} data-testid={`ms-date-${m.id}`} />
                <button type="button" onClick={() => setOpenId(open ? null : m.id)} aria-expanded={open} aria-label={L('Details', 'Details')} className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`ms-more-${m.id}`}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
              </div>
              {m.steps.length > 0 && <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Kleine Schritte', 'Small steps')}: {sd}/{m.steps.length}</p>}
              {open && (
                <div className="mt-2 flex flex-col gap-2">
                  {m.date && (
                    <div className="flex flex-wrap gap-2 items-end">
                      <label><SmallLabel>{L('Uhrzeit (optional)', 'Time (optional)')}</SmallLabel><input type="time" className="input !h-9 !py-0 text-[13px]" value={m.time ?? ''} onChange={(e) => patch(m.id, { time: e.target.value || undefined })} /></label>
                      <RemindSelect value={m.remind} onChange={(v) => patch(m.id, { remind: v })} L={L} testId={`ms-remind-${m.id}`} />
                    </div>
                  )}
                  {m.date && <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Steht dann auch im Kalender.', 'Then it is also in the calendar.')}</p>}
                  <div>
                    <SmallLabel>{L('Kleine Schritte (Babysteps)', 'Small steps (baby steps)')}</SmallLabel>
                    <ul className="flex flex-col gap-1">
                      {m.steps.map((s) => (
                        <li key={s.id} className="flex items-center gap-1.5">
                          <button type="button" onClick={() => setStep(m, s.id, { done: !s.done })} aria-pressed={s.done} aria-label={L('Abhaken', 'Tick off')} className="w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-[13px] text-white" style={{ borderColor: 'var(--color-primary)', background: s.done ? 'var(--color-primary)' : 'transparent' }} data-testid={`step-check-${s.id}`}>{s.done ? '✓' : ''}</button>
                          <input className="flex-1 min-w-0 bg-transparent outline-none text-[14px] py-1" style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.6 : 1 }} value={s.text} onChange={(e) => setStep(m, s.id, { text: e.target.value })} aria-label={L('Schritt', 'Step')} />
                          <input type="date" className="input !h-8 !py-0 !w-[7.6rem] text-[12px]" value={s.date ?? ''} onChange={(e) => setStep(m, s.id, { date: e.target.value || undefined, ...(e.target.value ? {} : { time: undefined }) })} aria-label={L('Datum', 'Date')} />
                          {s.date && <input type="time" className="input !h-8 !py-0 !w-[5.4rem] text-[12px]" value={s.time ?? ''} onChange={(e) => setStep(m, s.id, { time: e.target.value || undefined })} aria-label={L('Uhrzeit', 'Time')} />}
                          <DelBtn onClick={() => patch(m.id, { steps: m.steps.filter((x) => x.id !== s.id) })} L={L} />
                        </li>
                      ))}
                    </ul>
                    <AddModeToggle done={stDone} onChange={setStDone} L={L} testId={`step-mode-${m.id}`} />
                    <AddRow placeholder={stDone ? L('Kleiner Schritt, den du schon gemacht hast …', 'A small step you already did …') : L('Neuer kleiner Schritt …', 'New small step …')} onAdd={(text) => { const steps = [...m.steps, { id: newId('s'), text, done: stDone }]; patch(m.id, { steps, done: steps.every((x) => x.done) }); }} testId={`step-new-${m.id}`} />
                  </div>
                  <input className="input !h-9 text-[13px]" value={m.note ?? ''} placeholder={L('Kurze Notiz', 'Short note')} onChange={(e) => patch(m.id, { note: e.target.value })} />
                  <div className="self-end"><DelBtn onClick={() => onChange({ ...block, milestones: block.milestones.filter((x) => x.id !== m.id) })} L={L} testId={`ms-del-${m.id}`} /></div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <AddModeToggle done={msDone} onChange={setMsDone} L={L} testId="ms-mode" />
      <AddRow placeholder={msDone ? L('Meilenstein, den du schon erreicht hast …', 'A milestone you already reached …') : L('Neuer Meilenstein …', 'New milestone …')} onAdd={(title) => { const id = newId('m'); onChange({ ...block, milestones: [...block.milestones, { id, title, done: msDone, steps: [] }] }); if (!msDone) setOpenId(id); }} testId="ms-new" />
    </div>
  );
}
