import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ChevronDown, ChevronRight, Ellipsis, Folder, FolderPlus, Plus, RotateCcw } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { createId } from '../../services/storage/repository';
import { NameModal } from '../mindmap/MindmapTools';
import { dayKey } from '../calendar/calendarRepo';
import { removeProjectCalendar, syncProjectCalendar } from './projectCalendar';
import { formatDate, milestoneStats, statusLabel, nextDate, newProject, projectFoldersStore, projectsRepo, taskStats, type Project } from './projectModel';
import { templateBlocks, type TemplateId } from './projectTemplates';
import { useL } from './useL';

const byNewest = (a: Project, b: Project) => b.updatedAt.localeCompare(a.updatedAt);

export function ProjectsPage() {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const [items, setItems] = useState<Project[]>(() => projectsRepo.getAll());
  const [folders, setFolders] = useState<string[]>(() => projectFoldersStore.get());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<string | null>(null);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [moveNew, setMoveNew] = useState('');
  const [toast, setToast] = useState('');

  const reload = () => {
    setItems(projectsRepo.getAll());
    setFolders(projectFoldersStore.get());
  };
  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? '' : t)), 2400);
  };
  const today = dayKey(new Date());
  const live = useMemo(() => items.filter((p) => !p.archived).sort(byNewest), [items]);
  const archived = useMemo(() => items.filter((p) => p.archived).sort(byNewest), [items]);
  const folderNames = useMemo(() => [...new Set([...folders, ...live.map((p) => p.folder).filter(Boolean) as string[]])].sort((a, b) => a.localeCompare(b)), [folders, live]);
  const loose = live.filter((p) => !p.folder);
  const get = (id: string | null) => items.find((p) => p.id === id);

  function create(template: TemplateId) {
    const p = newProject(name.trim() || L('Mein Projekt', 'My project'), lang);
    p.blocks = templateBlocks(template, lang);
    projectsRepo.save(p);
    navigate(`/entdecken/projekte/${p.id}`);
  }
  function save(p: Project) {
    projectsRepo.save({ ...p, updatedAt: new Date().toISOString() });
  }
  function moveTo(p: Project, folder?: string) {
    save({ ...p, folder: folder || undefined });
    if (folder && !projectFoldersStore.get().includes(folder)) projectFoldersStore.set([...projectFoldersStore.get(), folder]);
    setMoveFor(null);
    setActionFor(null);
    setMoveNew('');
    reload();
    say(L('Verschoben.', 'Moved.'));
  }
  function archive(p: Project) {
    const next = { ...p, archived: true };
    save(next);
    syncProjectCalendar(next, lang);
    setActionFor(null);
    reload();
    say(L('Ins Archiv gelegt. Nichts ist weg.', 'Moved to the archive. Nothing is gone.'));
  }
  function restore(p: Project) {
    const next = { ...p, archived: undefined };
    save(next);
    syncProjectCalendar(next, lang);
    reload();
  }
  function duplicate(p: Project) {
    const now = new Date().toISOString();
    projectsRepo.save({ ...p, id: createId('prj'), title: `${p.title} (2)`, createdAt: now, updatedAt: now });
    setActionFor(null);
    reload();
  }
  function remove(p: Project) {
    if (!window.confirm(L('Dieses Projekt wirklich löschen? Das lässt sich nicht rückgängig machen. (Alternative: ins Archiv legen.)', 'Really delete this project? This cannot be undone. (Alternative: move it to the archive.)'))) return;
    removeProjectCalendar(p.id);
    projectsRepo.remove(p.id);
    setActionFor(null);
    reload();
  }
  function addFolder(n: string) {
    const f = n.trim();
    if (!f) return;
    if (!folderNames.includes(f)) projectFoldersStore.set([...projectFoldersStore.get(), f]);
    setNewFolderOpen(false);
    reload();
  }
  function renameFolderTo(from: string, to: string) {
    if (!to || to === from) {
      setRenameFolder(null);
      return;
    }
    items.filter((p) => p.folder === from).forEach((p) => projectsRepo.save({ ...p, folder: to }));
    projectFoldersStore.set([...new Set(projectFoldersStore.get().map((f) => (f === from ? to : f)))]);
    setRenameFolder(null);
    reload();
  }
  function deleteFolder(f: string) {
    if (!window.confirm(L(`Ordner „${f}“ löschen? Die Projekte darin bleiben erhalten und liegen danach lose in der Liste.`, `Delete folder "${f}"? The projects in it stay and then sit loose in the list.`))) return;
    items.filter((p) => p.folder === f).forEach((p) => projectsRepo.save({ ...p, folder: undefined }));
    projectFoldersStore.set(projectFoldersStore.get().filter((x) => x !== f));
    setRenameFolder(null);
    reload();
  }

  const templates: [TemplateId, string, string][] = [
    ['empty', L('Leer anfangen', 'Start empty'), L('Nur ein Feld für die Ziele. Alles andere fügst du nach Bedarf hinzu.', 'Just a field for the goals. You add everything else as needed.')],
    ['solo', L('Für mich allein', 'Just for me'), L('Ziele, Aufgaben, Zeitplan, Notizen. Klein und ruhig.', 'Goals, tasks, timeline, notes. Small and calm.')],
    ['together', L('Mit Freunden und Helfern', 'With friends and helpers'), L('Team & Rollen, Aufgaben, Zeitplan, Budget, Absprachen, Risiken, offene Fragen.', 'Team & roles, tasks, timeline, budget, agreements, risks, open questions.')],
    ['full', L('Das ganze Heft', 'The whole notebook'), L('Alle Kapitel eines Projekt-Hefts von der Idee bis zu den Anhängen.', 'All chapters of a project notebook, from the idea to the attachments.')],
  ];

  const card = (p: Project) => {
    const ts = taskStats(p);
    const ms = milestoneStats(p);
    const nd = nextDate(p, today);
    return (
      <li key={p.id} className="flex items-stretch gap-1" data-testid={`project-row-${p.id}`}>
        <div className="flex-1 min-w-0 flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] pr-1 overflow-hidden" style={{ borderLeft: `5px solid ${p.color}` }}>
          <button type="button" onClick={() => navigate(`/entdecken/projekte/${p.id}`)} className="flex-1 min-w-0 flex items-center gap-3 text-left py-3 pl-3" data-testid={`project-card-${p.id}`}>
            <span className="text-[26px] shrink-0" aria-hidden="true">{p.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] text-[var(--color-text)] truncate">{p.title}</span>
              <span className="block text-[12px] text-[var(--color-text-faint)]">
                {statusLabel(p.status, L)}
                {ts.total > 0 && ` · ${ts.done}/${ts.total} ${L('erledigt', 'done')}`}
                {ms.total > 0 && ` · ${ms.done}/${ms.total} ${L('Meilensteine', 'milestones')}`}
              </span>
              {p.nextStep && <span className="block text-[12.5px] text-[var(--color-text-muted)] truncate">→ {p.nextStep}</span>}
              {nd && <span className="block text-[12px] text-[var(--color-primary)] truncate">{formatDate(nd.date, lang, false)} · {nd.label}</span>}
            </span>
          </button>
          <button type="button" onClick={() => setActionFor(p.id)} aria-label={L('Mehr', 'More')} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] shrink-0" data-testid={`project-actions-${p.id}`}>
            <Ellipsis size={18} />
          </button>
        </div>
      </li>
    );
  };

  const act = get(actionFor);
  const mv = get(moveFor);

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="projekte" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1" data-testid="projects-title">{L('Meine Projekte', 'My projects')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4" data-hint>
          {L('Vorhaben in deinem Tempo planen – allein oder mit Freunden und Helfern. Du fügst nur hinzu, was du brauchst.', 'Plan things at your own pace – alone or with friends and helpers. You only add what you need.')}
        </p>
        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => setCreating(true)} className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-[15px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="project-new">
            <Plus size={18} /> {L('Neues Projekt', 'New project')}
          </button>
          <button type="button" onClick={() => setNewFolderOpen(true)} className="flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="project-folder-new">
            <FolderPlus size={17} /> {L('Ordner', 'Folder')}
          </button>
        </div>

        {live.length === 0 && folderNames.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)] text-center py-8" data-testid="projects-empty">
            {L('Noch kein Projekt. Fang klein an – ein Name reicht.', 'No project yet. Start small – a name is enough.')}
          </p>
        ) : (
          <div className="flex flex-col gap-4" data-testid="projects-list">
            {loose.length > 0 && <ul className="flex flex-col gap-2.5">{loose.map(card)}</ul>}
            {folderNames.map((f) => {
              const inside = live.filter((p) => p.folder === f);
              const open = !closed.has(f);
              return (
                <section key={f} data-testid={`project-folder-${f}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <button type="button" onClick={() => setClosed((s) => { const n = new Set(s); if (n.has(f)) n.delete(f); else n.add(f); return n; })} aria-expanded={open} className="flex-1 flex items-center gap-2 text-left py-1.5 text-[14.5px] text-[var(--color-text)]" data-testid={`project-folder-toggle-${f}`}>
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <Folder size={16} className="text-[var(--color-primary)]" />
                      <span className="truncate">{f}</span>
                      <span className="text-[12px] text-[var(--color-text-faint)]">({inside.length})</span>
                    </button>
                    <button type="button" onClick={() => setRenameFolder(f)} className="text-[12.5px] px-2 py-1 text-[var(--color-text-muted)] underline underline-offset-2" data-testid={`project-folder-edit-${f}`}>{L('Ändern', 'Edit')}</button>
                  </div>
                  {open && (inside.length === 0 ? <p className="text-[13px] text-[var(--color-text-faint)] pl-6">{L('Noch leer. Über „…“ bei einem Projekt kannst du es hierher verschieben.', 'Still empty. Use "…" on a project to move it here.')}</p> : <ul className="flex flex-col gap-2.5">{inside.map(card)}</ul>)}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <button type="button" onClick={() => setArchiveOpen((v) => !v)} aria-expanded={archiveOpen} className="w-full flex items-center gap-2 py-2.5 text-[14px] text-[var(--color-text-muted)]" data-testid="project-archive-toggle">
            {archiveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Archive size={16} /> {L('Archiv', 'Archive')} ({archived.length})
          </button>
          {archiveOpen && (
            <div className="flex flex-col gap-2 mt-1" data-testid="project-archive">
              {archived.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Hier liegt nichts.', 'Nothing here.')}</p>}
              {archived.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] pr-2 overflow-hidden">
                  <button type="button" onClick={() => navigate(`/entdecken/projekte/${p.id}`)} className="flex-1 min-w-0 text-left px-4 py-3 text-[14.5px] truncate">{p.emoji} {p.title}</button>
                  <button type="button" onClick={() => restore(p)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] border border-[var(--color-border-strong)] shrink-0" data-testid={`project-restore-${p.id}`}>
                    <RotateCcw size={13} /> {L('Zurückholen', 'Restore')}
                  </button>
                  <button type="button" onClick={() => remove(p)} className="text-[12.5px] px-2 py-1 text-[var(--color-danger)] shrink-0">{L('Löschen', 'Delete')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && <p className="fixed left-1/2 -translate-x-1/2 bottom-24 text-[13px] px-4 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] shadow-[var(--shadow-md)] z-[120]" role="status">{toast}</p>}

      <Modal open={creating} onClose={() => setCreating(false)} title={L('Neues Projekt', 'New project')} subtitle={L('Wie möchtest du anfangen?', 'How would you like to start?')}>
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Name', 'Name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L('z. B. Geburtstagsfeier, Umzug, Kurzfilm', 'e.g. birthday party, moving, short film')} className="input" data-testid="project-new-name" />
          </label>
          {templates.map(([tid, title, sub]) => (
            <button key={tid} type="button" onClick={() => create(tid)} className="text-left rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] px-4 py-3" data-testid={`project-template-${tid}`}>
              <p className="text-[15px] text-[var(--color-text)]">{title}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)]">{sub}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!act && !moveFor} onClose={() => setActionFor(null)} title={act?.title || ''} subtitle={L('Was möchtest du tun?', 'What would you like to do?')}>
        {act && (
          <div className="flex flex-col gap-2" data-testid="project-action-sheet">
            {([
              ['open', L('Öffnen', 'Open'), () => navigate(`/entdecken/projekte/${act.id}`)],
              ['move', L('In einen Ordner', 'Into a folder'), () => setMoveFor(act.id)],
              ['dup', L('Duplizieren', 'Duplicate'), () => duplicate(act)],
              ['archive', L('Ins Archiv', 'To the archive'), () => archive(act)],
              ['delete', L('Löschen', 'Delete'), () => remove(act)],
            ] as [string, string, () => void][]).map(([k, label, run]) => (
              <button key={k} type="button" onClick={run} className={`text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] ${k === 'delete' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`} data-testid={`project-act-${k}`}>{label}</button>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!mv} onClose={() => setMoveFor(null)} title={L('In einen Ordner', 'Into a folder')} subtitle={mv?.title}>
        {mv && (
          <div className="flex flex-col gap-3" data-testid="project-move-sheet">
            <button type="button" onClick={() => moveTo(mv)} className="text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px]" data-testid="project-move-top">{L('Lose in die Liste (kein Ordner)', 'Loose in the list (no folder)')}</button>
            {folderNames.map((f) => (
              <button key={f} type="button" onClick={() => moveTo(mv, f)} className="text-left rounded-[var(--radius-md)] px-4 py-2.5 border border-[var(--color-border-strong)] text-[14.5px] flex items-center gap-2" data-testid={`project-move-folder-${f}`}>
                <Folder size={15} className="text-[var(--color-primary)]" /> {f}
              </button>
            ))}
            <div>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Neuer Ordner', 'New folder')}</p>
              <div className="flex gap-2">
                <input value={moveNew} onChange={(e) => setMoveNew(e.target.value)} placeholder={L('Name des Ordners', 'Folder name')} className="input flex-1 min-w-0" data-testid="project-move-newfolder" />
                <button type="button" disabled={!moveNew.trim()} onClick={() => moveTo(mv, moveNew.trim())} className="px-4 rounded-full text-[14px] text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="project-move-newfolder-go">{L('Anlegen', 'Create')}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {newFolderOpen && <NameModal open onClose={() => setNewFolderOpen(false)} title={L('Neuer Ordner', 'New folder')} label={L('Name des Ordners', 'Folder name')} initial="" cta={L('Anlegen', 'Create')} onSubmit={addFolder} testId="project-newfolder" />}
      {renameFolder && (
        <NameModal key={renameFolder} open onClose={() => setRenameFolder(null)} title={L('Ordner ändern', 'Edit folder')} label={L('Name des Ordners', 'Folder name')} initial={renameFolder} cta={L('Speichern', 'Save')} onSubmit={(n) => renameFolderTo(renameFolder, n)} testId="project-folder-rename">
          <button type="button" onClick={() => deleteFolder(renameFolder)} className="text-left text-[13.5px] text-[var(--color-danger)] py-1" data-testid="project-folder-delete">{L('Ordner löschen (Projekte bleiben)', 'Delete folder (projects stay)')}</button>
        </NameModal>
      )}
    </div>
  );
}
