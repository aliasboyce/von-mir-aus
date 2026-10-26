import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Ellipsis, FileDown, Plus, StickyNote, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { RichTextEditor } from '../../components/shared/RichTextEditor';
import { RichText } from '../../components/shared/RichText';
import { hasFormatting } from '../../services/richText';
import { dayKey } from '../calendar/calendarRepo';
import { syncProjectCalendar } from './projectCalendar';
import {
  BLOCK_META, PROJECT_COLORS, PROJECT_EMOJIS, metaOf, milestoneStats, newBlock, projectsRepo, statusLabel, taskStats,
  type BlockKind, type Project, type ProjectBlock, type ProjectStatus,
} from './projectModel';
import { chipCls, chipOn, type BlockProps } from './ui';
import { useL } from './useL';
import { BlockText } from './blocks/BlockText';
import { BlockChecklist, BlockTasks } from './blocks/BlockTasks';
import { BlockTimeline } from './blocks/BlockTimeline';
import { BlockTeam } from './blocks/BlockTeam';
import { BlockBudget } from './blocks/BlockBudget';
import { BlockDecisions, BlockImages, BlockProsCons, BlockReminders, BlockRisks, BlockTable } from './blocks/BlockLists';
import { BlockPoll } from './blocks/BlockPoll';
import { BlockLinks } from './blocks/BlockLinks';
import { ProjectShareModal } from './ProjectShareModal';

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderBlock(b: ProjectBlock, props: BlockProps<any>) {
  switch (b.kind) {
    case 'text': return <BlockText {...props} />;
    case 'tasks': return <BlockTasks {...props} />;
    case 'checklist': return <BlockChecklist {...props} />;
    case 'timeline': return <BlockTimeline {...props} />;
    case 'team': return <BlockTeam {...props} />;
    case 'budget': return <BlockBudget {...props} />;
    case 'risks': return <BlockRisks {...props} />;
    case 'decisions': return <BlockDecisions {...props} />;
    case 'poll': return <BlockPoll {...props} />;
    case 'proscons': return <BlockProsCons {...props} />;
    case 'table': return <BlockTable {...props} />;
    case 'links': return <BlockLinks {...props} />;
    case 'reminders': return <BlockReminders {...props} />;
    case 'images': return <BlockImages {...props} />;
  }
}

