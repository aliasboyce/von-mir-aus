import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { dayKey } from '../calendar/calendarRepo';
import { removeProjectCalendar, syncProjectCalendar } from './projectCalendar';
import {
  BLOCK_META, LOG_MAX, PROJECT_COLORS, PROJECT_EMOJIS, diffLog, logEntry, metaOf, migrateProject, newBlock, projectsRepo, statusLabel,
  type BlockKind, type Project, type ProjectBlock, type ProjectStatus,
} from './projectModel';
import { chipCls, chipOn } from './ui';
import { useL } from './useL';
import { ProjectShareModal } from './ProjectShareModal';
import { ProjectHub } from './ProjectHub';
import { ProjectSteps } from './ProjectSteps';
import { ProjectLog } from './ProjectLog';
import { ProjectBox } from './ProjectBox';
import { ProjectBlockView } from './ProjectBlockView';
import { ProjectAll } from './ProjectAll';
import { QuickNote } from './QuickNote';
import { markProjectWorkedOn } from './projectStore';
import type { ProjectApi } from './projectApi';

/** Ein Projekt als kleine Mini-Website: Startseite mit Kacheln, jede Kachel eine eigene Seite. */
export function ProjectPage() {
  const params = useParams();
  const id = params.id;
  const sub = (params['*'] ?? '').replace(/\/+$/, '');
  const navigate = useNavigate();
  const { L, lang } = useL();
  const [initial] = useState<Project | undefined>(() => {
    const raw = id ? projectsRepo.getById(id) : undefined;
    if (!raw) return undefined;
    const m = migrateProject(raw);
    if (m !== raw) projectsRepo.save(m);
    return m;
  });
  const ref = useRef<Project | undefined>(initial);
  const [p, setP] = useState<Project | undefined>(initial);
  const timer = useRef<number | null>(null);
  const touched = useRef(false);
  const [adding, setAdding] = useState(false);
  const [looks, setLooks] = useState(false);
  const [infos, setInfos] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [quick, setQuick] = useState(false);
  const [toast, setToast] = useState('');
  const [party, setParty] = useState(false);
  const today = dayKey(new Date());

  const flush = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const cur = ref.current;
    if (!cur) return;
    if (!projectsRepo.getById(cur.id)) return; // wurde (z. B. durch „Löschen“) entfernt
    projectsRepo.save(cur);
    syncProjectCalendar(cur, lang);
    if (touched.current) {
      touched.current = false;
      markProjectWorkedOn(cur, lang);
    }
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

  if (!p || !id) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{L('Dieses Projekt gibt es nicht (mehr).', 'This project does not exist (any more).')}</p>
        <button type="button" className="underline text-[var(--color-primary)]" onClick={() => navigate('/entdecken/projekte', { replace: true })}>{L('Zu meinen Projekten', 'To my projects')}</button>
      </div>
    );
  }

  const base = `/entdecken/projekte/${p.id}`;
  const go = (to: string) => navigate(to ? `${base}/${to}` : base);
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600); };

  const update = (fn: (cur: Project) => Project) => {
    const cur = ref.current as Project;
    const changed = fn(cur);
    const entries = diffLog(cur, changed, L);
    const next: Project = { ...changed, updatedAt: new Date().toISOString(), ...(entries.length ? { log: [...(changed.log ?? []), ...entries].slice(-LOG_MAX) } : {}) };
    ref.current = next;
    touched.current = true;
    setP(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 450);
  };
  const setBlock = (b: ProjectBlock) => update((cur) => ({ ...cur, blocks: cur.blocks.map((x) => (x.id === b.id ? b : x)) }));
  const reload = () => {
    const fresh = projectsRepo.getById(p.id);
    if (fresh) { ref.current = fresh; setP(fresh); }
  };

  const api: ProjectApi = {
    p, L, lang, update, setBlock, flush, reload, go, today,
    quickNote: () => { flush(); setQuick(true); },
  };

  const addBlock = (kind: BlockKind) => {
    const m = metaOf(kind);
    const nb = newBlock(kind, L(m.de, m.en));
    update((cur) => ({ ...cur, blocks: [...cur.blocks, nb] }));
    setAdding(false);
    go(`b/${nb.id}`);
  };
  const hasTeam = p.blocks.some((b) => b.kind === 'team');

  const finish = (how: 'keep' | 'archive' | 'delete') => {
    if (how === 'delete') {
      if (!window.confirm(L('Dieses Projekt wirklich löschen? Das lässt sich nicht rückgängig machen.', 'Really delete this project? This cannot be undone.'))) return;
      if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
      removeProjectCalendar(p.id);
      projectsRepo.remove(p.id);
      navigate('/entdecken/projekte', { replace: true });
      return;
    }
    const now = new Date().toISOString();
    update((cur) => ({ ...cur, status: 'done', closedAt: now, ...(how === 'archive' ? { archived: true } : {}), log: [...(cur.log ?? []), logEntry('done', L('Projekt geschafft 🎉', 'Project completed 🎉'))].slice(-LOG_MAX) }));
    flush();
    setFinishing(false);
    setParty(true);
    window.setTimeout(() => setParty(false), 2600);
    if (how === 'archive') window.setTimeout(() => navigate('/entdecken/projekte'), 1800);
  };

  let body;
  if (sub === '') {
    body = (
      <ProjectHub
        api={api}
        onLooks={() => setLooks(true)}
        onInfos={() => setInfos(true)}
        onShare={() => { flush(); setSharing(true); }}
        onFinish={() => setFinishing(true)}
        onAddBlock={() => setAdding(true)}
        onCreate={(kind) => {
          const m = metaOf(kind);
          const nb = newBlock(kind, kind === 'team' ? L('Beteiligte', 'People involved') : L(m.de, m.en));
          update((cur) => ({ ...cur, blocks: [...cur.blocks, nb] }));
          go(`b/${nb.id}`);
        }}
      />
    );
  } else if (sub === 'schritte') body = <ProjectSteps api={api} />;
  else if (sub === 'protokoll') body = <ProjectLog api={api} />;
  else if (sub === 'zettel') body = <ProjectBox api={api} />;
  else if (sub === 'alles') body = <ProjectAll api={api} />;
  else if (sub.startsWith('b/')) body = <ProjectBlockView api={api} blockId={sub.slice(2)} />;
  else body = <div className="px-5 pt-8 text-center"><button type="button" className="underline text-[var(--color-primary)]" onClick={() => go('')}>{L('Zur Projekt-Startseite', 'To the project home')}</button></div>;

  const statuses: ProjectStatus[] = ['idea', 'running', 'resting', 'done'];

  return (
    <div className="animate-in" data-testid="project-page">
      <TopBar onBack={() => { flush(); if (sub) go(''); else navigate('/entdecken/projekte'); }} action={<HelpButton helpKey="projekte" />} />
      {body}

      {toast && <div className="fixed left-1/2 -translate-x-1/2 bottom-40 z-40 rounded-full px-4 py-2 text-[13.5px] text-white shadow-lg pointer-events-none" style={{ background: 'var(--color-text)' }} role="status" data-testid="project-toast">{toast}</div>}
      {party && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center" aria-hidden="true" data-testid="project-party">
          {['🎉', '✨', '🌟', '🎊', '✨', '🌿', '💫'].map((e, i) => <span key={i} className="absolute text-[34px]" style={{ left: `${14 + i * 12}%`, top: `${48 + (i % 3) * 6}%`, animation: `proj-spark 2.2s ease-out ${i * 120}ms both` }}>{e}</span>)}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={L('Seite hinzufügen', 'Add a page')} subtitle={L('Was braucht dein Projekt gerade?', 'What does your project need right now?')}>
        <div className="flex flex-col gap-2" data-testid="project-block-picker">
          {BLOCK_META.filter((m) => !(m.kind === 'team' && hasTeam)).map((m) => (
            <button key={m.kind} type="button" onClick={() => addBlock(m.kind)} className="flex items-start gap-3 text-left rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5" data-testid={`add-block-${m.kind}`}>
              <span className="text-[20px]" aria-hidden="true">{m.icon}</span>
              <span><span className="block text-[14.5px] text-[var(--color-text)]">{L(m.de, m.en)}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L(m.subDe, m.subEn)}</span></span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={looks} onClose={() => setLooks(false)} title={L('Symbol und Farbe', 'Symbol and colour')}>
        <div className="flex flex-col gap-4" data-testid="project-looks-sheet">
          <div className="flex flex-wrap gap-2">{PROJECT_EMOJIS.map((e) => <button key={e} type="button" onClick={() => update((c) => ({ ...c, emoji: e }))} aria-pressed={p.emoji === e} className="w-11 h-11 rounded-xl text-[24px] border" style={{ borderColor: p.emoji === e ? p.color : 'var(--color-border)', background: p.emoji === e ? `${p.color}22` : 'transparent' }}>{e}</button>)}</div>
          <div className="flex flex-wrap gap-2">{PROJECT_COLORS.map((c) => <button key={c} type="button" onClick={() => update((cur) => ({ ...cur, color: c }))} aria-label={c} className="w-9 h-9 rounded-full" style={{ background: c, outline: p.color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} />)}</div>
          <Button fullWidth onClick={() => setLooks(false)}>{L('Fertig', 'Done')}</Button>
        </div>
      </Modal>

      <Modal open={infos} onClose={() => setInfos(false)} title={L('Projekt-Infos', 'Project info')}>
        <div className="flex flex-col gap-3" data-testid="project-infos-sheet">
          <label className="block">
            <span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Worum geht es? Was wollen wir machen – und warum?', 'What is it about? What do we want to do – and why?')}</span>
            <textarea className="input" rows={3} value={p.summary} onChange={(e) => update((c) => ({ ...c, summary: e.target.value }))} data-testid="project-summary" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => <button key={s} type="button" onClick={() => update((c) => ({ ...c, status: s, ...(s === 'done' ? { closedAt: new Date().toISOString() } : { closedAt: undefined }) }))} aria-pressed={p.status === s} className={chipCls(p.status === s)} style={p.status === s ? chipOn : undefined} data-testid={`project-status-${s}`}>{statusLabel(s, L)}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Start', 'Start')}</span><input type="date" className="input" value={p.start ?? ''} onChange={(e) => update((c) => ({ ...c, start: e.target.value || undefined }))} data-testid="project-start" /></label>
            <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Ziel-Datum (optional)', 'Target date (optional)')}</span><input type="date" className="input" value={p.end ?? ''} onChange={(e) => update((c) => ({ ...c, end: e.target.value || undefined }))} data-testid="project-end" /></label>
          </div>
          <Button fullWidth onClick={() => setInfos(false)}>{L('Fertig', 'Done')}</Button>
        </div>
      </Modal>

      <Modal open={finishing} onClose={() => setFinishing(false)} title={L('Projekt abschließen', 'Complete project')} subtitle={L('Was darf damit passieren?', 'What may happen to it?')}>
        <div className="flex flex-col gap-2" data-testid="project-finish-sheet">
          <button type="button" onClick={() => finish('keep')} className="rounded-xl border-2 px-4 py-3 text-left" style={{ borderColor: p.color }} data-testid="finish-keep"><span className="block text-[15px]">🎉 {L('Geschafft – und gespeichert lassen', 'Done – and keep it saved')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Bleibt in deiner Liste, mit allem Drin. Termine im Kalender enden.', 'Stays in your list with everything in it. Calendar dates end.')}</span></button>
          <button type="button" onClick={() => finish('archive')} className="rounded-xl border border-[var(--color-border-strong)] px-4 py-3 text-left flex items-center gap-2" data-testid="finish-archive"><Archive size={16} /><span><span className="block text-[15px]">{L('Geschafft – ins Archiv legen', 'Done – move to the archive')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Aufgeräumt, aber nichts ist weg.', 'Tidied away, but nothing is gone.')}</span></span></button>
          <button type="button" onClick={() => finish('delete')} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-left flex items-center gap-2 text-[var(--color-danger)]" data-testid="finish-delete"><Trash2 size={16} /><span className="text-[15px]">{L('Löschen', 'Delete')}</span></button>
        </div>
      </Modal>

      {quick && <QuickNote project={p} L={L} lang={lang} onClose={() => setQuick(false)} onSaved={(m) => { setQuick(false); reload(); say(m); }} />}
      {sharing && <ProjectShareModal project={p} onClose={() => setSharing(false)} today={today} />}
    </div>
  );
}
