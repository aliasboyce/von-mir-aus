import { useState } from 'react';
import { X } from 'lucide-react';
import { LOG_ICON, LOG_MAX, logEntry, newId, newStep, type LogKind } from './projectModel';
import { AddRow } from './ui';
import { KIND_COLOR } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import type { ProjectApi } from './projectApi';

type Adder = 'step' | 'task' | 'insight' | 'note';

export function ProjectLog({ api }: { api: ProjectApi }) {
  const { p, L, lang, update, go } = api;
  const [kind, setKind] = useState<Adder>('insight');
  const adders: { id: Adder; icon: string; de: string; en: string; ph: [string, string] }[] = [
    { id: 'step', icon: '➡️', de: 'Nächster Schritt', en: 'Next step', ph: ['Was ist der nächste Schritt?', 'What is the next step?'] },
    { id: 'task', icon: '✅', de: 'To-do', en: 'To-do', ph: ['Was muss erledigt werden?', 'What has to be done?'] },
    { id: 'insight', icon: '💡', de: 'Erkenntnis', en: 'Insight', ph: ['Was ist dir klar geworden?', 'What became clear to you?'] },
    { id: 'note', icon: '📝', de: 'Notiz', en: 'Note', ph: ['Was möchtest du festhalten?', 'What do you want to keep?'] },
  ];
  const cur = adders.find((a) => a.id === kind) as (typeof adders)[number];

  const add = (text: string) => {
    if (kind === 'step') update((c) => ({ ...c, steps: [...(c.steps ?? []), newStep(text)] }));
    else if (kind === 'task') {
      update((c) => {
        const b = c.blocks.find((x) => x.kind === 'tasks');
        if (b && b.kind === 'tasks') return { ...c, blocks: c.blocks.map((x) => (x.id === b.id && x.kind === 'tasks' ? { ...x, items: [...x.items, { id: newId('tsk'), text, status: 'open' as const }] } : x)) };
        return { ...c, blocks: [...c.blocks, { id: newId('blk'), kind: 'tasks' as const, title: L('Aufgaben', 'Tasks'), items: [{ id: newId('tsk'), text, status: 'open' as const }] }] };
      });
    } else update((c) => ({ ...c, log: [...(c.log ?? []), logEntry(kind as LogKind, text)].slice(-LOG_MAX) }));
  };

  const entries = [...(p.log ?? [])].sort((a, b) => b.at.localeCompare(a.at));
  const groups: { day: string; items: typeof entries }[] = [];
  entries.forEach((e) => {
    const day = new Date(e.at).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  });
  const localToday = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <ProjectSubShell api={api} current="protokoll" icon="📖" title={L('Protokoll', 'Log')} color={KIND_COLOR.log}>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{L('Alles bekommt automatisch Datum und Uhrzeit. Vieles trägt sich von selbst ein.', 'Everything gets date and time automatically. Much of it enters itself.')}</p>
      <div className="flex flex-wrap gap-1.5 mb-1" role="group" aria-label={L('Was möchtest du eintragen?', 'What do you want to add?')}>
        {adders.map((a) => (
          <button key={a.id} type="button" onClick={() => setKind(a.id)} aria-pressed={kind === a.id} className="px-3 py-1.5 rounded-full text-[13px] border transition-colors" style={kind === a.id ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' } : { borderColor: 'var(--color-border-strong)', color: 'var(--color-text-muted)' }} data-testid={`log-kind-${a.id}`}>{a.icon} {L(a.de, a.en)}</button>
        ))}
      </div>
      <AddRow placeholder={L(cur.ph[0], cur.ph[1])} onAdd={add} testId="log-add" />
      <div className="mt-5 flex flex-col gap-4" data-testid="log-list">
        {groups.length === 0 && <p className="text-center text-[14px] text-[var(--color-text-faint)] py-6">{L('Noch nichts im Protokoll.', 'Nothing in the log yet.')}</p>}
        {groups.map((g) => (
          <section key={g.day}>
            <h2 className="text-[12.5px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{g.day === localToday ? L('Heute', 'Today') : g.day}</h2>
            <ol className="relative pl-5 border-l-2 flex flex-col gap-2" style={{ borderColor: `${p.color}55` }}>
              {g.items.map((e) => {
                const hasBlock = !!e.blockId && p.blocks.some((b) => b.id === e.blockId);
                return (
                  <li key={e.id} className="relative flex items-start gap-2" data-testid="log-entry">
                    <span className="absolute -left-[27px] top-0.5 w-[14px] h-[14px] rounded-full" style={{ background: p.color }} aria-hidden="true" />
                    <span className="text-[11.5px] tabular-nums text-[var(--color-text-faint)] pt-[3px] w-10 shrink-0">{new Date(e.at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button type="button" disabled={!hasBlock} onClick={() => hasBlock && go(`b/${e.blockId}`)} className="flex-1 min-w-0 text-left text-[14px] leading-snug text-[var(--color-text)] disabled:cursor-default"><span aria-hidden="true">{LOG_ICON[e.kind]} </span>{e.text}</button>
                    <button type="button" onClick={() => update((c) => ({ ...c, log: (c.log ?? []).filter((x) => x.id !== e.id) }))} className="w-7 h-7 shrink-0 flex items-center justify-center text-[var(--color-text-faint)]" aria-label={L('Eintrag entfernen', 'Remove entry')}><X size={13} /></button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </ProjectSubShell>
  );
}
