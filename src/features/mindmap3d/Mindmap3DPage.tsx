import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Camera, ChevronLeft, Copy, Eye, EyeOff, Layers, Link2, List, Maximize2, Minus, Move, MoveVertical, Plus, Redo2, Settings2, Trash2, Undo2, Unlink,
} from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { goBack } from '../../services/navigation';
import { deliverImage, stamp } from '../../services/snapshot';
import { createId } from '../../services/storage/repository';
import { mindmapRepo, type MindMap } from '../mindmap/mindmapModel';
import { useL } from '../projects/useL';
import {
  COLORS3D, LAYER_COLORS, SHAPES3D, newEdge3, newLayer3, newNode3, sanitizeSpace,
  type Edge3D, type Layer3D, type Node3D, type Shape3D, type Space3D,
} from './space3dModel';
import { SpaceView, webglAvailable, type Cam, type DragMode } from './spaceView';

type Tab = 'thing' | 'layers' | 'view' | 'list';
type Sel = { kind: 'node' | 'edge'; id: string } | null;

const ctlBtn = 'w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40';
const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-[13px] border shrink-0 ${on ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`;
const field = 'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-text)] outline-none';
const r1 = (v: number) => Math.round(v * 100) / 100;

export default function Mindmap3DPage({ initial }: { initial: MindMap }) {
  const { L, lang } = useL();
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);
  const fromDiary = (useLocation().state as { fromDiary?: string } | null)?.fromDiary;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SpaceView | null>(null);
  const [gl] = useState(() => webglAvailable());
  const [title, setTitle] = useState(initial.title);
  const [space, setSpace] = useState<Space3D>(() => sanitizeSpace(initial.space, lang));
  const spaceRef = useRef(space);
  const titleRef = useRef(title);
  const camRef = useRef<Cam>(space.cam);
  const thumbRef = useRef<string | undefined>(initial.thumb);
  const [sel, setSel] = useState<Sel>(null);
  const [selLayer, setSelLayer] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('thing');
  const [panelOpen, setPanelOpen] = useState(true);
  const [dragMode, setDragMode] = useState<DragMode>('plane');
  const [toast, setToast] = useState('');
  const past = useRef<Space3D[]>([]);
  const future = useRef<Space3D[]>([]);
  const [, bump] = useState(0);
  const lastUndo = useRef({ key: '', t: 0 });
  const dirty = useRef(false);
  const thumbDirty = useRef(false);
  const saveTimer = useRef<number>(0);
  const thumbTimer = useRef<number>(0);
  const dragUndone = useRef(false);

  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 3200);
  };

  /* ------------------------------------------------------------- saving */
  const writeNow = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    if (!dirty.current) return;
    dirty.current = false;
    const base = mindmapRepo.getById(initial.id) ?? initial;
    mindmapRepo.trySave({
      ...base, kind: '3d', title: titleRef.current, space: { ...spaceRef.current, cam: camRef.current },
      thumb: thumbRef.current, updatedAt: new Date().toISOString(),
    });
  }, [initial]);
  const schedule = useCallback(() => {
    dirty.current = true;
    thumbDirty.current = true;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(writeNow, 450);
    window.clearTimeout(thumbTimer.current);
    thumbTimer.current = window.setTimeout(() => {
      const url = viewRef.current?.snapshotFit(1100, 800, 0.8);
      if (url) { thumbRef.current = url; thumbDirty.current = false; dirty.current = true; writeNow(); }
    }, 1800);
  }, [writeNow]);
  const flush = useCallback((withThumb: boolean) => {
    window.clearTimeout(thumbTimer.current);
    if (withThumb && (thumbDirty.current || !thumbRef.current)) {
      const url = viewRef.current?.snapshotFit(1100, 800, 0.8);
      if (url) { thumbRef.current = url; thumbDirty.current = false; dirty.current = true; }
    }
    writeNow();
  }, [writeNow]);

  /* ------------------------------------------------------------ mutating */
  const mutate = useCallback((fn: (s: Space3D) => Space3D, undoKey: string | false = '') => {
    const cur = spaceRef.current;
    if (undoKey !== false) {
      const now = Date.now();
      if (!undoKey || lastUndo.current.key !== undoKey || now - lastUndo.current.t > 1500) {
        past.current.push(cur);
        if (past.current.length > 50) past.current.shift();
        future.current = [];
      }
      lastUndo.current = { key: undoKey, t: now };
    }
    const nx = fn(cur);
    spaceRef.current = nx;
    setSpace(nx);
    schedule();
    bump((v) => v + 1);
  }, [schedule]);
  const undo = () => {
    const p = past.current.pop();
    if (!p) return;
    future.current.push(spaceRef.current);
    spaceRef.current = p;
    setSpace(p);
    schedule();
    bump((v) => v + 1);
  };
  const redo = () => {
    const f = future.current.pop();
    if (!f) return;
    past.current.push(spaceRef.current);
    spaceRef.current = f;
    setSpace(f);
    schedule();
    bump((v) => v + 1);
  };

  const setNode = (id: string, patch: Partial<Node3D>, key = '') =>
    mutate((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }), key);
  const setEdge = (id: string, patch: Partial<Edge3D>, key = '') =>
    mutate((s) => ({ ...s, edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }), key);
  const setLayer = (id: string, patch: Partial<Layer3D>, key = '') =>
    mutate((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) }), key);

  /* ------------------------------------------------------------- the view */
  const cbRef = useRef<{ pickNode(id: string): void }>({ pickNode: () => undefined });
  cbRef.current.pickNode = (id: string) => {
    if (connectFrom && connectFrom !== id) {
      const exists = spaceRef.current.edges.find((e) => (e.from === connectFrom && e.to === id) || (e.from === id && e.to === connectFrom));
      if (exists) {
        mutate((s) => ({ ...s, edges: s.edges.filter((e) => e.id !== exists.id) }));
        say(L('Verbindung gelöst.', 'Link removed.'));
      } else {
        const e = newEdge3(connectFrom, id);
        mutate((s) => ({ ...s, edges: [...s.edges, e] }));
        setSel({ kind: 'edge', id: e.id });
        say(L('Verbunden – unten kannst du sie beschriften.', 'Linked – you can label it below.'));
      }
      setConnectFrom(null);
      setTab('thing');
      return;
    }
    setConnectFrom(null);
    setSel({ kind: 'node', id });
    setSelLayer(null);
    setTab('thing');
    setPanelOpen(true);
  };

  useEffect(() => {
    if (!gl || !hostRef.current) return;
    let view: SpaceView;
    try {
      view = new SpaceView(hostRef.current, {
        onPickNode: (id) => cbRef.current.pickNode(id),
        onPickEdge: (id) => { setConnectFrom(null); setSel({ kind: 'edge', id }); setTab('thing'); setPanelOpen(true); },
        onPickNone: () => { setSel(null); setConnectFrom(null); },
        onDragStart: (id) => {
          const cur = spaceRef.current;
          past.current.push(cur);
          if (past.current.length > 50) past.current.shift();
          future.current = [];
          dragUndone.current = false;
          setSel({ kind: 'node', id });
          setTab('thing');
        },
        onDrag: (id, x, y, z, layerId) => {
          const s = spaceRef.current;
          const nx = { ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y, z, layerId } : n)) };
          spaceRef.current = nx;
          setSpace(nx);
          dirty.current = true;
        },
        onDragEnd: () => { schedule(); bump((v) => v + 1); },
        onCam: (c) => { camRef.current = c; dirty.current = true; schedule(); },
      });
    } catch {
      return;
    }
    viewRef.current = view;
    view.setInitialCam(spaceRef.current.cam);
    camRef.current = spaceRef.current.cam;
    view.update(spaceRef.current, {});
    // ein Vorschaubild gleich zu Beginn, damit auch eine unberührte 3D-Mindmap in Liste und PDF etwas zeigt
    const first = window.setTimeout(() => {
      if (thumbRef.current) return;
      const url = view.snapshotFit(1100, 800, 0.8);
      if (url) { thumbRef.current = url; dirty.current = true; writeNow(); }
    }, 900);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(saveTimer.current);
      flush(true);
      view.dispose();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    viewRef.current?.update(space, { selNode: sel?.kind === 'node' ? sel.id : null, selEdge: sel?.kind === 'edge' ? sel.id : null, selLayer, connectFrom });
  }, [space, sel, selLayer, connectFrom]);
  useEffect(() => { viewRef.current?.setDragMode(dragMode); }, [dragMode]);
  useEffect(() => {
    const onHide = () => flush(false);
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flush]);

  /* ---------------------------------------------------------------- items */
  const node = sel?.kind === 'node' ? space.nodes.find((n) => n.id === sel.id) : undefined;
  const edge = sel?.kind === 'edge' ? space.edges.find((e) => e.id === sel.id) : undefined;
  const layerName = (id?: string) => space.layers.find((l) => l.id === id)?.name ?? '';
  const otherMaps = useMemo(() => mindmapRepo.getAll().filter((m) => m.id !== initial.id && !m.archived), [initial.id]);

  const snapY = (y: number): { y: number; layerId?: string } => {
    for (const l of spaceRef.current.layers) if (Math.abs(l.y - y) < 0.55) return { y: l.y, layerId: l.id };
    return { y };
  };
  function addThing(shape: Shape3D = 'sphere') {
    const t = viewRef.current?.target() ?? { x: 0, y: 0, z: 0 };
    const lay = selLayer ? space.layers.find((l) => l.id === selLayer) : undefined;
    const j = () => (Math.random() - 0.5) * 3;
    const base = lay ? { y: lay.y, layerId: lay.id } : snapY(t.y);
    const n = newNode3({ text: L('Neu', 'New'), shape, color: COLORS3D[space.nodes.length % COLORS3D.length], x: r1(t.x + j()), z: r1(t.z + j()), ...base });
    mutate((s) => ({ ...s, nodes: [...s.nodes, n] }));
    setSel({ kind: 'node', id: n.id });
    setTab('thing');
    setPanelOpen(true);
  }
  function removeNode(id: string) {
    mutate((s) => ({ ...s, nodes: s.nodes.filter((n) => n.id !== id), edges: s.edges.filter((e) => e.from !== id && e.to !== id) }));
    setSel(null);
  }
  function duplicateNode(n: Node3D) {
    const c = { ...n, id: createId('n3'), x: r1(n.x + 1.6), z: r1(n.z + 1.2) };
    mutate((s) => ({ ...s, nodes: [...s.nodes, c] }));
    setSel({ kind: 'node', id: c.id });
  }
  function nudge(n: Node3D, dx: number, dy: number, dz: number) {
    if (dy) {
      const s = snapY(n.y + dy);
      setNode(n.id, { y: r1(s.y), layerId: s.layerId });
    } else setNode(n.id, { x: r1(n.x + dx), z: r1(n.z + dz) });
  }
  function addLayer() {
    const ys = space.layers.map((l) => l.y);
    const y = ys.length ? Math.max(...ys) + 3 : 0;
    const l = newLayer3(L('Neue Ebene', 'New layer'), y, space.layers.length);
    mutate((s) => ({ ...s, layers: [...s.layers, l] }));
    setSelLayer(l.id);
  }
  function moveLayer(l: Layer3D, y: number) {
    const d = y - l.y;
    mutate((s) => ({
      ...s,
      layers: s.layers.map((x) => (x.id === l.id ? { ...x, y } : x)),
      nodes: s.nodes.map((n) => (n.layerId === l.id ? { ...n, y: r1(n.y + d) } : n)),
    }), `ly-${l.id}`);
  }
  function removeLayer(l: Layer3D) {
    mutate((s) => ({ ...s, layers: s.layers.filter((x) => x.id !== l.id), nodes: s.nodes.map((n) => (n.layerId === l.id ? { ...n, layerId: undefined } : n)) }));
    setSelLayer(null);
  }

  async function takePhoto() {
    flush(false);
    const url = viewRef.current?.snapshot(1800, 'image/png');
    if (!url) { say(L('Das Bild ließ sich auf diesem Gerät nicht erstellen.', 'The picture could not be made on this device.')); return; }
    const blob = await (await fetch(url)).blob();
    const r = await deliverImage(blob, `${(title || '3D').replace(/[^\p{L}\p{N}_-]+/gu, '_')}-${stamp()}.png`, title || '3D');
    if (r === 'shared') say(L('Bild ist bereit – im Teilen-Menü sichern.', 'Picture ready – save it from the share menu.'));
    else if (r === 'downloaded') say(L('Bild wurde in deinen Downloads gespeichert.', 'Picture saved to your downloads.'));
  }
  const goBackNow = () => {
    flush(true);
    if (fromDiary) navigate(`/sicherheit/tagebuch?entry=${fromDiary}`, { replace: true });
    else goBack(navigate, '/entdecken/mindmap');
  };

  /* ---------------------------------------------------------------- panels */
  const thingPanel = () => {
    if (edge) {
      const a = space.nodes.find((n) => n.id === edge.from);
      const b = space.nodes.find((n) => n.id === edge.to);
      return (
        <div className="space-y-3" data-testid="mm3-edge-panel">
          <p className="text-[13px] text-[var(--color-text-muted)]">{L('Verbindung', 'Link')}: {a?.text} → {b?.text}</p>
          <input className={field} value={edge.label ?? ''} onChange={(e) => setEdge(edge.id, { label: e.target.value }, `el-${edge.id}`)} placeholder={L('Beschriftung (z. B. „führt zu“)', 'Label (e.g. “leads to”)')} data-testid="mm3-edge-label" />
          <div className="flex flex-wrap gap-2">
            {['#c9c4b8', ...COLORS3D.slice(0, 7)].map((c) => (
              <button key={c} type="button" onClick={() => setEdge(edge.id, { color: c })} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: edge.color === c ? 'var(--color-primary)' : 'transparent' }} aria-label={c} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!!edge.dashed)} onClick={() => setEdge(edge.id, { dashed: !edge.dashed })}>{L('gestrichelt', 'dashed')}</button>
            <button type="button" className={chip(!!edge.arrow)} onClick={() => setEdge(edge.id, { arrow: !edge.arrow })}>{L('mit Pfeil', 'arrow')}</button>
            <button type="button" className={chip(false)} onClick={() => setEdge(edge.id, { from: edge.to, to: edge.from })}>{L('Richtung drehen', 'flip direction')}</button>
            <button type="button" className={`${chip(false)} text-[var(--color-danger,#b4472f)]`} onClick={() => { mutate((s) => ({ ...s, edges: s.edges.filter((e) => e.id !== edge.id) })); setSel(null); }} data-testid="mm3-edge-delete"><Trash2 size={13} className="inline -mt-0.5 mr-1" />{L('Verbindung löschen', 'Delete link')}</button>
          </div>
        </div>
      );
    }
    if (!node) {
      return (
        <div className="space-y-3 text-[14px] text-[var(--color-text-muted)]" data-testid="mm3-empty-panel">
          <p>{L('Tippe ein Ding an, um es zu bearbeiten. Mit einem Finger drehst du den Raum, mit zwei Fingern zoomst und verschiebst du ihn.', 'Tap a thing to edit it. One finger turns the space, two fingers zoom and move it.')}</p>
          <p className="text-[13px]">{L('Ein Ding anfassen und ziehen verschiebt es – „Fläche“ bewegt es auf seiner Ebene, „Höhe“ nach oben oder unten.', 'Drag a thing to move it – “Floor” moves it on its layer, “Height” up or down.')}</p>
          <div className="flex flex-wrap gap-2">
            {SHAPES3D.map((s) => (
              <button key={s.id} type="button" className={chip(false)} onClick={() => addThing(s.id)} data-testid={`mm3-add-${s.id}`}>{s.icon} {L(s.de, s.en)}</button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3" data-testid="mm3-node-panel">
        <input className={field} value={node.text} onChange={(e) => setNode(node.id, { text: e.target.value }, `nt-${node.id}`)} placeholder={L('Name des Dings', 'Name of the thing')} data-testid="mm3-node-text" />
        <div>
          <p className="text-[12px] text-[var(--color-text-muted)] mb-1">{L('Form', 'Shape')}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SHAPES3D.map((s) => (
              <button key={s.id} type="button" className={chip(node.shape === s.id)} onClick={() => setNode(node.id, { shape: s.id })} data-testid={`mm3-shape-${s.id}`}>{s.icon} {L(s.de, s.en)}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS3D.map((c) => (
            <button key={c} type="button" onClick={() => setNode(node.id, { color: c })} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: node.color === c ? 'var(--color-primary)' : 'transparent' }} aria-label={c} data-testid={`mm3-color-${c.slice(1)}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--color-text-muted)]">{L('Größe', 'Size')}</span>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} type="button" className={chip(node.size === n)} onClick={() => setNode(node.id, { size: n })} data-testid={`mm3-size-${n}`}>{['S', 'M', 'L', 'XL'][n - 1]}</button>
          ))}
          <input className={`${field} !w-16 text-center`} value={node.symbol ?? ''} maxLength={4} onChange={(e) => setNode(node.id, { symbol: e.target.value.trim() || undefined }, `ns-${node.id}`)} placeholder="🙂" aria-label={L('Symbol', 'Symbol')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[12px] text-[var(--color-text-muted)]">{L('Ebene', 'Layer')}
            <select className={`${field} mt-1`} value={node.layerId ?? ''} onChange={(e) => {
              const l = space.layers.find((x) => x.id === e.target.value);
              setNode(node.id, l ? { layerId: l.id, y: l.y } : { layerId: undefined });
            }} data-testid="mm3-node-layer">
              <option value="">{L('keine', 'none')}</option>
              {space.layers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-[var(--color-text-muted)]">{L('Mindmap dahinter', 'Mind map behind it')}
            <select className={`${field} mt-1`} value={node.link ?? ''} onChange={(e) => setNode(node.id, { link: e.target.value || undefined })} data-testid="mm3-node-link">
              <option value="">{L('keine', 'none')}</option>
              {otherMaps.map((m) => <option key={m.id} value={m.id}>{m.kind === '3d' ? '🧊 ' : ''}{m.title || L('Ohne Titel', 'Untitled')}</option>)}
            </select>
          </label>
        </div>
        {node.link && mindmapRepo.getById(node.link) && (
          <button type="button" className={chip(false)} onClick={() => { flush(true); navigate(`/entdecken/mindmap/${node.link}`); }} data-testid="mm3-open-link">{L('Mindmap öffnen', 'Open mind map')} ↗</button>
        )}
        <textarea className={`${field} min-h-[56px]`} value={node.note ?? ''} onChange={(e) => setNode(node.id, { note: e.target.value || undefined }, `nn-${node.id}`)} placeholder={L('Notiz zu diesem Ding …', 'Note on this thing …')} data-testid="mm3-node-note" />
        <div>
          <p className="text-[12px] text-[var(--color-text-muted)] mb-1">{L('Fein verschieben', 'Nudge')} · x {node.x} · {L('Höhe', 'height')} {node.y} · z {node.z}</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(false)} onClick={() => nudge(node, -1, 0, 0)} data-testid="mm3-nudge-left">← {L('links', 'left')}</button>
            <button type="button" className={chip(false)} onClick={() => nudge(node, 1, 0, 0)} data-testid="mm3-nudge-right">{L('rechts', 'right')} →</button>
            <button type="button" className={chip(false)} onClick={() => nudge(node, 0, 0, -1)}>↑ {L('hinten', 'back')}</button>
            <button type="button" className={chip(false)} onClick={() => nudge(node, 0, 0, 1)}>↓ {L('vorn', 'front')}</button>
            <button type="button" className={chip(false)} onClick={() => nudge(node, 0, 1, 0)} data-testid="mm3-nudge-up">⬆ {L('höher', 'higher')}</button>
            <button type="button" className={chip(false)} onClick={() => nudge(node, 0, -1, 0)} data-testid="mm3-nudge-down">⬇ {L('tiefer', 'lower')}</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(connectFrom === node.id)} onClick={() => { setConnectFrom(connectFrom === node.id ? null : node.id); }} data-testid="mm3-connect"><Link2 size={13} className="inline -mt-0.5 mr-1" />{connectFrom === node.id ? L('Tippe das Ziel an …', 'Tap the target …') : L('Verbinden mit …', 'Link to …')}</button>
          <button type="button" className={chip(false)} onClick={() => viewRef.current?.focus(node.x, node.y, node.z)}>{L('Hierhin schauen', 'Look here')}</button>
          <button type="button" className={chip(false)} onClick={() => duplicateNode(node)}><Copy size={13} className="inline -mt-0.5 mr-1" />{L('Kopie', 'Copy')}</button>
          <button type="button" className={`${chip(false)} text-[var(--color-danger,#b4472f)]`} onClick={() => removeNode(node.id)} data-testid="mm3-node-delete"><Trash2 size={13} className="inline -mt-0.5 mr-1" />{L('Löschen', 'Delete')}</button>
        </div>
      </div>
    );
  };

  const layersPanel = () => (
    <div className="space-y-3" data-testid="mm3-layers-panel">
      <p className="text-[13px] text-[var(--color-text-muted)]">{L('Ebenen sind sichtbare, beschriftete Scheiben im Raum. Verschiebst du eine Ebene, gehen ihre Dinge mit.', 'Layers are visible, labelled slices of the space. When you move a layer, its things move with it.')}</p>
      {[...space.layers].sort((a, b) => b.y - a.y).map((l) => (
        <div key={l.id} className={`rounded-[var(--radius-md)] border p-2.5 space-y-2 ${selLayer === l.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} data-testid={`mm3-layer-${l.id}`}>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLayer(l.id, { visible: !l.visible })} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={l.visible ? L('ausblenden', 'hide') : L('einblenden', 'show')} data-testid="mm3-layer-vis">{l.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button>
            <input className={field} value={l.name} onChange={(e) => setLayer(l.id, { name: e.target.value }, `ln-${l.id}`)} aria-label={L('Name der Ebene', 'Layer name')} data-testid="mm3-layer-name" />
            <button type="button" className={chip(selLayer === l.id)} onClick={() => setSelLayer(selLayer === l.id ? null : l.id)} data-testid="mm3-layer-pick">{selLayer === l.id ? L('aktiv', 'active') : L('wählen', 'pick')}</button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] text-[var(--color-text-muted)]">{L('Höhe', 'Height')} {l.y}</span>
            <button type="button" className={chip(false)} onClick={() => moveLayer(l, r1(l.y - 1))} data-testid="mm3-layer-down"><Minus size={13} /></button>
            <button type="button" className={chip(false)} onClick={() => moveLayer(l, r1(l.y + 1))} data-testid="mm3-layer-up"><Plus size={13} /></button>
            {LAYER_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setLayer(l.id, { color: c })} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: l.color === c ? 'var(--color-text)' : 'transparent' }} aria-label={c} />
            ))}
            <button type="button" className={chip(l.plane)} onClick={() => setLayer(l.id, { plane: !l.plane })}>{L('Fläche', 'plane')}</button>
            <button type="button" className={chip(false)} onClick={() => removeLayer(l)} aria-label={L('Ebene entfernen', 'Remove layer')} data-testid="mm3-layer-delete"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
      <button type="button" className={chip(false)} onClick={addLayer} data-testid="mm3-layer-add"><Plus size={13} className="inline -mt-0.5 mr-1" />{L('Neue Ebene', 'New layer')}</button>
    </div>
  );

  const viewPanel = () => (
    <div className="space-y-3" data-testid="mm3-view-panel">
      <div>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-1">{L('Hintergrund', 'Background')}</p>
        <div className="flex gap-2">
          {(['dark', 'dusk', 'light'] as const).map((b) => (
            <button key={b} type="button" className={chip(space.bg === b)} onClick={() => mutate((s) => ({ ...s, bg: b }))} data-testid={`mm3-bg-${b}`}>{b === 'dark' ? L('Nacht', 'Night') : b === 'dusk' ? L('Dämmerung', 'Dusk') : L('Hell', 'Light')}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(space.grid)} onClick={() => mutate((s) => ({ ...s, grid: !s.grid }))} data-testid="mm3-grid">{L('Raster am Boden', 'Floor grid')}</button>
        <button type="button" className={chip(false)} onClick={() => viewRef.current?.fitAll()} data-testid="mm3-fit">{L('Alles im Blick', 'Show everything')}</button>
        <button type="button" className={chip(false)} onClick={() => { viewRef.current?.setCam({ theta: 0.7, phi: 1.15 }); camRef.current = viewRef.current!.getCam(); schedule(); }}>{L('Schräg von oben', 'From above')}</button>
        <button type="button" className={chip(false)} onClick={() => { viewRef.current?.setCam({ theta: 0, phi: 1.5 }); camRef.current = viewRef.current!.getCam(); schedule(); }}>{L('Von vorn', 'Front')}</button>
        <button type="button" className={chip(false)} onClick={() => { viewRef.current?.setCam({ theta: 0, phi: 0.06 }); camRef.current = viewRef.current!.getCam(); schedule(); }}>{L('Von oben', 'Top')}</button>
        <button type="button" className={chip(false)} onClick={() => void takePhoto()} data-testid="mm3-photo"><Camera size={13} className="inline -mt-0.5 mr-1" />{L('Bild speichern', 'Save picture')}</button>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)]">{L('Das Bild für Liste und PDF zeigt alles, was sichtbar ist – aus dem Blickwinkel, in dem du zuletzt geschaut hast.', 'The picture for the list and PDFs shows everything visible – from the angle you last looked from.')}</p>
    </div>
  );

  const listPanel = () => (
    <div className="space-y-1.5" data-testid="mm3-list-panel">
      {space.nodes.length === 0 && <p className="text-[13px] text-[var(--color-text-muted)]">{L('Noch nichts im Raum.', 'Nothing in the space yet.')}</p>}
      {[...space.nodes].sort((a, b) => b.y - a.y).map((n) => (
        <button key={n.id} type="button" onClick={() => { setSel({ kind: 'node', id: n.id }); setTab('thing'); viewRef.current?.focus(n.x, n.y, n.z); }} className={`w-full text-left rounded-[var(--radius-md)] border px-3 py-2 text-[14px] ${sel?.id === n.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'} bg-[var(--color-surface)]`} data-testid="mm3-list-item">
          <span style={{ color: n.color }}>●</span> {n.symbol} {n.text || L('Ohne Namen', 'Unnamed')}
          <span className="text-[12px] text-[var(--color-text-muted)]"> · {layerName(n.layerId) || `${L('Höhe', 'height')} ${n.y}`}</span>
        </button>
      ))}
    </div>
  );

  const tabs: { id: Tab; icon: typeof Box; de: string; en: string }[] = [
    { id: 'thing', icon: Box, de: 'Ding', en: 'Thing' },
    { id: 'layers', icon: Layers, de: 'Ebenen', en: 'Layers' },
    { id: 'list', icon: List, de: 'Liste', en: 'List' },
    { id: 'view', icon: Settings2, de: 'Ansicht', en: 'View' },
  ];

  return (
    <div className="fixed inset-0 z-[150] no-print select-none flex flex-col" style={{ background: 'var(--color-bg)' }} data-testid="mindmap3d-editor">
      <div className="relative flex-1 min-h-0">
        <div ref={hostRef} className="absolute inset-0" data-testid="mm3-host" />
        {!gl && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-[14px] text-[var(--color-text-muted)]" data-testid="mm3-nogl">
            {L('Dieses Gerät oder dieser Browser kann gerade kein 3D zeigen. Alles bleibt gespeichert – über „Liste“ und „Ebenen“ kannst du trotzdem arbeiten.', 'This device or browser cannot show 3D right now. Everything stays saved – you can still work through “List” and “Layers”.')}
          </div>
        )}
        <div className="absolute left-0 right-0 top-0 flex items-center gap-2 px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
          <button type="button" onClick={goBackNow} aria-label={fromDiary ? L('Zurück zum Tagebucheintrag', 'Back to the diary entry') : L('Zurück', 'Back')} className={ctlBtn} data-testid="mm3-back"><ChevronLeft size={20} /></button>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); titleRef.current = e.target.value; schedule(); }}
            placeholder={L('Titel der 3D-Mindmap', 'Title of the 3D mind map')}
            aria-label={L('Titel', 'Title')}
            data-testid="mm3-title"
            className="flex-1 min-w-0 h-10 rounded-full px-4 text-[15px] outline-none bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)]"
          />
          <button type="button" onClick={undo} disabled={!past.current.length} aria-label={L('Rückgängig', 'Undo')} className={ctlBtn} data-testid="mm3-undo"><Undo2 size={17} /></button>
          <button type="button" onClick={redo} disabled={!future.current.length} aria-label={L('Wiederholen', 'Redo')} className={ctlBtn} data-testid="mm3-redo"><Redo2 size={17} /></button>
          <HelpButton helpKey="mindmap3d" />
        </div>
        {fromDiary && (
          <button type="button" onClick={goBackNow} className="absolute left-3 z-10 px-3.5 py-2 rounded-full text-[13px] font-medium shadow-md" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 54px)', background: 'var(--color-primary)', color: 'var(--color-surface)' }} data-testid="mm3-back-diary">
            ← {L('Zurück zum Tagebucheintrag', 'Back to the diary entry')}
          </button>
        )}
        {/* Bewegen: Fläche / Höhe + Zoom */}
        <div className="absolute right-3 flex flex-col gap-2 items-end" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }}>
          <div className="flex rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-1" role="group" aria-label={L('Beim Ziehen bewegen', 'Dragging moves')}>
            <button type="button" onClick={() => setDragMode('plane')} className={`px-3 h-8 rounded-full text-[12.5px] flex items-center gap-1 ${dragMode === 'plane' ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'}`} data-testid="mm3-drag-plane"><Move size={13} />{L('Fläche', 'Floor')}</button>
            <button type="button" onClick={() => setDragMode('height')} className={`px-3 h-8 rounded-full text-[12.5px] flex items-center gap-1 ${dragMode === 'height' ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'}`} data-testid="mm3-drag-height"><MoveVertical size={13} />{L('Höhe', 'Height')}</button>
          </div>
          <button type="button" onClick={() => viewRef.current?.zoom(0.8)} className={ctlBtn} aria-label={L('Näher', 'Zoom in')} data-testid="mm3-zoom-in"><Plus size={18} /></button>
          <button type="button" onClick={() => viewRef.current?.zoom(1.25)} className={ctlBtn} aria-label={L('Weiter weg', 'Zoom out')} data-testid="mm3-zoom-out"><Minus size={18} /></button>
          <button type="button" onClick={() => viewRef.current?.fitAll()} className={ctlBtn} aria-label={L('Alles im Blick', 'Show everything')}><Maximize2 size={16} /></button>
        </div>
        {connectFrom && (
          <div className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)] shadow-md flex items-center gap-2 pointer-events-none" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 100px)' }} data-testid="mm3-connect-hint">
            {L('Tippe das Ding an, mit dem verbunden werden soll', 'Tap the thing to link to')}
            <button type="button" className="pointer-events-auto" onClick={() => setConnectFrom(null)} aria-label={L('Abbrechen', 'Cancel')}><Unlink size={14} /></button>
          </div>
        )}
        {toast && <div className="absolute left-1/2 -translate-x-1/2 bottom-3 px-4 py-2 rounded-full text-[13px] bg-[var(--color-text)] text-[var(--color-surface)] shadow-md pointer-events-none" data-testid="mm3-toast">{toast}</div>}
        <div className="absolute left-3 bottom-3 flex gap-2">
          <button type="button" onClick={() => addThing()} className="h-11 px-4 rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] shadow-md flex items-center gap-1.5 text-[14px] font-medium" data-testid="mm3-add"><Plus size={17} />{L('Ding', 'Thing')}</button>
          <button type="button" onClick={() => void takePhoto()} className={`${ctlBtn} !w-11 !h-11`} aria-label={L('Bild speichern', 'Save picture')} data-testid="mm3-snapshot"><Camera size={18} /></button>
        </div>
      </div>

      {/* Werkzeugleiste + Fläche zum Bearbeiten */}
      <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center gap-1 px-2 pt-1.5">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setPanelOpen(true); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-md)] text-[13px] ${tab === t.id && panelOpen ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm3-tab-${t.id}`}>
              <t.icon size={15} />{L(t.de, t.en)}
            </button>
          ))}
          <button type="button" onClick={() => setPanelOpen((v) => !v)} className="px-3 py-2 text-[12px] text-[var(--color-text-muted)]" aria-label={panelOpen ? L('Einklappen', 'Collapse') : L('Aufklappen', 'Expand')} data-testid="mm3-panel-toggle">{panelOpen ? '▾' : '▴'}</button>
        </div>
        {panelOpen && (
          <div className="px-4 py-3 max-h-[40vh] overflow-y-auto" data-testid="mm3-panel">
            {tab === 'thing' && thingPanel()}
            {tab === 'layers' && layersPanel()}
            {tab === 'view' && viewPanel()}
            {tab === 'list' && listPanel()}
          </div>
        )}
      </div>
    </div>
  );
}
