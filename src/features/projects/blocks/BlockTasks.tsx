import { useState } from 'react';
import { ChevronDown, ChevronRight, LayoutList, Columns3 } from 'lucide-react';
import { newId, type ChecklistBlock, type ProjectTask, type TaskStatus, type TasksBlock } from '../projectModel';
import { AddRow, DelBtn, Empty, PersonSelect, RemindSelect, SmallLabel, chipCls, chipOn, type BlockProps } from '../ui';

const NEXT: Record<TaskStatus, TaskStatus> = { open: 'doing', doing: 'done', done: 'open' };

function statusText(s: TaskStatus, L: BlockProps['L']) {
  return s === 'open' ? L('offen', 'open') : s === 'doing' ? L('in Arbeit', 'in progress') : L('erledigt', 'done');
}

export function BlockTasks({ block, project, L, onChange }: BlockProps<TasksBlock>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const patch = (id: string, p: Partial<ProjectTask>) => onChange({ ...block, items: block.items.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const view = block.view ?? 'list';
  const done = block.items.filter((t) => t.status === 'done').length;

  const card = (t: ProjectTask) => {
    const open = openId === t.id;
    const who = project.people.find((p) => p.id === t.who)?.name;
    return (
      <li key={t.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2 py-1.5" data-testid={`task-${t.id}`}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => patch(t.id, { status: t.status === 'done' ? 'open' : 'done' })}
            aria-pressed={t.status === 'done'}
            aria-label={L('Abhaken', 'Tick off')}
            className="w-7 h-7 shrink-0 rounded-md border-2 flex items-center justify-center text-[15px]"
            style={{ borderColor: 'var(--color-primary)', background: t.status === 'done' ? 'var(--color-primary)' : 'transparent', color: '#fff' }}
            data-testid={`task-check-${t.id}`}
          >
            {t.status === 'done' ? '✓' : t.status === 'doing' ? <span className="block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} /> : ''}
          </button>
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1.5"
            style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.6 : 1 }}
            value={t.text}
            onChange={(e) => patch(t.id, { text: e.target.value })}
            aria-label={L('Aufgabe', 'Task')}
          />
          <button type="button" onClick={() => patch(t.id, { status: NEXT[t.status] })} className="text-[11.5px] px-2 py-1 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-muted)] shrink-0" data-testid={`task-status-${t.id}`}>{statusText(t.status, L)}</button>
          <button type="button" onClick={() => setOpenId(open ? null : t.id)} aria-expanded={open} aria-label={L('Details', 'Details')} className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`task-more-${t.id}`}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        {!open && (who || t.due) && (
          <p className="text-[11.5px] text-[var(--color-text-faint)] pl-9 -mt-0.5">{[who, t.due ? new Date(`${t.due}T12:00:00`).toLocaleDateString(L('de-DE', 'en-US'), { day: '2-digit', month: '2-digit' }) : ''].filter(Boolean).join(' · ')}</p>
        )}
        {open && (
          <div className="pl-9 pr-1 pb-2 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-end">
              <PersonSelect project={project} value={t.who} onChange={(v) => patch(t.id, { who: v })} L={L} testId={`task-who-${t.id}`} />
              <label><SmallLabel>{L('Bis wann', 'Due')}</SmallLabel><input type="date" className="input !h-9 !py-0 text-[13px]" value={t.due ?? ''} onChange={(e) => patch(t.id, { due: e.target.value || undefined, ...(e.target.value ? {} : { remind: null }) })} data-testid={`task-due-${t.id}`} /></label>
              {t.due && <label><SmallLabel>{L('Uhrzeit', 'Time')}</SmallLabel><input type="time" className="input !h-9 !py-0 text-[13px]" value={t.time ?? ''} onChange={(e) => patch(t.id, { time: e.target.value || undefined })} /></label>}
            </div>
            {t.due && <RemindSelect value={t.remind} onChange={(v) => patch(t.id, { remind: v })} L={L} testId={`task-remind-${t.id}`} />}
            {t.due && <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Steht dann auch im Kalender.', 'Then it is also in the calendar.')}</p>}
            <input className="input !h-9 text-[13px]" value={t.note ?? ''} placeholder={L('Kurze Notiz', 'Short note')} onChange={(e) => patch(t.id, { note: e.target.value })} />
            <div className="self-end"><DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== t.id) })} L={L} testId={`task-del-${t.id}`} /></div>
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[12.5px] text-[var(--color-text-muted)]">{block.items.length > 0 ? `${done}/${block.items.length} ${L('erledigt', 'done')}` : ''}</span>
        <span className="flex-1" />
        <button type="button" onClick={() => onChange({ ...block, view: 'list' })} className={`${chipCls(view === 'list')} flex items-center gap-1`} style={view === 'list' ? chipOn : undefined} data-testid="tasks-view-list"><LayoutList size={13} />{L('Liste', 'List')}</button>
        <button type="button" onClick={() => onChange({ ...block, view: 'board' })} className={`${chipCls(view === 'board')} flex items-center gap-1`} style={view === 'board' ? chipOn : undefined} data-testid="tasks-view-board"><Columns3 size={13} />{L('Tafel', 'Board')}</button>
      </div>
      {block.items.length === 0 && <Empty>{L('Noch keine Aufgabe. Eine kleine reicht.', 'No task yet. A small one is enough.')}</Empty>}
      {view === 'list' ? (
        <ul className="flex flex-col gap-1.5">{block.items.map(card)}</ul>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="tasks-board">
          {(['open', 'doing', 'done'] as TaskStatus[]).map((s) => (
            <div key={s} className="min-w-[78%] sm:min-w-[0] sm:flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{statusText(s, L)} ({block.items.filter((t) => t.status === s).length})</p>
              <ul className="flex flex-col gap-1.5">{block.items.filter((t) => t.status === s).map(card)}</ul>
            </div>
          ))}
        </div>
      )}
      <AddRow placeholder={L('Neue Aufgabe …', 'New task …')} onAdd={(text) => onChange({ ...block, items: [...block.items, { id: newId('t'), text, status: 'open' }] })} testId="task-new" />
    </div>
  );
}

export function BlockChecklist({ block, project, L, onChange }: BlockProps<ChecklistBlock>) {
  const patch = (id: string, p: Partial<ChecklistBlock['items'][number]>) => onChange({ ...block, items: block.items.map((t) => (t.id === id ? { ...t, ...p } : t)) });
  const done = block.items.filter((t) => t.done).length;
  return (
    <div>
      {block.items.length > 0 && <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{done}/{block.items.length} {L('erledigt', 'done')}</p>}
      {block.items.length === 0 && <Empty>{L('Noch nichts drin.', 'Nothing in here yet.')}</Empty>}
      <ul className="flex flex-col gap-1.5">
        {block.items.map((t) => (
          <li key={t.id} className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2 py-1" data-testid={`check-${t.id}`}>
            <button type="button" onClick={() => patch(t.id, { done: !t.done })} aria-pressed={t.done} aria-label={L('Abhaken', 'Tick off')} className="w-7 h-7 shrink-0 rounded-md border-2 flex items-center justify-center text-[15px]" style={{ borderColor: 'var(--color-primary)', background: t.done ? 'var(--color-primary)' : 'transparent', color: '#fff' }} data-testid={`check-box-${t.id}`}>{t.done ? '✓' : ''}</button>
            <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1.5" style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }} value={t.text} onChange={(e) => patch(t.id, { text: e.target.value })} aria-label={L('Eintrag', 'Item')} />
            <PersonSelect project={project} value={t.who} onChange={(v) => patch(t.id, { who: v })} L={L} label={L('Wer bringt’s?', 'Who brings it?')} />
            <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== t.id) })} L={L} />
          </li>
        ))}
      </ul>
      <AddRow placeholder={L('Neuer Eintrag …', 'New item …')} onAdd={(text) => onChange({ ...block, items: [...block.items, { id: newId('c'), text, done: false }] })} testId="check-new" />
    </div>
  );
}
