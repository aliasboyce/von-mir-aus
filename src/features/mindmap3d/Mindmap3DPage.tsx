import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Camera, ChevronLeft, Eye, Layers, List, Maximize2, Minus, Move, MoveVertical, Plus, PlusCircle, Redo2, Save, Settings2, Undo2, Unlink, X,
} from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { goBack } from '../../services/navigation';
import { deliverImage, stamp } from '../../services/snapshot';
import { createId } from '../../services/storage/repository';
import { mindmapRepo, type MindMap } from '../mindmap/mindmapModel';
import { useL } from '../projects/useL';
import {
  COLORS3D, bgInfo, isFlat, newEdge3, newLayer3, newNode3, sanitizeSpace,
  type BgId, type Edge3D, type Layer3D, type Node3D, type Shape3D, type Shot3D, type Space3D, type Version3D,
} from './space3dModel';
import { SpaceView, webglAvailable, type Cam, type DragMode, type Locks } from './spaceView';
import { ControlDock, type Dir, type DockMode } from './ControlDock';
import { AddPanel, LayersPanel, ListPanel, SavesPanel, ThingPanel, ViewPanel, type PanelCtx, type Sel, type SubTab } from './panels3d';
import { fileToSmallImage } from './mm3Media';
import { deleteVersion, saveVersion, versionsOf } from './mm3Versions';
import { shareMindmap3dPdf } from './mindmap3dPdf';

type Tab = 'thing' | 'add' | 'layers' | 'view' | 'list' | 'saves';

const ctlBtn = 'w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40';
const r1 = (v: number) => Math.round(v * 100) / 100;
const DOCK_KEY = 'innerpath:mm3-dock';

