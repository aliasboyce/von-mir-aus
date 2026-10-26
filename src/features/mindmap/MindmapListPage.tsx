import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Box, ChevronDown, ChevronRight, Ellipsis, Folder, FolderKanban, FolderPlus, FolderTree, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { PasteSharedButton } from '../../components/shared/PasteSharedModal';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { emptySpace } from '../mindmap3d/space3dModel';
import { MindmapDrawing } from './MindmapScene';
import { mindmapRepo, newMap, type MindMap, type Template } from './mindmapModel';
import { descendantsOf } from './mindmapOps';
import { NameModal } from './MindmapTools';
import { deleteVersionsOf } from '../mindmap3d/mm3Versions';
import { ConvertTo3dModal } from '../mindmap3d/ConvertTo3dModal';
import { mindmapTexts } from './mindmapTexts';
import { fmt, xt } from './mindmapExtraTexts';

/** Ordner, auch wenn noch nichts darin liegt */
export const mindmapFoldersStore = createKeyValueStore<string[]>('mindmap-folders', []);
const byNewest = (a: MindMap, b: MindMap) => b.updatedAt.localeCompare(a.updatedAt);
type Row = { map: MindMap; depth: number };

export function MindmapListPage() {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const T = mindmapTexts(lang);
  const X = xt(lang);
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MindMap[]>(() => mindmapRepo.getAll());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [convertFor, setConvertFor] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState<string | null>(null);
  const [subFor, setSubFor] = useState<string | null>(null);
  const [renameFolder, setRenameFolder] = useState<string | null>(null);
  const [closedFolders, setClosedFolders] = useState<Set<string>>(new Set());
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [storedFolders, setStoredFolders] = useState<string[]>(() => mindmapFoldersStore.get());
  const [folderModal, setFolderModal] = useState(false);
  const [createFolder, setCreateFolder] = useState('');
  const [toast, setToast] = useState('');

  const reload = () => setMaps(mindmapRepo.getAll());
  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? '' : t)), 2400);
  };
  const save = (m: MindMap) => mindmapRepo.save({ ...m, updatedAt: new Date().toISOString() });

  const live = useMemo(() => maps.filter((m) => !m.archived), [maps]);
  const archived = useMemo(() => maps.filter((m) => m.archived).sort(byNewest), [maps]);
  const liveIds = useMemo(() => new Set(live.map((m) => m.id)), [live]);

  /** the list as rows: folders first-level, sub maps nested below their parent */
  const { loose, folders } = useMemo(() => {
    const kids = new Map<string, MindMap[]>();
    const isNested = (m: MindMap) => !!m.parentId && liveIds.has(m.parentId) && m.parentId !== m.id;
    live.forEach((m) => {
      if (isNested(m)) kids.set(m.parentId as string, [...(kids.get(m.parentId as string) ?? []), m]);
    });
    const rowsFor = (top: MindMap[]): Row[] => {
      const out: Row[] = [];
      const seen = new Set<string>();
      const walk = (m: MindMap, depth: number) => {
        if (seen.has(m.id) || depth > 4) return;
        seen.add(m.id);
        out.push({ map: m, depth });
        (kids.get(m.id) ?? []).sort(byNewest).forEach((k) => walk(k, depth + 1));
      };
      top.sort(byNewest).forEach((m) => walk(m, 0));
      return out;
    };
    const tops = live.filter((m) => !isNested(m));
    // a cycle (A below B below A) would hide both – show them at the top
    const reached = new Set(rowsFor([...tops]).map((r) => r.map.id));
    const stray = live.filter((m) => !reached.has(m.id));
    const all = [...tops, ...stray];
    const folderNames = [...new Set([...all.map((m) => m.folder).filter(Boolean) as string[], ...storedFolders])].sort((a, b) => a.localeCompare(b));
    return {
      loose: rowsFor(all.filter((m) => !m.folder)),
      folders: folderNames.map((f) => ({ name: f, rows: rowsFor(all.filter((m) => m.folder === f)) })),
    };
  }, [live, liveIds, storedFolders]);
  const folderNames = folders.map((f) => f.name);

  function addStoredFolder(f: string) {
    const list = mindmapFoldersStore.get();
    if (!list.includes(f)) mindmapFoldersStore.set([...list, f]);
    setStoredFolders(mindmapFoldersStore.get());
  }
  function create(template: Template | '3d') {
    const m = newMap(name.trim() || T.untitled, template === '3d' ? 'empty' : template, lang);
    if (template === '3d') {
      m.nodes = [];
      m.kind = '3d';
      m.space = emptySpace(lang);
    }
    if (createFolder) m.folder = createFolder;
    mindmapRepo.save(m);
    navigate(`/entdecken/mindmap/${m.id}`);
  }
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' });
  const templates: [Template, string, string][] = [
    ['empty', T.tEmpty, T.tEmptySub],
    ['branches', T.tBranches, T.tBranchesSub],
    ['cluster', T.tCluster, T.tClusterSub],
  ];
  const get = (id: string | null) => maps.find((m) => m.id === id);

  function archive(m: MindMap) {
    const ids = [m.id, ...descendantsOf(maps, m.id)];
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const x = get(id);
      if (x) mindmapRepo.save({ ...x, archived: true, archivedAt: now });
    });
    setActionFor(null);
    reload();
    say(X.archived);
  }
  function restore(m: MindMap) {
    const ids = [m.id, ...descendantsOf(maps, m.id).filter((id) => get(id)?.archived)];
    ids.forEach((id) => {
      const x = get(id);
      if (x) mindmapRepo.save({ ...x, archived: undefined, archivedAt: undefined });
    });
    reload();
    say(X.restored);
  }
  function duplicate(m: MindMap) {
    const now = new Date().toISOString();
    mindmapRepo.save({ ...m, id: createId('mm'), title: `${m.title} (2)`, createdAt: now, updatedAt: now });
    setActionFor(null);
    reload();
  }
  function remove(m: MindMap) {
    if (!window.confirm(T.deleteMapConfirm)) return;
    maps.filter((x) => x.parentId === m.id).forEach((x) => mindmapRepo.save({ ...x, parentId: undefined }));
    mindmapRepo.remove(m.id);
    deleteVersionsOf(m.id);
    setActionFor(null);
    reload();
  }
  function moveTo(m: MindMap, dest: { folder?: string; parentId?: string }) {
    if (dest.folder) addStoredFolder(dest.folder);
    save({ ...m, folder: dest.folder || undefined, parentId: dest.parentId || undefined });
    setMoveFor(null);
    setActionFor(null);
    setNewFolder('');
    reload();
    say(X.moved);
  }
  function createSub(parent: MindMap, title: string) {
    const made = newMap(title || T.untitled, 'empty', lang);
    made.parentId = parent.id;
    made.bg = { ...parent.bg };
    mindmapRepo.save(made);
    setSubFor(null);
    setActionFor(null);
    reload();
    say(X.subCreated);
  }
  function removeFolder(f: string) {
    const inside = maps.filter((m) => m.folder === f);
    const msg = lang === 'en'
      ? (inside.length ? `Remove the folder “${f}”? Its ${inside.length} mind map(s) stay – they just move out of the folder.` : `Remove the empty folder “${f}”?`)
      : (inside.length ? `Ordner „${f}“ entfernen? Die ${inside.length} Mindmap(s) darin bleiben erhalten – sie liegen dann nur nicht mehr im Ordner.` : `Den leeren Ordner „${f}“ entfernen?`);
    if (!window.confirm(msg)) return;
    inside.forEach((m) => mindmapRepo.save({ ...m, folder: undefined }));
    mindmapFoldersStore.set(mindmapFoldersStore.get().filter((x) => x !== f));
    setStoredFolders(mindmapFoldersStore.get());
    reload();
  }
  function renameFolderTo(from: string, to: string) {
    if (!to) return;
    maps.filter((m) => m.folder === from).forEach((m) => mindmapRepo.save({ ...m, folder: to }));
    mindmapFoldersStore.set(mindmapFoldersStore.get().map((x) => (x === from ? to : x)));
    setStoredFolders(mindmapFoldersStore.get());
    setRenameFolder(null);
    reload();
  }

  const renderRow = ({ map: m, depth }: Row) => {
    const childN = maps.filter((x) => x.parentId === m.id && !x.archived).length;
    const parent = m.parentId ? get(m.parentId) : undefined;
    return (
      <li key={m.id} style={{ marginLeft: depth * 16 }} className="flex items-stretch gap-1" data-testid={`mindmap-row-${m.id}`} data-depth={depth}>
        {depth > 0 && <span className="w-3 border-l-2 border-b-2 rounded-bl-lg border-[var(--color-border-strong)] -mt-3 mb-5 shrink-0" aria-hidden="true" />}
        <div className="flex-1 min-w-0 flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] pr-1 overflow-hidden">
          <button type="button" onClick={() => navigate(`/entdecken/mindmap/${m.id}`)} className="flex-1 min-w-0 flex items-center gap-3 text-left" data-testid={`mindmap-card-${m.id}`}>
            <div className="w-[84px] h-[64px] shrink-0 overflow-hidden" style={{ background: '#fff' }} aria-hidden="true">
              {m.kind === '3d' ? (
                m.thumb ? <img src={m.thumb} alt="" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center" style={{ background: 'var(--color-surface-muted)' }}><Box size={22} className="text-[var(--color-text-faint)]" /></div>
              ) : m.nodes.length > 0 ? <MindmapDrawing map={m} maxHeight="64px" pad={14} /> : <div className="h-full" style={{ background: 'var(--color-surface-muted)' }} />}
            </div>
            <div className="min-w-0 py-2">
              <p className="text-[15px] text-[var(--color-text)] truncate">{m.title || T.untitled}</p>
              <p className="text-[12px] text-[var(--color-text-faint)]">
                {m.kind === '3d' && <span className="text-[var(--color-primary)]" data-testid={`mindmap-3d-badge-${m.id}`}>3D · </span>}
                {(() => { const n = m.kind === '3d' ? m.space?.nodes.length ?? 0 : m.nodes.length; return n === 1 ? X.oneElement : T.elements.replace('{n}', String(n)); })()} · {T.edited.replace('{d}', date(m.updatedAt))}
                {childN > 0 && ` · ${fmt(X.subCount, { n: childN })}`}
              </p>
              {depth === 0 && parent && <p className="text-[11.5px] text-[var(--color-text-faint)] truncate">{fmt(X.subOf, { t: parent.title })}</p>}
            </div>
          </button>
          <button type="button" onClick={() => setActionFor(m.id)} aria-label={X.actMore} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] shrink-0" data-testid={`mindmap-actions-${m.id}`}>
            <Ellipsis size={18} />
          </button>
        </div>
      </li>
    );
  };

  const act = get(actionFor);
  const mv = get(moveFor);
  const subTargets = mv ? live.filter((x) => x.id !== mv.id && !descendantsOf(maps, mv.id).includes(x.id)) : [];
  const sub = get(subFor);

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="mindmap" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1" data-testid="mindmap-title">{T.pageTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4" data-hint>{T.listIntro}</p>
        <button type="button" onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-[15px] text-white mb-5" style={{ background: 'var(--color-primary)' }} data-testid="mindmap-new">
          <Plus size={18} /> {T.newMap}
        </button>

        <div className="flex gap-2 mb-5 -mt-2">
          <button type="button" onClick={() => { setCreateFolder(''); setFolderModal(true); }} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mindmap-folder-new">
            <FolderPlus size={16} /> {lang === 'en' ? 'New folder' : 'Neuer Ordner'}
          </button>
          <button type="button" onClick={() => navigate('/entdecken/projekte')} className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mindmap-to-projects">
            <FolderKanban size={16} /> {lang === 'en' ? 'My projects' : 'Meine Projekte'}
          </button>
        </div>

        {live.length === 0 && folderNames.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)] text-center py-8" data-testid="mindmap-empty">{T.empty}</p>
        ) : (
          <div data-testid="mindmap-list" className="flex flex-col gap-4">
            {loose.length > 0 && <ul className="flex flex-col gap-2.5" data-testid="mindmap-loose">{loose.map(renderRow)}</ul>}
            {folders.map((f) => {
              const open = !closedFolders.has(f.name);
              return (
                <section key={f.name} data-testid={`mindmap-folder-${f.name}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setClosedFolders((s) => { const n = new Set(s); if (n.has(f.name)) n.delete(f.name); else n.add(f.name); return n; })}
                      aria-label={X.listFolderToggle}
                      aria-expanded={open}
                      className="flex-1 flex items-center gap-2 text-left py-1.5 text-[14.5px] text-[var(--color-text)]"
                      data-testid={`mindmap-folder-toggle-${f.name}`}
                    >
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <Folder size={16} className="text-[var(--color-primary)]" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-[12px] text-[var(--color-text-faint)]">({f.rows.length})</span>
                    </button>
                    <button type="button" onClick={() => setRenameFolder(f.name)} className="text-[12.5px] px-2 py-1 text-[var(--color-text-muted)] underline underline-offset-2" data-testid={`mindmap-folder-rename-${f.name}`}>{X.folderRename}</button>
                    <button type="button" onClick={() => removeFolder(f.name)} aria-label={lang === 'en' ? 'Remove folder' : 'Ordner entfernen'} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`mindmap-folder-delete-${f.name}`}><Trash2 size={14} /></button>
                  </div>
                  {open && f.rows.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)] pl-7 pb-1" data-testid={`mindmap-folder-empty-${f.name}`}>{lang === 'en' ? 'Empty – move mind maps in via “…” → “Move”, or create one here.' : 'Leer – Mindmaps kommst du über „…“ → „Verschieben“ hinein, oder lege hier eine neue an.'}</p>}
                  {open && <ul className="flex flex-col gap-2.5">{f.rows.map(renderRow)}</ul>}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <button type="button" onClick={() => setArchiveOpen((v) => !v)} className="w-full flex items-center gap-2 py-2.5 text-[14px] text-[var(--color-text-muted)]" aria-expanded={archiveOpen} data-testid="mindmap-archive-toggle">
            {archiveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Archive size={16} /> {X.archiveTitle} ({archived.length})
          </button>
          {archiveOpen && (
            <div data-testid="mindmap-archive" className="flex flex-col gap-2 mt-1">
              <p className="text-[12.5px] text-[var(--color-text-faint)]" data-hint>{X.archiveHint}</p>
              {archived.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{X.archiveEmpty}</p>}
              {archived.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] pr-2 overflow-hidden" data-testid={`mindmap-archived-${m.id}`}>
                  <button type="button" onClick={() => navigate(`/entdecken/mindmap/${m.id}`)} className="flex-1 min-w-0 text-left px-4 py-3">
                    <p className="text-[14.5px] text-[var(--color-text)] truncate">{m.title || T.untitled}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">{m.nodes.length === 1 ? X.oneElement : T.elements.replace('{n}', String(m.nodes.length))}</p>
                  </button>
                  <button type="button" onClick={() => restore(m)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] border border-[var(--color-border-strong)] text-[var(--color-text)] shrink-0" data-testid={`mindmap-restore-${m.id}`}>
                    <RotateCcw size={13} /> {X.actRestore}
                  </button>
                  <button type="button" onClick={() => remove(m)} className="text-[12.5px] px-2 py-1 text-[var(--color-danger)] shrink-0" data-testid={`mindmap-archived-delete-${m.id}`}>{X.actDelete}</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <PasteSharedButton />
        </div>
      </div>
      {toast && <p className="fixed left-1/2 -translate-x-1/2 bottom-24 text-[13px] px-4 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] shadow-[var(--shadow-md)] z-[120]" role="status">{toast}</p>}

      <Modal open={creating} onClose={() => setCreating(false)} title={T.newMap} subtitle={T.templateTitle}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[12.5px] text-[var(--color-text-muted)] mb-1" htmlFor="mm-new-name">{T.nameLabel}</label>
            <input id="mm-new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={T.namePh} data-testid="mindmap-new-name" className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px] outline-none" />
          </div>
          {folderNames.length > 0 && (
            <div>
              <label className="block text-[12.5px] text-[var(--color-text-muted)] mb-1" htmlFor="mm-new-folder">{lang === 'en' ? 'Folder' : 'Ordner'}</label>
              <select id="mm-new-folder" value={createFolder} onChange={(e) => setCreateFolder(e.target.value)} data-testid="mindmap-new-folder" className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px] outline-none">
                <option value="">{lang === 'en' ? 'no folder' : 'kein Ordner'}</option>
                {folderNames.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          {templates.map(([id, title, sub2]) => (
            <button key={id} type="button" onClick={() => create(id)} className="text-left rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] px-4 py-3" data-testid={`mindmap-template-${id}`}>
              <p className="text-[15px] text-[var(--color-text)]">{title}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)]">{sub2}</p>
            </button>
          ))}
          <button type="button" onClick={() => create('3d')} className="text-left rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] px-4 py-3 flex items-start gap-3" data-testid="mindmap-template-3d">
            <Box size={20} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
            <span>
              <span className="block text-[15px] text-[var(--color-text)]">{lang === 'en' ? '3D space' : '3D-Raum'}</span>
              <span className="block text-[12.5px] text-[var(--color-text-muted)]">{lang === 'en' ? 'Things float in space on named layers – turn, zoom, place them above and beside each other.' : 'Dinge schweben im Raum auf benannten Ebenen – drehen, zoomen, übereinander und nebeneinander setzen.'}</span>
            </span>
          </button>
        </div>
      </Modal>

      {folderModal && <NameModal key="newfolder" open onClose={() => setFolderModal(false)} title={lang === 'en' ? 'New folder' : 'Neuer Ordner'} label={X.folderName} initial="" cta={X.moveCreateFolder} onSubmit={(n) => { const f = n.trim(); if (f) addStoredFolder(f); setFolderModal(false); }} testId="mindmap-newfolder" />}

      {/* what can be done with one map */}
      <Modal open={!!act && !moveFor && !subFor} onClose={() => setActionFor(null)} title={act?.title || T.untitled} subtitle={X.actTitle}>
        {act && (
          <div className="flex flex-col gap-2" data-testid="mindmap-action-sheet">
            {([
              ['open', X.actOpen, () => navigate(`/entdecken/mindmap/${act.id}`)],
              ['move', X.actMove, () => setMoveFor(act.id)],
              ['sub', X.actSub, () => setSubFor(act.id)],
              ['dup', X.actDup, () => duplicate(act)],
              ...(act.kind === '3d' ? [] : [['to3d', lang === 'en' ? 'Turn into 3D (copy)' : 'In 3D umwandeln (Kopie)', () => { setConvertFor(act.id); setActionFor(null); }] as [string, string, () => void]]),
              ['archive', X.actArchive, () => archive(act)],
              ['delete', X.actDelete, () => remove(act)],
            ] as [string, string, () => void][]).map(([id, label, run]) => (
              <button key={id} type="button" onClick={run} className={`text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] ${id === 'delete' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`} data-testid={`mindmap-act-${id}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </Modal>

      <ConvertTo3dModal map={get(convertFor) ?? null} onClose={() => setConvertFor(null)} />

      <Modal open={!!mv} onClose={() => setMoveFor(null)} title={X.moveTitle} subtitle={mv?.title}>
        {mv && (
          <div className="flex flex-col gap-3" data-testid="mindmap-move-sheet">
            <button type="button" onClick={() => moveTo(mv, {})} className="text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] text-[var(--color-text)]" data-testid="mindmap-move-top">{X.moveTop}</button>
            {folderNames.length > 0 && (
              <div>
                <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{X.moveFolders}</p>
                <div className="flex flex-col gap-1.5">
                  {folderNames.map((f) => (
                    <button key={f} type="button" onClick={() => moveTo(mv, { folder: f })} className="text-left rounded-[var(--radius-md)] px-4 py-2.5 border border-[var(--color-border-strong)] text-[14.5px] text-[var(--color-text)] flex items-center gap-2" data-testid={`mindmap-move-folder-${f}`}>
                      <Folder size={15} className="text-[var(--color-primary)]" /> {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{X.moveNewFolder}</p>
              <div className="flex gap-2">
                <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder={X.moveNewFolderPh} className="flex-1 min-w-0 h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[15px] outline-none" data-testid="mindmap-move-newfolder" />
                <button type="button" disabled={!newFolder.trim()} onClick={() => moveTo(mv, { folder: newFolder.trim() })} className="px-4 rounded-full text-[14px] text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="mindmap-move-newfolder-go">{X.moveCreateFolder}</button>
              </div>
            </div>
            <div>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5"><FolderTree size={14} /> {X.moveAsSub}</p>
              {subTargets.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{X.moveNoOthers}</p>}
              <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto">
                {subTargets.sort((a, b) => a.title.localeCompare(b.title)).map((t) => (
                  <button key={t.id} type="button" onClick={() => moveTo(mv, { parentId: t.id })} className="text-left rounded-[var(--radius-md)] px-4 py-2.5 border border-[var(--color-border-strong)] text-[14.5px] text-[var(--color-text)]" data-testid={`mindmap-move-sub-${t.id}`}>
                    {t.title || T.untitled}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {sub && <NameModal key={sub.id} open onClose={() => setSubFor(null)} title={X.submapTitle} label={X.submapName} initial="" cta={X.submapCreate} onSubmit={(n) => createSub(sub, n)} testId="mindmap-sub" />}
      {renameFolder && <NameModal key={renameFolder} open onClose={() => setRenameFolder(null)} title={X.folderRename} label={X.folderName} initial={renameFolder} cta={X.folderRenameCta} onSubmit={(n) => renameFolderTo(renameFolder, n)} testId="mindmap-folder" />}
    </div>
  );
}
