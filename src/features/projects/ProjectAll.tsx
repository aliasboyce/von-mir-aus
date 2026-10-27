/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { RichText } from '../../components/shared/RichText';
import { LOG_ICON, formatDate, metaOf, milestoneStats, stamp, statusLabel, stepStats, taskStats } from './projectModel';
import { renderBlock } from './blockRender';
import { KIND_COLOR, boxCount } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import { ProjectIcon, type BlockProps } from './ui';
import type { ProjectApi } from './projectApi';

function Bar({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  if (!t) return null;
  return (
    <div className="flex-1 min-w-[40%]">
      <div className="flex justify-between text-[12px] text-[var(--color-text-muted)]"><span>{label}</span><span>{v}/{t}</span></div>
      <div className="h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(v / t) * 100}%`, background: color, transition: 'width 600ms ease' }} /></div>
    </div>
  );
}

/** „Alles zeigen“: das ganze Projekt wie ein Dokument untereinander – aber lebendig, alles darf direkt bearbeitet werden. */
export function ProjectAll({ api }: { api: ProjectApi }) {
  const { p, L, lang, update, setBlock, go } = api;
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ts = taskStats(p);
  const ms = milestoneStats(p);
  const ss = stepStats(p);
  const steps = (p.steps ?? []).filter((s) => !s.done);
  const lastLog = [...(p.log ?? [])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  const bn = boxCount(p.id);
  const allClosed = closed.size > 0 && closed.size >= p.blocks.length;
  return (
    <ProjectSubShell
      api={api}
      current="alles"
      icon="📄"
      title={L('Alles zeigen', 'Show all')}
      color={KIND_COLOR.all}
      right={p.blocks.length > 0 ? <button type="button" onClick={() => setClosed(allClosed ? new Set() : new Set(p.blocks.map((b) => b.id)))} className="text-[12.5px] underline text-[var(--color-text-muted)] shrink-0" data-testid="all-toggle">{allClosed ? L('Alles auf', 'Open all') : L('Alles zu', 'Close all')}</button> : undefined}
    >
      <article className="flex flex-col gap-4" data-testid="project-all">
        <header className="rounded-3xl p-4" style={{ background: `color-mix(in srgb, ${p.color} 14%, var(--color-surface))`, border: `2px solid ${p.color}` }}>
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: `${p.color}26`, border: `2px solid ${p.color}` }} aria-hidden="true"><ProjectIcon p={p} size={30} /></span>
            <div className="min-w-0">
              <p className="text-[22px] leading-tight text-[var(--color-text)] break-words">{p.title || L('Projekt', 'Project')}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)]">{statusLabel(p.status, L)}{p.start ? ` · ${formatDate(p.start, lang, false)}` : ''}{p.end ? ` → ${formatDate(p.end, lang, false)}` : ''}</p>
            </div>
          </div>
          {p.summary.trim() && <p className="text-[14px] text-[var(--color-text)] mt-2 whitespace-pre-line">{p.summary}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            <Bar label={L('Schritte', 'Steps')} v={ss.done} t={ss.total} color={p.color} />
            <Bar label={L('Aufgaben', 'Tasks')} v={ts.done} t={ts.total} color={p.color} />
            <Bar label={L('Meilensteine', 'Milestones')} v={ms.done} t={ms.total} color={p.color} />
          </div>
        </header>

        <section className="rounded-2xl p-3 bg-[var(--color-surface)] border border-[var(--color-border)]" style={{ borderLeft: `5px solid ${KIND_COLOR.steps}` }} data-testid="all-steps">
          <button type="button" onClick={() => go('schritte')} className="flex items-center gap-2 w-full text-left mb-1"><span aria-hidden="true">➡️</span><span className="flex-1 text-[16px]">{L('Nächste Schritte', 'Next steps')}</span><ExternalLink size={14} className="text-[var(--color-text-faint)]" /></button>
          {steps.length === 0 ? <p className="text-[13px] text-[var(--color-text-faint)]">{ss.total ? `🎉 ${L('Alles geschafft', 'All done')}` : L('Noch keine.', 'None yet.')}</p> : (
            <ul className="flex flex-col gap-1">
              {steps.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => update((c) => ({ ...c, steps: (c.steps ?? []).map((x) => (x.id === s.id ? { ...x, done: true, doneAt: new Date().toISOString() } : x)) }))} className="w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-[12px]" style={{ borderColor: KIND_COLOR.steps }} aria-label={L('Geschafft', 'Done')} />
                  <span className="flex-1 min-w-0 text-[14.5px]">{s.text}</span>
                  {s.date && <span className="text-[11.5px] text-[var(--color-text-faint)] shrink-0">📅 {formatDate(s.date, lang, false)} {s.time ?? ''}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {p.blocks.map((b) => {
          const meta = metaOf(b.kind);
          const c = KIND_COLOR[b.kind] ?? p.color;
          const shut = closed.has(b.id);
          const props: BlockProps<any> = { block: b, project: p, L, lang, onChange: setBlock, onProject: update };
          return (
            <section key={b.id} data-block-id={b.id} data-testid={`all-block-${b.kind}`} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]" style={{ borderLeft: `5px solid ${c}` }}>
              <div className="flex items-center gap-1.5 px-3 pt-2.5">
                <button type="button" onClick={() => toggle(b.id)} aria-expanded={!shut} className="flex items-center gap-2 flex-1 min-w-0 text-left py-1">
                  {shut ? <ChevronRight size={17} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={17} className="text-[var(--color-text-muted)]" />}
                  <span aria-hidden="true" className="text-[18px]">{meta.icon}</span>
                  <span className="text-[16.5px] truncate">{b.title || L(meta.de, meta.en)}</span>
                </button>
                <button type="button" onClick={() => go(`b/${b.id}`)} className="w-9 h-9 flex items-center justify-center text-[var(--color-text-faint)]" aria-label={L('Seite öffnen', 'Open page')} data-testid={`all-open-${b.kind}`}><ExternalLink size={15} /></button>
              </div>
              {!shut && (
                <div className="px-3 pb-3 pt-1">
                  {renderBlock(b, props)}
                  {b.note?.trim() && <div className="mt-3 rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-[13px]"><RichText text={b.note} /></div>}
                </div>
              )}
            </section>
          );
        })}

        <section className="rounded-2xl p-3 bg-[var(--color-surface)] border border-[var(--color-border)]" style={{ borderLeft: `5px solid ${KIND_COLOR.log}` }} data-testid="all-log">
          <button type="button" onClick={() => go('protokoll')} className="flex items-center gap-2 w-full text-left mb-1"><span aria-hidden="true">📖</span><span className="flex-1 text-[16px]">{L('Protokoll', 'Log')}</span><ExternalLink size={14} className="text-[var(--color-text-faint)]" /></button>
          {lastLog.length === 0 ? <p className="text-[13px] text-[var(--color-text-faint)]">{L('Noch nichts.', 'Nothing yet.')}</p> : (
            <ul className="flex flex-col gap-1">{lastLog.map((e) => <li key={e.id} className="text-[13.5px]"><span className="text-[11.5px] text-[var(--color-text-faint)] mr-2 tabular-nums">{stamp(e.at, lang)}</span>{LOG_ICON[e.kind]} {e.text}</li>)}</ul>
          )}
        </section>
        <button type="button" onClick={() => go('zettel')} className="rounded-2xl p-3 text-left bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-2" style={{ borderLeft: `5px solid ${KIND_COLOR.box}` }} data-testid="all-box"><span aria-hidden="true">🗒️</span><span className="flex-1 text-[16px]">{L('Zettel-Box', 'Slip box')}</span><span className="text-[13px] text-[var(--color-text-muted)]">{bn ? `${bn} ${L('Zettel', 'slips')}` : L('leer', 'empty')}</span></button>
      </article>
    </ProjectSubShell>
  );
}