export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { L, lang } = useL();
  const initial = id ? projectsRepo.getById(id) : undefined;
  const ref = useRef<Project | undefined>(initial);
  const [p, setP] = useState<Project | undefined>(initial);
  const timer = useRef<number | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState<Set<string>>(() => new Set((initial?.blocks ?? []).filter((b) => b.note?.trim()).map((b) => b.id)));
  const [adding, setAdding] = useState(false);
  const [looks, setLooks] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const cur = ref.current;
    if (!cur) return;
    projectsRepo.save(cur);
    syncProjectCalendar(cur, lang);
  }, [lang]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  useEffect(() => {
    if (!scrollTo) return;
    document.querySelector(`[data-block-id="${scrollTo}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollTo(null);
  }, [scrollTo, p]);

  if (!p) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{L('Dieses Projekt gibt es nicht (mehr).', 'This project does not exist (any more).')}</p>
        <button type="button" className="underline text-[var(--color-primary)]" onClick={() => navigate('/entdecken/projekte', { replace: true })}>{L('Zu meinen Projekten', 'To my projects')}</button>
      </div>
    );
  }

  const update = (fn: (cur: Project) => Project) => {
    const cur = ref.current as Project;
    const next = { ...fn(cur), updatedAt: new Date().toISOString() };
    ref.current = next;
    setP(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 450);
  };
  const setBlock = (b: ProjectBlock) => update((cur) => ({ ...cur, blocks: cur.blocks.map((x) => (x.id === b.id ? b : x)) }));
  const move = (bid: string, dir: -1 | 1) => update((cur) => {
    const i = cur.blocks.findIndex((x) => x.id === bid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.blocks.length) return cur;
    const blocks = [...cur.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...cur, blocks };
  });
  const removeBlock = (b: ProjectBlock) => {
    const filled = JSON.stringify(b).length > 260;
    if (filled && !window.confirm(L(`„${b.title}“ samt Inhalt entfernen?`, `Remove "${b.title}" with its content?`))) return;
    update((cur) => ({ ...cur, blocks: cur.blocks.filter((x) => x.id !== b.id) }));
    setMenuFor(null);
  };
  const addBlock = (kind: BlockKind) => {
    const m = metaOf(kind);
    const nb = newBlock(kind, L(m.de, m.en));
    update((cur) => ({ ...cur, blocks: [...cur.blocks, nb] }));
    setAdding(false);
    setScrollTo(nb.id);
  };
  const ts = taskStats(p);
  const ms = milestoneStats(p);
  const hasTeam = p.blocks.some((b) => b.kind === 'team');
  const statuses: ProjectStatus[] = ['idea', 'running', 'resting', 'done'];

  return (
    <div className="animate-in">
      <TopBar onBack={() => { flush(); navigate('/entdecken/projekte'); }} action={<HelpButton helpKey="projekte" />} />
      <div className="px-5 pb-10" data-testid="project-page">
        <div className="flex items-start gap-3 mb-2">
          <button type="button" onClick={() => setLooks(true)} className="w-14 h-14 shrink-0 rounded-2xl text-[28px] flex items-center justify-center" style={{ background: `${p.color}26`, border: `2px solid ${p.color}` }} aria-label={L('Symbol und Farbe ändern', 'Change symbol and colour')} data-testid="project-looks">{p.emoji}</button>
          <input className="flex-1 min-w-0 bg-transparent outline-none text-[24px] leading-tight pt-2" value={p.title} placeholder={L('Name des Projekts', 'Project name')} onChange={(e) => update((c) => ({ ...c, title: e.target.value }))} data-testid="project-title" />
        </div>
        <textarea className="input mb-2" rows={2} value={p.summary} placeholder={L('Worum geht es? Was wollen wir machen – und warum?', 'What is it about? What do we want to do – and why?')} onChange={(e) => update((c) => ({ ...c, summary: e.target.value }))} data-testid="project-summary" />
        <div className="flex flex-wrap gap-1.5 mb-3">
          {statuses.map((s) => <button key={s} type="button" onClick={() => update((c) => ({ ...c, status: s }))} aria-pressed={p.status === s} className={chipCls(p.status === s)} style={p.status === s ? chipOn : undefined} data-testid={`project-status-${s}`}>{statusLabel(s, L)}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Start', 'Start')}</span><input type="date" className="input" value={p.start ?? ''} onChange={(e) => update((c) => ({ ...c, start: e.target.value || undefined }))} data-testid="project-start" /></label>
          <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Ziel-Datum (optional)', 'Target date (optional)')}</span><input type="date" className="input" value={p.end ?? ''} onChange={(e) => update((c) => ({ ...c, end: e.target.value || undefined }))} data-testid="project-end" /></label>
        </div>
        <label className="block mb-3">
          <span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Der kleinste nächste Schritt', 'The smallest next step')}</span>
          <input className="input" value={p.nextStep ?? ''} placeholder={L('Was wäre jetzt ein winziger Schritt?', 'What would be a tiny step now?')} onChange={(e) => update((c) => ({ ...c, nextStep: e.target.value }))} data-testid="project-nextstep" />
        </label>

        {(ts.total > 0 || ms.total > 0) && (
          <div className="mb-4 text-[12.5px] text-[var(--color-text-muted)]" data-testid="project-progress">
            {ts.total > 0 && (
              <div className="mb-1.5">
                <div className="flex justify-between"><span>{L('Aufgaben', 'Tasks')}</span><span>{ts.done}/{ts.total}</span></div>
                <div className="h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden"><div className="h-full" style={{ width: `${(ts.done / ts.total) * 100}%`, background: p.color }} /></div>
              </div>
            )}
            {ms.total > 0 && (
              <div>
                <div className="flex justify-between"><span>{L('Meilensteine', 'Milestones')}</span><span>{ms.done}/{ms.total}</span></div>
                <div className="h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden"><div className="h-full" style={{ width: `${(ms.done / ms.total) * 100}%`, background: p.color }} /></div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => { flush(); setSharing(true); }} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="project-share"><FileDown size={16} />{L('Teilen / PDF', 'Share / PDF')}</button>
        </div>

        <div className="flex flex-col gap-4" data-testid="project-blocks">
          {p.blocks.length === 0 && <p className="text-[14px] text-[var(--color-text-muted)] text-center py-4">{L('Noch leer. Füge einen Baustein hinzu – mehr braucht es nicht.', 'Still empty. Add a block – that is all it takes.')}</p>}
          {p.blocks.map((b, i) => {
            const meta = metaOf(b.kind);
            const props: BlockProps<any> = { block: b, project: p, L, lang, onChange: setBlock, onProject: update };
            const noteShown = noteOpen.has(b.id);
            return (
              <section key={b.id} data-block-id={b.id} data-testid={`block-${b.kind}`} className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]" style={{ borderTop: `4px solid ${p.color}` }}>
                <div className="flex items-center gap-1.5 px-3 pt-2.5">
                  <span aria-hidden="true" className="text-[18px]">{meta.icon}</span>
                  <input className="flex-1 min-w-0 bg-transparent outline-none text-[16.5px] py-1" value={b.title} onChange={(e) => setBlock({ ...b, title: e.target.value })} aria-label={L('Titel des Bausteins', 'Block title')} data-testid={`block-title-${i}`} />
                  <button type="button" onClick={() => setBlock({ ...b, collapsed: !b.collapsed })} aria-expanded={!b.collapsed} aria-label={b.collapsed ? L('Aufklappen', 'Expand') : L('Zuklappen', 'Collapse')} className="w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`block-collapse-${i}`}>{b.collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}</button>
                  <button type="button" onClick={() => setMenuFor(b.id)} aria-label={L('Mehr', 'More')} className="w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`block-menu-${i}`}><Ellipsis size={18} /></button>
                </div>
                {!b.collapsed && (
                  <div className="px-3 pb-3 pt-1">
                    {renderBlock(b, props)}
                    <div className="mt-3">
                      {!noteShown && !b.note?.trim() ? (
                        <button type="button" onClick={() => setNoteOpen((s) => new Set(s).add(b.id))} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]" data-testid={`block-note-open-${i}`}><StickyNote size={14} />{L('Notiz dazu', 'Add a note')}</button>
                      ) : (
                        <div data-testid={`block-note-${i}`}>
                          <span className="block text-[12px] text-[var(--color-text-muted)] mb-1">{L('Notiz', 'Note')}</span>
                          <RichTextEditor value={b.note ?? ''} onChange={(note) => setBlock({ ...b, note })} placeholder={L('Eigene Gedanken dazu …', 'Your own thoughts on this …')} minRows={2} testId={`block-note-editor-${i}`} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {b.collapsed && b.note?.trim() && hasFormatting(b.note) === false && <p className="px-4 pb-3 text-[12.5px] text-[var(--color-text-faint)] truncate">{b.note}</p>}
                {b.collapsed && b.note?.trim() && hasFormatting(b.note) && <div className="px-4 pb-3 text-[12.5px] text-[var(--color-text-faint)]"><RichText text={b.note} maxLines={2} /></div>}
              </section>
            );
          })}
        </div>

        <button type="button" onClick={() => setAdding(true)} className="w-full mt-5 flex items-center justify-center gap-2 rounded-full py-3 text-[15px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="project-add-block"><Plus size={18} />{L('Baustein hinzufügen', 'Add a block')}</button>
        <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-2">{L('Alles ist freiwillig. Dein Projekt darf klein bleiben.', 'Everything is optional. Your project may stay small.')}</p>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title={L('Baustein hinzufügen', 'Add a block')} subtitle={L('Was braucht dein Projekt gerade?', 'What does your project need right now?')}>
        <div className="flex flex-col gap-2" data-testid="project-block-picker">
          {BLOCK_META.filter((m) => !(m.kind === 'team' && hasTeam)).map((m) => (
            <button key={m.kind} type="button" onClick={() => addBlock(m.kind)} className="flex items-start gap-3 text-left rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5" data-testid={`add-block-${m.kind}`}>
              <span className="text-[20px]" aria-hidden="true">{m.icon}</span>
              <span><span className="block text-[14.5px] text-[var(--color-text)]">{L(m.de, m.en)}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L(m.subDe, m.subEn)}</span></span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!menuFor} onClose={() => setMenuFor(null)} title={L('Baustein', 'Block')} subtitle={p.blocks.find((b) => b.id === menuFor)?.title}>
        {menuFor && (() => {
          const b = p.blocks.find((x) => x.id === menuFor);
          if (!b) return null;
          const idx = p.blocks.indexOf(b);
          return (
            <div className="flex flex-col gap-2" data-testid="block-menu-sheet">
              <button type="button" disabled={idx === 0} onClick={() => move(b.id, -1)} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] disabled:opacity-40" data-testid="block-up"><ArrowUp size={16} />{L('Nach oben', 'Move up')}</button>
              <button type="button" disabled={idx === p.blocks.length - 1} onClick={() => move(b.id, 1)} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] disabled:opacity-40" data-testid="block-down"><ArrowDown size={16} />{L('Nach unten', 'Move down')}</button>
              <button type="button" onClick={() => removeBlock(b)} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] text-[var(--color-danger)]" data-testid="block-remove"><Trash2 size={16} />{L('Baustein entfernen', 'Remove block')}</button>
            </div>
          );
        })()}
      </Modal>

      <Modal open={looks} onClose={() => setLooks(false)} title={L('Symbol und Farbe', 'Symbol and colour')}>
        <div className="flex flex-col gap-4" data-testid="project-looks-sheet">
          <div className="flex flex-wrap gap-2">{PROJECT_EMOJIS.map((e) => <button key={e} type="button" onClick={() => update((c) => ({ ...c, emoji: e }))} aria-pressed={p.emoji === e} className="w-11 h-11 rounded-xl text-[24px] border" style={{ borderColor: p.emoji === e ? p.color : 'var(--color-border)', background: p.emoji === e ? `${p.color}22` : 'transparent' }}>{e}</button>)}</div>
          <div className="flex flex-wrap gap-2">{PROJECT_COLORS.map((c) => <button key={c} type="button" onClick={() => update((cur) => ({ ...cur, color: c }))} aria-label={c} className="w-9 h-9 rounded-full" style={{ background: c, outline: p.color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} />)}</div>
          <Button fullWidth onClick={() => setLooks(false)}>{L('Fertig', 'Done')}</Button>
        </div>
      </Modal>

      {sharing && <ProjectShareModal project={p} onClose={() => setSharing(false)} today={dayKey(new Date())} />}
    </div>
  );
}