export default function Mindmap3DPage({ initial }: { initial: MindMap }) {
  const { L, lang } = useL();
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);
  const locState = useLocation().state as { fromDiary?: string; converted?: number } | null;
  const fromDiary = locState?.fromDiary;
  const convertedSkipped = locState?.converted;
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
  const [onlyLayer, setOnlyLayer] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('thing');
  const [sub, setSub] = useState<SubTab>('look');
  const [panelOpen, setPanelOpen] = useState(true);
  const [dragMode, setDragMode] = useState<DragMode>('plane');
  const [dockOpen, setDockOpenState] = useState(() => { try { return window.localStorage.getItem(DOCK_KEY) !== '0'; } catch { return true; } });
  const [dockMode, setDockMode] = useState<DockMode>('turn');
  const [locks, setLocks] = useState<Locks>({ rotate: false, zoom: false, pan: false });
  const [freeOrbit, setFreeOrbit] = useState(false);
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState<Version3D | null>(null);
  const [versions, setVersions] = useState<Version3D[]>(() => versionsOf(initial.id));
  const [stateName, setStateName] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const past = useRef<Space3D[]>([]);
  const future = useRef<Space3D[]>([]);
  const [, bump] = useState(0);
  const lastUndo = useRef({ key: '', t: 0 });
  const dirty = useRef(false);
  const thumbDirty = useRef(false);
  const saveTimer = useRef<number>(0);
  const thumbTimer = useRef<number>(0);
  const toastTimer = useRef<number>(0);
  const dragUndone = useRef(false);
  const warnedFull = useRef(false);
  const camBeforePreview = useRef<Cam | null>(null);
  const previewRef = useRef<Version3D | null>(null);
  previewRef.current = preview;
  const focusLayer = onlyLayer && selLayer ? selLayer : null;

  const say = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3400);
  }, []);
  const sayRef = useRef(say);
  sayRef.current = say;
  const LRef = useRef(L);
  LRef.current = L;

  useEffect(() => {
    if (convertedSkipped) say(L(`Kopie als 3D-Raum angelegt. ${convertedSkipped} Rahmen/Zeichnungen wurden nicht übernommen – die Fläche behält sie.`, `Copy made as a 3D space. ${convertedSkipped} frames/drawings were not carried over – the flat map keeps them.`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDockOpen = (v: boolean) => {
    setDockOpenState(v);
    try { window.localStorage.setItem(DOCK_KEY, v ? '1' : '0'); } catch { /* ohne Speicher */ }
  };

  /* ------------------------------------------------------------- saving */
  const writeNow = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    if (!dirty.current) return;
    dirty.current = false;
    const base = mindmapRepo.getById(initial.id) ?? initial;
    const ok = mindmapRepo.trySave({
      ...base, kind: '3d', title: titleRef.current, space: { ...spaceRef.current, cam: camRef.current },
      thumb: thumbRef.current, updatedAt: new Date().toISOString(),
    });
    if (!ok && !warnedFull.current) {
      warnedFull.current = true;
      sayRef.current(LRef.current('Speichern geht gerade nicht – der Speicher dieses Geräts ist voll. Alte Fotos oder Stände zu löschen schafft Platz.', 'Saving is not possible right now – this device’s storage is full. Deleting old pictures or states makes room.'));
    }
  }, [initial]);
  const schedule = useCallback(() => {
    dirty.current = true;
    thumbDirty.current = true;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(writeNow, 450);
    window.clearTimeout(thumbTimer.current);
    thumbTimer.current = window.setTimeout(() => {
      if (previewRef.current) return;
      const url = viewRef.current?.snapshotFit(1100, 800, 0.8);
      if (url) { thumbRef.current = url; thumbDirty.current = false; dirty.current = true; writeNow(); }
    }, 1800);
  }, [writeNow]);
  const flush = useCallback((withThumb: boolean) => {
    window.clearTimeout(thumbTimer.current);
    if (withThumb && !previewRef.current && (thumbDirty.current || !thumbRef.current)) {
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
    if (previewRef.current) return;
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
        onPickEdge: (id) => { if (previewRef.current) return; setConnectFrom(null); setSel({ kind: 'edge', id }); setTab('thing'); setPanelOpen(true); },
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
    const shown = preview ? sanitizeSpace(preview.space, lang) : space;
    viewRef.current?.update(shown, {
      selNode: !preview && sel?.kind === 'node' ? sel.id : null,
      selEdge: !preview && sel?.kind === 'edge' ? sel.id : null,
      selLayer, connectFrom, focusLayer, readOnly: !!preview,
    });
  }, [space, sel, selLayer, connectFrom, focusLayer, preview, lang]);
  useEffect(() => { viewRef.current?.setDragMode(dragMode); }, [dragMode]);
  useEffect(() => { viewRef.current?.setLocks(locks); }, [locks]);
  useEffect(() => { viewRef.current?.setOneFinger(dockMode === 'move' ? 'pan' : 'turn'); }, [dockMode]);
  useEffect(() => { viewRef.current?.setFreeOrbit(freeOrbit); }, [freeOrbit]);
  useEffect(() => {
    const onHide = () => flush(false);
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flush]);

  /* ---------------------------------------------------------------- items */
  const node = sel?.kind === 'node' && !preview ? space.nodes.find((n) => n.id === sel.id) : undefined;
  const edge = sel?.kind === 'edge' && !preview ? space.edges.find((e) => e.id === sel.id) : undefined;
  const otherMaps = useMemo(() => mindmapRepo.getAll().filter((m) => m.id !== initial.id && !m.archived), [initial.id]);

  const snapY = (y: number): { y: number; layerId?: string } => {
    for (const l of spaceRef.current.layers) if (Math.abs(l.y - y) < 0.55) return { y: l.y, layerId: l.id };
    return { y };
  };
  const SHAPE_DEFAULT: Partial<Record<Shape3D, { text: string; color: string }>> = {
    bubble: { text: L('Hallo!', 'Hello!'), color: '#f4f1ea' },
    thought: { text: L('Hmm …', 'Hmm …'), color: '#cfe3f3' },
    shout: { text: L('Achtung!', 'Look out!'), color: '#f2d16b' },
    note: { text: L('Notiz', 'Note'), color: '#f2d16b' },
    photo: { text: '', color: '#f4f1ea' },
  };
  function addThing(shape: Shape3D = 'sphere', extra: Partial<Node3D> = {}) {
    const t = viewRef.current?.target() ?? { x: 0, y: 0, z: 0 };
    const lay = selLayer ? spaceRef.current.layers.find((l) => l.id === selLayer) : undefined;
    const base = lay ? { y: lay.y, layerId: lay.id } : snapY(t.y);
    const spot = freeSpot(t.x, t.z, base.y);
    const d = SHAPE_DEFAULT[shape];
    const textColor = bgInfo(spaceRef.current).dark ? '#f4f1ea' : '#2b2a28';
    const n = newNode3({
      text: d?.text ?? L('Neu', 'New'),
      shape,
      color: shape === 'text' ? textColor : d?.color ?? COLORS3D[spaceRef.current.nodes.length % COLORS3D.length],
      x: spot.x, z: spot.z, ...base, ...extra,
    });
    mutate((s) => ({ ...s, nodes: [...s.nodes, n] }));
    setSel({ kind: 'node', id: n.id });
    setTab('thing');
    setSub('look');
    setPanelOpen(true);
    return n;
  }
  /** ein freier Platz in der Nähe der Bildmitte – neue Dinge stapeln sich nicht aufeinander */
  function freeSpot(cx: number, cz: number, y: number) {
    const near = spaceRef.current.nodes.filter((n) => Math.abs(n.y - y) < 1.6);
    const free = (x: number, z: number) => near.every((n) => Math.hypot(n.x - x, n.z - z) > 2.6);
    for (const ring of [0, 3, 5.5, 8, 11]) {
      const steps = ring === 0 ? 1 : Math.round(ring * 2.2);
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2 + ring * 0.7;
        const x = r1(cx + Math.cos(a) * ring);
        const z = r1(cz + Math.sin(a) * ring);
        if (free(x, z)) return { x, z };
      }
    }
    return { x: r1(cx + (Math.random() - 0.5) * 6), z: r1(cz + (Math.random() - 0.5) * 6) };
  }
  function addChild() {
    if (!node) return;
    const dir = viewRef.current?.axisDir('right') ?? { x: 1, z: 0 };
    const off = 3.2 + nodeSpan(node);
    const c = newNode3({
      text: L('Neu', 'New'), shape: isFlat(node.shape) ? 'sphere' : node.shape, color: node.color, size: Math.max(1, (node.size || 2) - 0.5),
      x: r1(node.x + dir.x * off + (dir.x ? 0 : 0.8)), z: r1(node.z + dir.z * off + (dir.z ? 0 : 0.8)), y: node.y, layerId: node.layerId,
    });
    const e = newEdge3(node.id, c.id);
    mutate((s) => ({ ...s, nodes: [...s.nodes, c], edges: [...s.edges, e] }));
    setSel({ kind: 'node', id: c.id });
    setSub('look');
  }
  function nodeSpan(n: Node3D) { return 0.45 + 0.25 * (n.size || 2); }
  async function addPhoto(file: File) {
    const img = await fileToSmallImage(file, 640, 0.78);
    if (!img) { say(L('Dieses Bild ließ sich nicht öffnen.', 'This picture could not be opened.')); return; }
    addThing('photo', { image: img.dataUrl, ar: img.ar, text: '' });
  }
  async function setNodePhoto(id: string, file: File) {
    const img = await fileToSmallImage(file, 640, 0.78);
    if (!img) { say(L('Dieses Bild ließ sich nicht öffnen.', 'This picture could not be opened.')); return; }
    setNode(id, { image: img.dataUrl, ar: img.ar, shape: 'photo' });
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
      if (focusLayer) { say(L('Du baust nur auf einer Ebene – „Nur auf dieser Ebene bauen“ ausschalten, um die Höhe zu ändern.', 'You are building on one layer only – switch “Build only on this layer” off to change the height.')); return; }
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
  function chooseLayer(id: string | null) {
    setSelLayer(id);
    if (!id) setOnlyLayer(false);
  }
  function toggleOnly(v: boolean) {
    setOnlyLayer(v);
    if (v && selLayer) {
      const l = spaceRef.current.layers.find((x) => x.id === selLayer);
      if (l) viewRef.current?.goTo({ ty: l.y, phi: 0.75 });
      say(L('Du baust jetzt nur auf dieser Ebene.', 'You are building on this layer only.'));
    }
  }

  /* ---------------------------------------------------------- Steuerkreuz */
  const anyLocked = locks.rotate || locks.zoom || locks.pan;
  const toggleLockAll = () => setLocks(anyLocked ? { rotate: false, zoom: false, pan: false } : { rotate: true, zoom: true, pan: true });
  function arrow(d: Dir) {
    const v = viewRef.current;
    if (!v || preview && dockMode === 'thing') return;
    const sx = d === 'r' ? 1 : d === 'l' ? -1 : 0;
    const sy = d === 'd' ? 1 : d === 'u' ? -1 : 0;
    if (dockMode === 'turn') {
      if (!locks.rotate) v.turnSnap(sx, sy);
    } else if (dockMode === 'move') {
      if (locks.pan) return;
      const step = Math.min(4, Math.max(0.6, v.getCam().dist * 0.08));
      v.moveFocus(sx * step, -sy * step, 0);
    } else if (node) {
      const right = v.axisDir('right');
      const fwd = v.axisDir('forward');
      const f = -sy; // oben = in den Raum hinein
      const step = 0.5;
      const snap = (x: number) => Math.round(x * 2) / 2;
      setNode(node.id, { x: snap(node.x + right.x * sx * step + fwd.x * f * step), z: snap(node.z + right.z * sx * step + fwd.z * f * step) }, `pad-${node.id}`);
    }
  }
  function side(d: 'up' | 'down') {
    const v = viewRef.current;
    if (!v) return;
    if (dockMode === 'turn') {
      if (!locks.zoom) v.zoom(d === 'up' ? 0.8 : 1.25);
    } else if (dockMode === 'move') {
      if (locks.pan) return;
      v.moveFocus(0, 0, (d === 'up' ? 1 : -1) * Math.min(3, Math.max(0.6, v.getCam().dist * 0.06)));
    } else if (node && !preview) nudge(node, 0, d === 'up' ? 1 : -1, 0);
  }
  function center() {
    if (dockMode === 'thing' && node) viewRef.current?.focus(node.x, node.y, node.z);
    else viewRef.current?.fitAll();
  }
  const act = useRef({ undo, redo, arrow, side, removeNode });
  act.current = { undo, redo, arrow, side, removeNode };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) act.current.redo(); else act.current.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); act.current.redo(); return; }
      const dirs: Record<string, Dir> = { arrowleft: 'l', arrowright: 'r', arrowup: 'u', arrowdown: 'd' };
      if (dirs[k]) { e.preventDefault(); act.current.arrow(dirs[k]); return; }
      if (k === 'pageup') { e.preventDefault(); act.current.side('up'); return; }
      if (k === 'pagedown') { e.preventDefault(); act.current.side('down'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ------------------------------------------------------ Ansicht & Fotos */
  function goView(p: { theta?: number; phi?: number }) { viewRef.current?.goTo(p); }
  function setBg(id: BgId) { mutate((s) => ({ ...s, bg: id })); }
  async function pickBgImage(file: File) {
    const img = await fileToSmallImage(file, 1400, 0.72);
    if (!img) { say(L('Dieses Bild ließ sich nicht öffnen. Als Hintergrund gehen Bilddateien (Foto, Screenshot, Grafik).', 'This picture could not be opened. Image files work as a background (photo, screenshot, graphic).')); return; }
    mutate((s) => ({ ...s, bg: 'photo', bgImage: img.dataUrl, bgTone: img.tone }));
    say(L('Dein Foto ist jetzt der Hintergrund.', 'Your photo is now the background.'));
  }
  function takeShot() {
    const v = viewRef.current;
    if (!v) return;
    const url = v.snapshotClean(720);
    if (!url) { say(L('Das Foto ließ sich auf diesem Gerät nicht erstellen.', 'The picture could not be made on this device.')); return; }
    const n = (spaceRef.current.shots?.length ?? 0) + 1;
    const shot: Shot3D = { id: createId('sh'), at: new Date().toISOString(), name: L(`Ansicht ${n}`, `View ${n}`), img: url, cam: v.getCam() };
    mutate((s) => ({ ...s, shots: [...(s.shots ?? []), shot].slice(-24) }), false);
    say(L('Foto gespeichert – du findest es unter „Ansicht“.', 'Picture saved – you find it under “View”.'));
  }
  function openShot(s: Shot3D) { viewRef.current?.goTo(s.cam, 420); }
  function renameShot(id: string, name: string) {
    mutate((s) => ({ ...s, shots: (s.shots ?? []).map((x) => (x.id === id ? { ...x, name } : x)) }), false);
  }
  function deleteShot(id: string) { mutate((s) => ({ ...s, shots: (s.shots ?? []).filter((x) => x.id !== id) }), false); }
  async function downloadShot(s: Shot3D) {
    const blob = await (await fetch(s.img)).blob();
    const r = await deliverImage(blob, `${(title || '3D').replace(/[^\p{L}\p{N}_-]+/gu, '_')}-${(s.name || 'foto').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.jpg`, s.name || title || '3D');
    if (r === 'shared') say(L('Bild ist bereit – im Teilen-Menü sichern.', 'Picture ready – save it from the share menu.'));
    else if (r === 'downloaded') say(L('Bild wurde in deinen Downloads gespeichert.', 'Picture saved to your downloads.'));
  }
  async function downloadPng() {
    flush(false);
    const url = viewRef.current?.snapshot(1800, 'image/png');
    if (!url) { say(L('Das Bild ließ sich auf diesem Gerät nicht erstellen.', 'The picture could not be made on this device.')); return; }
    const blob = await (await fetch(url)).blob();
    const r = await deliverImage(blob, `${(title || '3D').replace(/[^\p{L}\p{N}_-]+/gu, '_')}-${stamp()}.png`, title || '3D');
    if (r === 'shared') say(L('Bild ist bereit – im Teilen-Menü sichern.', 'Picture ready – save it from the share menu.'));
    else if (r === 'downloaded') say(L('Bild wurde in deinen Downloads gespeichert.', 'Picture saved to your downloads.'));
  }
  async function sharePdf() {
    setPdfBusy(true);
    try {
      flush(false);
      const overview = viewRef.current?.snapshotFit(1500, 1050, 0.86) ?? thumbRef.current ?? null;
      const r = await shareMindmap3dPdf(initial.id, titleRef.current, spaceRef.current, versionsOf(initial.id), { overview, shots: true, versions: true, details: true }, lang);
      if (r === 'shared') say(L('PDF ist bereit – im Teilen-Menü sichern.', 'PDF ready – save it from the share menu.'));
      else if (r === 'downloaded') say(L('PDF wurde in deinen Downloads gespeichert.', 'PDF saved to your downloads.'));
      else if (r === 'failed') say(L('Das PDF ließ sich nicht erstellen.', 'The PDF could not be made.'));
    } catch {
      say(L('Das PDF ließ sich nicht erstellen.', 'The PDF could not be made.'));
    } finally {
      setPdfBusy(false);
    }
  }

  /* ------------------------------------------------------------- Stände */
  const refreshVersions = () => setVersions(versionsOf(initial.id));
  function holdState(name: string) {
    flush(false);
    const v = viewRef.current;
    const thumb = v?.snapshotFit(480, 340, 0.7) ?? undefined;
    const nm = name.trim() || L(`Stand ${new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`, `State ${new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`);
    const r = saveVersion(initial.id, nm, spaceRef.current, thumb);
    refreshVersions();
    setStateName('');
    if (!r.ok) say(L('Der Stand ließ sich nicht festhalten – der Speicher ist voll. Ältere Stände oder Fotos löschen schafft Platz.', 'The state could not be kept – storage is full. Deleting older states or pictures makes room.'));
    else say(r.dropped ? L('Festgehalten. (Der älteste Stand wurde ersetzt – es bleiben 30.)', 'Kept. (The oldest state was replaced – 30 stay.)') : L('Stand festgehalten – du kannst jetzt ruhig weiterbauen.', 'State kept – go ahead and keep building.'));
  }
  function previewVersion(v: Version3D) {
    if (!previewRef.current) camBeforePreview.current = viewRef.current?.getCam() ?? null;
    setSel(null);
    setConnectFrom(null);
    setPreview(v);
    viewRef.current?.goTo(sanitizeSpace(v.space, lang).cam, 0);
  }
  function exitPreview() {
    setPreview(null);
    if (camBeforePreview.current) viewRef.current?.goTo(camBeforePreview.current, 0);
  }
  function restoreVersion(v: Version3D) {
    if (!window.confirm(L('Diesen Stand zurückholen? Den jetzigen Stand halte ich vorher automatisch fest.', 'Bring this state back? I keep the current one first, automatically.'))) return;
    flush(false);
    saveVersion(initial.id, L('Vor dem Zurückholen', 'Before bringing back'), spaceRef.current, viewRef.current?.snapshotFit(480, 340, 0.7) ?? undefined);
    const keepShots = spaceRef.current.shots;
    mutate(() => ({ ...sanitizeSpace(v.space, lang), shots: keepShots }));
    setPreview(null);
    refreshVersions();
    viewRef.current?.goTo(sanitizeSpace(v.space, lang).cam, 0);
    say(L('Der Stand ist zurück. Mit „Rückgängig“ oder unter „Stände“ kommst du wieder zum vorherigen.', 'The state is back. With “Undo” or under “States” you can return to the previous one.'));
  }
  function copyVersion(v: Version3D) {
    const base = mindmapRepo.getById(initial.id) ?? initial;
    const now = new Date().toISOString();
    const copy: MindMap = {
      ...base, id: createId('mm'), title: `${titleRef.current || '3D'} · ${v.name}`, createdAt: now, updatedAt: now, kind: '3d',
      space: { ...sanitizeSpace(v.space, lang), shots: undefined }, thumb: v.thumb, nodes: [], edges: [], parentId: undefined, archived: undefined, archivedAt: undefined,
    };
    const ok = mindmapRepo.trySave(copy);
    say(ok ? L('Kopie angelegt – du findest sie in der Mindmap-Liste.', 'Copy created – you find it in the mind map list.') : L('Die Kopie ließ sich nicht speichern – der Speicher ist voll.', 'The copy could not be saved – storage is full.'));
  }
  function removeVersion(v: Version3D) {
    if (!window.confirm(L('Diesen festgehaltenen Stand löschen?', 'Delete this kept state?'))) return;
    deleteVersion(v.id);
    if (previewRef.current?.id === v.id) exitPreview();
    refreshVersions();
  }

  const goBackNow = () => {
    flush(true);
    if (fromDiary) navigate(`/sicherheit/tagebuch?entry=${fromDiary}`, { replace: true });
    else goBack(navigate, '/entdecken/mindmap');
  };

  /* ---------------------------------------------------------------- panels */
  const ctx: PanelCtx = {
    L, lang, space, node, edge, sel, sub, setSub, selLayer, setSelLayer: chooseLayer, onlyLayer: !!focusLayer, setOnlyLayer: toggleOnly,
    connectFrom, setConnectFrom, locks, setLocks, freeOrbit, setFreeOrbit, setNode, setEdge, setLayer, mutate, setSel, setTab,
    addThing: (s, x) => { addThing(s, x); }, addChild, addPhoto: (f) => void addPhoto(f), setNodePhoto: (id, f) => void setNodePhoto(id, f), removeNode, duplicateNode, nudge,
    addLayer, moveLayer, removeLayer, focusNode: (n) => viewRef.current?.focus(n.x, n.y, n.z), goView, fitAll: () => viewRef.current?.fitAll(),
    otherMaps, openMap: (id) => { flush(true); navigate(`/entdecken/mindmap/${id}`); },
    setBg, pickBgImage: (f) => void pickBgImage(f), takeShot, openShot, renameShot, deleteShot, downloadShot: (s) => void downloadShot(s),
    downloadPng: () => void downloadPng(), sharePdf: () => void sharePdf(), pdfBusy,
    versions, holdState, previewVersion, restoreVersion, copyVersion, removeVersion, previewId: preview?.id ?? null, stateName, setStateName,
  };

  const tabs: { id: Tab; icon: typeof Box; de: string; en: string }[] = [
    { id: 'thing', icon: Box, de: 'Ding', en: 'Thing' },
    { id: 'add', icon: PlusCircle, de: 'Neu', en: 'New' },
    { id: 'layers', icon: Layers, de: 'Ebenen', en: 'Layers' },
    { id: 'list', icon: List, de: 'Liste', en: 'List' },
    { id: 'view', icon: Settings2, de: 'Ansicht', en: 'View' },
    { id: 'saves', icon: Save, de: 'Stände', en: 'States' },
  ];
  const activeLayerName = focusLayer ? space.layers.find((l) => l.id === focusLayer)?.name : '';

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
          <button type="button" onClick={undo} disabled={!past.current.length || !!preview} aria-label={L('Rückgängig', 'Undo')} className={ctlBtn} data-testid="mm3-undo"><Undo2 size={17} /></button>
          <button type="button" onClick={redo} disabled={!future.current.length || !!preview} aria-label={L('Wiederholen', 'Redo')} className={ctlBtn} data-testid="mm3-redo"><Redo2 size={17} /></button>
          <HelpButton helpKey="mindmap3d" />
        </div>

        {/* Hinweise oben links: Zustand der Ansicht, nur-eine-Ebene, früherer Stand */}
        <div className="absolute left-3 flex flex-col items-start gap-1.5 max-w-[calc(100%-84px)]" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 52px)' }}>
          {fromDiary && (
            <button type="button" onClick={goBackNow} className="px-3.5 py-2 rounded-full text-[13px] font-medium shadow-md" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }} data-testid="mm3-back-diary">
              ← {L('Zurück zum Tagebucheintrag', 'Back to the diary entry')}
            </button>
          )}
          {anyLocked && (
            <button type="button" onClick={toggleLockAll} className="px-3 py-1.5 rounded-full text-[12.5px] bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]" data-testid="mm3-lock-badge">
              🔒 {locks.rotate && locks.zoom && locks.pan ? L('Ansicht eingerastet', 'View locked') : L('Teile der Ansicht gesperrt', 'Part of the view locked')} · {L('antippen = lösen', 'tap to release')}
            </button>
          )}
          {focusLayer && (
            <button type="button" onClick={() => toggleOnly(false)} className="px-3 py-1.5 rounded-full text-[12.5px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] shadow-[var(--shadow-sm)] flex items-center gap-1.5" data-testid="mm3-only-badge">
              <Layers size={13} />{L(`Baut nur auf „${activeLayerName}“`, `Building only on “${activeLayerName}”`)}<X size={13} />
            </button>
          )}
        </div>
        {preview && (
          <div className="absolute left-3 right-3 rounded-[16px] bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-md p-3 flex flex-col gap-2" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }} data-testid="mm3-preview-banner">
            <p className="text-[13px] text-[var(--color-text)]">👁 {L('Du siehst einen früheren Stand:', 'You are viewing an earlier state:')} <b>{preview.name}</b> <span className="text-[var(--color-text-muted)]">· {L('nur ansehen, nichts wird verändert', 'view only, nothing changes')}</span></p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-3 py-1.5 rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] text-[13px]" onClick={exitPreview} data-testid="mm3-preview-exit">{L('Zurück zur Arbeit', 'Back to my work')}</button>
              <button type="button" className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[13px] text-[var(--color-text-muted)]" onClick={() => restoreVersion(preview)} data-testid="mm3-preview-restore">{L('Zurückholen', 'Bring back')}</button>
              <button type="button" className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[13px] text-[var(--color-text-muted)]" onClick={() => copyVersion(preview)} data-testid="mm3-preview-copy">{L('Als Kopie', 'As copy')}</button>
            </div>
          </div>
        )}

        {/* rechts oben: Ziehen-Art + Zoom */}
        <div className="absolute right-3 flex flex-col gap-2 items-end" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }}>
          {!preview && (
            <div className={`flex rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-1 ${focusLayer ? 'opacity-60' : ''}`} role="group" aria-label={L('Ein Ding ziehen: auf der Fläche oder in der Höhe', 'Dragging a thing: on the floor or in height')}>
              <button type="button" onClick={() => setDragMode('plane')} className={`px-3 h-8 rounded-full text-[12.5px] flex items-center gap-1 ${dragMode === 'plane' || focusLayer ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'}`} data-testid="mm3-drag-plane"><Move size={13} />{L('Fläche', 'Floor')}</button>
              <button type="button" disabled={!!focusLayer} onClick={() => setDragMode('height')} className={`px-3 h-8 rounded-full text-[12.5px] flex items-center gap-1 ${dragMode === 'height' && !focusLayer ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'}`} data-testid="mm3-drag-height"><MoveVertical size={13} />{L('Höhe', 'Height')}</button>
            </div>
          )}
        </div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button type="button" onClick={() => viewRef.current?.zoom(0.8)} disabled={locks.zoom} className={ctlBtn} aria-label={L('Näher', 'Zoom in')} data-testid="mm3-zoom-in"><Plus size={18} /></button>
          <button type="button" onClick={() => viewRef.current?.zoom(1.25)} disabled={locks.zoom} className={ctlBtn} aria-label={L('Weiter weg', 'Zoom out')} data-testid="mm3-zoom-out"><Minus size={18} /></button>
          <button type="button" onClick={() => viewRef.current?.fitAll()} disabled={locks.pan} className={ctlBtn} aria-label={L('Alles im Blick', 'Show everything')} data-testid="mm3-fit-btn"><Maximize2 size={16} /></button>
        </div>
        {connectFrom && (
          <div className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)] shadow-md flex items-center gap-2 pointer-events-none" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 100px)' }} data-testid="mm3-connect-hint">
            {L('Tippe das Ding an, mit dem verbunden werden soll', 'Tap the thing to link to')}
            <button type="button" className="pointer-events-auto" onClick={() => setConnectFrom(null)} aria-label={L('Abbrechen', 'Cancel')}><Unlink size={14} /></button>
          </div>
        )}
        {toast && <div className="absolute left-1/2 -translate-x-1/2 bottom-3 max-w-[88%] text-center px-4 py-2 rounded-[18px] text-[13px] bg-[var(--color-text)] text-[var(--color-surface)] shadow-md pointer-events-none z-10" data-testid="mm3-toast">{toast}</div>}

        <div className="absolute left-3 bottom-3 flex flex-col gap-2 items-start">
          <button type="button" onClick={() => void takeShot()} className={`${ctlBtn} !w-11 !h-11`} aria-label={L('Foto aus diesem Blickwinkel speichern', 'Save a picture from this angle')} title={L('Foto aus diesem Blickwinkel speichern', 'Save a picture from this angle')} data-testid="mm3-snapshot"><Camera size={18} /></button>
          {!preview && <button type="button" onClick={() => addThing()} className="h-11 px-4 rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] shadow-md flex items-center gap-1.5 text-[14px] font-medium" data-testid="mm3-add"><Plus size={17} />{L('Ding', 'Thing')}</button>}
        </div>
        <div className="absolute right-3 bottom-3">
          <ControlDock
            L={L} open={dockOpen} setOpen={setDockOpen} mode={dockMode} setMode={setDockMode} locks={locks} onLockAll={toggleLockAll}
            thingOk={!!node && !preview} heightOk={!focusLayer} onArrow={arrow} onSide={side} onCenter={center}
          />
        </div>
      </div>

      {/* Werkzeugleiste + Fläche zum Bearbeiten */}
      <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center gap-0.5 px-1.5 pt-1.5">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setPanelOpen(true); }} className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-[var(--radius-md)] text-[10.5px] ${tab === t.id && panelOpen ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm3-tab-${t.id}`}>
              <t.icon size={16} /><span className="truncate max-w-full">{L(t.de, t.en)}</span>
            </button>
          ))}
          <button type="button" onClick={() => setPanelOpen((v) => !v)} className="px-2.5 py-2 text-[12px] text-[var(--color-text-muted)]" aria-label={panelOpen ? L('Einklappen', 'Collapse') : L('Aufklappen', 'Expand')} data-testid="mm3-panel-toggle">{panelOpen ? '▾' : '▴'}</button>
        </div>
        {panelOpen && (
          <div className="px-4 py-3 max-h-[38vh] overflow-y-auto" data-testid="mm3-panel">
            {tab === 'thing' && (preview ? <p className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-1.5"><Eye size={14} />{L('Beim Ansehen eines früheren Standes lässt sich nichts bearbeiten.', 'Nothing can be edited while viewing an earlier state.')}</p> : <ThingPanel c={ctx} />)}
            {tab === 'add' && <AddPanel c={ctx} />}
            {tab === 'layers' && <LayersPanel c={ctx} />}
            {tab === 'view' && <ViewPanel c={ctx} />}
            {tab === 'list' && <ListPanel c={ctx} />}
            {tab === 'saves' && <SavesPanel c={ctx} />}
          </div>
        )}
      </div>
    </div>
  );
}
