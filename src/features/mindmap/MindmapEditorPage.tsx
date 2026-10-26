import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Archive, BoxSelect, Camera, Check, ChevronDown, ClipboardPaste, Smile, ChevronLeft, CornerDownRight, Copy, Ellipsis, ExternalLink, FileDown, FolderTree, Image as ImageIcon, Layers, Link2, Maximize, Minus, Palette, PenLine, Play, Pause, Plus, Redo2, Scissors, Share2, Shapes, SquareDashed, StickyNote, Spline, Trash2, Type, Undo2, Download, Users, Upload } from 'lucide-react';
import { useCamera } from '../../components/canvas/useCamera';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { Modal } from '../../components/ui/Modal';
import { goBack } from '../../services/navigation';
import { triggerPrint } from '../../services/printSupport';
import { playSound } from '../../services/sounds';
import { triggerHaptic } from '../../services/haptics';
import { shareOrCopy } from '../../services/shareOrCopy';
import { buildShareText } from '../../services/sharedLinks';
import { deliverTextFile } from '../../services/fileShare';
import { createId } from '../../services/storage/repository';
import { resizeImageFile, resizeImageKeepAlpha } from '../../services/imageResize';
import { fetchImageFile, fromAsyncClipboard, fromDataTransfer, imageUrlFromText, imageUrlsFromHtml, type ClipContent } from '../../services/clipboardImport';
import { EmojiPicker } from '../../components/shared/SymbolColorPicker';
import {
  BG_KINDS,
  BG_TONES,
  bgColor,
  bgCss,
  bgIsDark,
  edgeGeometry,
  encodeMap,
  ensureZ,
  eraseStroke,
  groupCentres as groupCentresOf,
  HEX_TONE,
  layoutNode,
  mapBounds,
  mindmapRepo,
  mixHex,
  moveLayers,
  newEdge,
  newMap,
  newNode,
  penWidth,
  simplifyPts,
  strokeNode,
  strokePath,
  toPayload,
  type LayerMove,
  type MMEdge,
  type MMNode,
  type MindMap,
} from './mindmapModel';
import { doodleOf } from './doodles';
import { BackgroundPattern, EdgeLabel, EdgeView, MapItems, NodeView, SceneDefs, SceneProvider, orderedItems, useMapLookup, useSceneUid } from './MindmapScene';
import { EdgeStyleSheet, NodeStyleSheet, tabsFor, type StyleActions, type StyleTab } from './MindmapPanels';
import { DoodlePickerModal, MapPickModal, NameModal, PenBar, type PenState } from './MindmapTools';
import { MindmapPrintView } from './MindmapPrintView';
import { mindmapPrintImages, mindmapSnapshotPng } from './mindmapSnapshot';
import { deliverImage, stamp } from '../../services/snapshot';
import { mindmapTexts } from './mindmapTexts';
import { fmt, xt } from './mindmapExtraTexts';
import { clipText, copyOf, getClip, instantiate, mapPartsFor, rotateNodes, scaleNodes, selectionBounds, setClip, withGroupMates } from './mindmapOps';

const NODE_COLORS = ['#6aa08a', '#4a8f9e', '#e8a83d', '#e07a5f', '#9a7bc4', '#d9778a', '#7a9e4a'];
const REGULAR_SHAPES = new Set(['rounded', 'pill', 'oval', 'circle', 'diamond', 'hexagon', 'cloud', 'note', 'plain', 'frame']);
type Sel = { kind: 'node' | 'edge'; id: string } | null;
type Tool = 'select' | 'connect' | 'multi' | 'draw';
interface Snap {
  title: string;
  bg: MindMap['bg'];
  nodes: MMNode[];
  edges: MMEdge[];
}
const snapOf = (m: MindMap): Snap => ({ title: m.title, bg: m.bg, nodes: m.nodes, edges: m.edges });
const rotPt = (n: { x: number; y: number; rot?: number }, lx: number, ly: number) => {
  const r = ((n.rot ?? 0) * Math.PI) / 180;
  return { x: n.x + lx * Math.cos(r) - ly * Math.sin(r), y: n.y + lx * Math.sin(r) + ly * Math.cos(r) };
};
const hasText = (n: MMNode) => n.shape !== 'draw' && (n.shape !== 'doodle' || !!doodleOf(n.doodle).text);

export function MindmapEditorPage() {
  const { id } = useParams();
  const T0 = mindmapTexts(useSettings().settings.language);
  const initial = useMemo(() => (id ? mindmapRepo.getById(id) : undefined), [id]);
  const navigate = useNavigate();
  if (!initial) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[15px] text-[var(--color-text-muted)] mb-4">{T0.notFound}</p>
        <button type="button" className="text-[var(--color-primary)] underline" onClick={() => navigate('/entdecken/mindmap', { replace: true })}>{T0.toList}</button>
      </div>
    );
  }
  return <Editor key={initial.id} initial={initial} />;
}

function Editor({ initial }: { initial: MindMap }) {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const T = mindmapTexts(lang);
  const X = xt(lang);
  const navigate = useNavigate();
  /** opened from a diary entry → one tap leads back to exactly that entry */
  const fromDiary = (useLocation().state as { fromDiary?: string } | null)?.fromDiary;
  const backToDiary = () => navigate(`/sicherheit/tagebuch?entry=${fromDiary}`, { replace: true });
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);

  const [map, setMap] = useState<MindMap>(initial);
  const mapRef = useRef(map);
  mapRef.current = map;
  const hist = useRef<{ past: Snap[]; future: Snap[]; lastKey: string; lastAt: number }>({ past: [], future: [], lastKey: '', lastAt: 0 });
  const [, bump] = useState(0);
  const saveTimer = useRef<number | undefined>(undefined);
  /** set when this map was deleted or archived: nothing may be written back any more */
  const goneRef = useRef(false);
  const [sel, setSel] = useState<Sel>(null);
  /** further selected nodes besides the main one */
  const [extra, setExtra] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const toolRef = useRef<Tool>('select');
  toolRef.current = tool;
  const [pen, setPen] = useState<PenState>({ kind: 'pen', color: '#26231f', sw: 4, erase: false, whole: false });
  const penRef = useRef(pen);
  penRef.current = pen;
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [tab, setTab] = useState<StyleTab>('shape');
  const [textEdit, setTextEdit] = useState<Sel>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [stickerPick, setStickerPick] = useState(false);
  const [doodleOpen, setDoodleOpen] = useState(false);
  const [mapPickOpen, setMapPickOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [newMapRemove, setNewMapRemove] = useState(false);
  const [newMapSub, setNewMapSub] = useState(true);
  const [pasteChoice, setPasteChoice] = useState<string | null>(null);
  const [animOn, setAnimOn] = useState(true);
  const photoInput = useRef<HTMLInputElement>(null);
  const bgPhotoInput = useRef<HTMLInputElement>(null);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState('');
  const [popIds, setPopIds] = useState<Set<string>>(new Set());
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const uid = useSceneUid();
  const resolveMap = useMapLookup();

  // --- drag state (live positions while something is moved / scaled / rotated) ---
  const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkDrag, setLinkDrag] = useState<{ from: string; x: number; y: number } | null>(null);
  const [bendDrag, setBendDrag] = useState<{ id: string; bend: number } | null>(null);
  const [resizeDrag, setResizeDrag] = useState<{ id: string; fw: number; fh: number } | null>(null);
  const [scaleDrag, setScaleDrag] = useState<{ id: string; sc: number } | null>(null);
  const [rotDrag, setRotDrag] = useState<{ id: string; rot: number } | null>(null);
  const [liveStroke, setLiveStroke] = useState<number[] | null>(null);
  const [eraserAt, setEraserAt] = useState<{ x: number; y: number; r: number } | null>(null);
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const lastBgTap = useRef({ t: 0, x: 0, y: 0 });
  const lastNodeTap = useRef({ t: 0, id: '' });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearSelection = () => {
    setSel(null);
    setExtra([]);
  };

  const onBgTap = useCallback(
    (cx: number, cy: number) => {
      const now = performance.now();
      const last = lastBgTap.current;
      const dbl = now - last.t < 380 && Math.hypot(cx - last.x, cy - last.y) < 30;
      lastBgTap.current = { t: now, x: cx, y: cy };
      setMenuOpen(false);
      if (dbl) {
        const p = camRef.current!.toWorld(cx, cy);
        addNodeAt(p.x, p.y);
        return;
      }
      clearSelection();
      setTextEdit(null);
      setStyleOpen(false);
      setTool('select');
      setConnectFrom(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const claimFn = useRef<((e: { clientX: number; clientY: number; shiftKey: boolean }) => import('../../components/canvas/useCamera').ClaimHandlers | null) | null>(null);
  const cam = useCamera(containerRef, { enabled: true, minScale: 0.12, maxScale: 4, initial: initial.view ?? { scale: 1, tx: 0, ty: 0 }, onBackgroundTap: onBgTap, claim: (e) => claimFn.current?.(e) ?? null });
  const camRef = useRef(cam);
  camRef.current = cam;
  const camStarted = useRef(false);
  useEffect(() => {
    if (camStarted.current || !box.w) return;
    camStarted.current = true;
    if (initial.view) return;
    if (initial.nodes.length) cam.fit(mapBounds(initial), 56);
    else cam.setView({ scale: 1, tx: box.w / 2, ty: box.h / 2 - 40 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w]);

  // ---- persistence ----
  const flush = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const m = mapRef.current;
    if (goneRef.current) return;
    mindmapRepo.save({ ...m, updatedAt: new Date().toISOString(), view: camRef.current?.view });
  }, []);
  const scheduleSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 350);
  }, [flush]);
  useEffect(() => () => flush(), [flush]);
  useEffect(() => {
    // keep the last camera position too (cheap): save once the user stops moving
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.view.scale, Math.round(cam.view.tx / 20), Math.round(cam.view.ty / 20)]);

  // ---- changes with history ----
  const commit = useCallback(
    (fn: (m: MindMap) => MindMap, key = '') => {
      const prev = mapRef.current;
      const h = hist.current;
      const now = Date.now();
      if (!(key && h.lastKey === key && now - h.lastAt < 1200)) {
        h.past.push(snapOf(prev));
        if (h.past.length > 80) h.past.shift();
      }
      h.lastKey = key;
      h.lastAt = now;
      h.future = [];
      const made = fn(prev);
      const next = made.nodes === prev.nodes ? made : { ...made, nodes: ensureZ(made.nodes) };
      mapRef.current = next;
      setMap(next);
      scheduleSave();
      bump((n) => n + 1);
    },
    [scheduleSave],
  );
  /** a change that is part of a gesture which already made its history entry (eraser) */
  const quiet = useCallback(
    (fn: (m: MindMap) => MindMap) => {
      const next = fn(mapRef.current);
      mapRef.current = next;
      setMap(next);
      scheduleSave();
    },
    [scheduleSave],
  );
  const applySnap = (s: Snap) => {
    const next = { ...mapRef.current, ...s };
    mapRef.current = next;
    setMap(next);
    const ids = new Set(s.nodes.map((n) => n.id));
    setSel((cur) => (cur && (cur.kind === 'node' ? ids.has(cur.id) : s.edges.some((e) => e.id === cur.id)) ? cur : null));
    setExtra((ex) => ex.filter((i) => ids.has(i)));
    setTextEdit(null);
    scheduleSave();
    bump((n) => n + 1);
  };
  const undo = () => {
    const h = hist.current;
    const s = h.past.pop();
    if (!s) return;
    h.future.push(snapOf(mapRef.current));
    h.lastKey = '';
    applySnap(s);
  };
  const redo = () => {
    const h = hist.current;
    const s = h.future.pop();
    if (!s) return;
    h.past.push(snapOf(mapRef.current));
    h.lastKey = '';
    applySnap(s);
  };

  const byId = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const bgc = bgColor(map.bg.tone);
  const dark = bgIsDark(map.bg.tone);
  const selNode = sel?.kind === 'node' ? byId.get(sel.id) : undefined;
  const selEdge = sel?.kind === 'edge' ? map.edges.find((e) => e.id === sel.id) : undefined;
  const selIds = useMemo(() => (selNode ? [selNode.id, ...extra.filter((i) => i !== selNode.id && byId.has(i))] : []), [selNode, extra, byId]);
  const selSet = useMemo(() => new Set(selIds), [selIds]);
  const count = selIds.length;
  const multiSel = count > 1;
  const clipNow = getClip();

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? '' : t)), 2600);
  };
  const feedback = (kind: 'select' | 'settle' | 'close') => {
    playSound(kind, settings);
    triggerHaptic(kind === 'close' ? 'tap' : kind, settings);
  };
  const spark = (x: number, y: number) => {
    const sid = Date.now() + Math.random();
    setSparks((s) => [...s, { id: sid, x, y }]);
    window.setTimeout(() => setSparks((s) => s.filter((p) => p.id !== sid)), 800);
  };
  const markPop = (nid: string) => {
    setPopIds((s) => new Set(s).add(nid));
    window.setTimeout(() => setPopIds((s) => { const n = new Set(s); n.delete(nid); return n; }), 900);
  };

  /** pick one or several nodes (grouped pieces always come along) */
  function selectNodes(ids: string[], keepStyle = false) {
    const all = withGroupMates(mapRef.current.nodes, ids);
    if (!all.length) {
      clearSelection();
      return;
    }
    setSel({ kind: 'node', id: all[0] });
    setExtra(all.slice(1));
    setTextEdit(null);
    if (!keepStyle) setStyleOpen(false);
  }

  // ---- actions ----
  function addNodeAt(x: number, y: number, patch: Partial<MMNode> = {}, select = true) {
    const cnt = mapRef.current.nodes.length;
    const n = newNode({ x, y, color: NODE_COLORS[cnt % NODE_COLORS.length], ...patch });
    commit((m) => ({ ...m, nodes: [...m.nodes, n] }));
    markPop(n.id);
    spark(x, y);
    feedback('select');
    if (select) {
      setSel({ kind: 'node', id: n.id });
      setExtra([]);
      setTextEdit({ kind: 'node', id: n.id });
      setStyleOpen(false);
    }
    return n;
  }
  function viewCentre() {
    const rect = containerRef.current?.getBoundingClientRect();
    const p = camRef.current!.toWorld((rect?.left ?? 0) + box.w / 2, (rect?.top ?? 0) + box.h / 2 - 60);
    const c = mapRef.current.nodes.length;
    return { x: Math.round(p.x + ((c % 5) - 2) * 36), y: Math.round(p.y + ((c % 4) - 1.5) * 36) };
  }
  const addNode = () => {
    const p = viewCentre();
    addNodeAt(p.x, p.y);
  };
  const addNote = () => {
    const p = viewCentre();
    addNodeAt(p.x, p.y, { shape: 'note', color: '#e8a83d', look: 'soft' });
  };
  const addFrame = () => {
    const p = viewCentre();
    addNodeAt(p.x, p.y, { shape: 'frame', color: '#4a8f9e', fw: 340, fh: 240 });
  };
  /** free text: no box, no shape */
  const addFreeText = () => {
    const p = viewCentre();
    addNodeAt(p.x, p.y, { shape: 'plain', look: 'soft', size: 3 });
    setInsertOpen(false);
  };
  function addDoodle(id: string) {
    const p = viewCentre();
    const d = doodleOf(id);
    const n = addNodeAt(p.x, p.y, { shape: 'doodle', doodle: id, look: d.text ? 'soft' : 'outline', size: 2 }, false);
    setSel({ kind: 'node', id: n.id });
    setExtra([]);
    if (d.text) setTextEdit({ kind: 'node', id: n.id });
    setDoodleOpen(false);
    setInsertOpen(false);
  }
  function addMapLink(target: MindMap, at?: { x: number; y: number }) {
    const p = at ?? viewCentre();
    const n = addNodeAt(p.x, p.y, { shape: 'maplink', mapId: target.id, text: target.title || '', fw: 320, fh: 220, color: '#4a8f9e' }, false);
    setSel({ kind: 'node', id: n.id });
    setExtra([]);
    return n;
  }

  /** photos: resized small, kept inside the map (so print and "as file" include them) */
  async function addPhotos(files: File[]): Promise<number> {
    let added = 0;
    for (const f of files.slice(0, 8)) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const { url, transparent } = await resizeImageKeepAlpha(f, 720, 0.78);
        const ar = await new Promise<number>((resolve) => {
          const im = new window.Image();
          im.onload = () => resolve(im.naturalWidth / Math.max(1, im.naturalHeight));
          im.onerror = () => resolve(1);
          im.src = url;
        });
        const p = viewCentre();
        addNodeAt(p.x + added * 30, p.y + added * 30, { shape: 'image', img: url, ar, size: 2, color: '#ffffff', look: transparent ? 'outline' : 'solid', imgStyle: 'plain', ...(transparent ? { border: 'none' as const } : {}) }, false);
        added += 1;
      } catch {
        // skip unreadable file
      }
    }
    if (added) say(T.photoAdded);
    else say(T.photoFail);
    return added;
  }
  function addSticker(emoji: string) {
    const p = viewCentre();
    const n = addNodeAt(p.x, p.y, { shape: 'sticker', symbol: emoji, size: 2 }, false);
    setSel({ kind: 'node', id: n.id });
    setExtra([]);
    setStickerPick(false);
    setInsertOpen(false);
  }
  function addPastedText(text: string, perLine: boolean) {
    const clean = text.replace(/\r/g, '').trim();
    if (!clean) return;
    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
    const p = viewCentre();
    if (perLine && lines.length > 1) {
      lines.slice(0, 24).forEach((l, i) => addNodeAt(p.x + ((i % 3) - 1) * 210, p.y + Math.floor(i / 3) * 90, { text: l.slice(0, 160), shape: 'rounded' }, false));
    } else {
      addNodeAt(p.x, p.y, { text: clean.slice(0, 600), shape: 'note', color: '#e8a83d', look: 'soft', size: clean.length > 140 ? 3 : 2 }, false);
    }
  }
  function handlePasted(text: string) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.length <= 24 && lines.every((l) => l.length <= 160)) setPasteChoice(text);
    else addPastedText(text, false);
  }

  // ---- copy / cut / paste / duplicate ----
  function copySelected(): number {
    if (!selIds.length) return 0;
    const part = copyOf(mapRef.current, selIds);
    const text = clipText(part.nodes) || '[von mir aus – Mindmap]';
    setClip({ ...part, text });
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      // the in-app clipboard is enough
    }
    return part.nodes.length;
  }
  function doCopy() {
    const n = copySelected();
    if (n) say(fmt(X.copied, { n }));
  }
  function doCut() {
    const n = copySelected();
    if (!n) return;
    removeSelected(true);
    say(fmt(X.cutDone, { n }));
  }
  function pasteClip(at?: { x: number; y: number }) {
    const c = getClip();
    if (!c || !c.nodes.length) {
      say(X.clipEmpty);
      return;
    }
    const b = selectionBounds(c.nodes);
    const centre = at ?? viewCentre();
    const inst = instantiate(c, { dx: centre.x - (b.minX + b.maxX) / 2, dy: centre.y - (b.minY + b.maxY) / 2 });
    commit((m) => ({ ...m, nodes: [...m.nodes, ...inst.nodes], edges: [...m.edges, ...inst.edges] }));
    inst.nodes.forEach((n) => markPop(n.id));
    spark(centre.x, centre.y);
    setSel({ kind: 'node', id: inst.nodes[0].id });
    setExtra(inst.nodes.slice(1).map((n) => n.id));
    setInsertOpen(false);
    feedback('select');
    say(fmt(X.pasted, { n: inst.nodes.length }));
  }
  function duplicateSelected() {
    if (!selIds.length) return;
    const part = copyOf(mapRef.current, selIds);
    const inst = instantiate(part, { dx: 44, dy: 44 });
    commit((m) => ({ ...m, nodes: [...m.nodes, ...inst.nodes], edges: [...m.edges, ...inst.edges] }));
    inst.nodes.forEach((n) => markPop(n.id));
    setSel({ kind: 'node', id: inst.nodes[0].id });
    setExtra(inst.nodes.slice(1).map((n) => n.id));
    feedback('select');
    if (inst.nodes.length > 1) say(fmt(X.duplicated, { n: inst.nodes.length }));
  }
  /** one place for everything that is pasted: pictures (file, web page piece or picture link), stickers, text */
  const [pasting, setPasting] = useState(false);
  async function importClip(c: ClipContent): Promise<boolean> {
    if (c.files.length) {
      setInsertOpen(false);
      await addPhotos(c.files);
      return true;
    }
    const urls = imageUrlsFromHtml(c.html);
    const single = imageUrlFromText(c.text);
    if (single && !urls.includes(single)) urls.push(single);
    if (urls.length) {
      setPasting(true);
      const got: File[] = [];
      for (const u of urls.slice(0, 4)) {
        const f = await fetchImageFile(u);
        if (f) got.push(f);
      }
      setPasting(false);
      if (got.length) {
        setInsertOpen(false);
        await addPhotos(got);
        return true;
      }
      // the other site does not let the app load the picture: keep the link as a note, and say how to do it instead
      say(X.clipImageFail);
      const textOnly = c.text.trim() || urls[0];
      if (textOnly && !/^data:/i.test(textOnly)) {
        const p = viewCentre();
        addNodeAt(p.x, p.y, { text: `${X.clipLinkNote}\n${textOnly}`.slice(0, 600), shape: 'note', color: '#e8a83d', look: 'soft', size: 3 }, false);
        setInsertOpen(false);
      }
      return false;
    }
    if (c.text.trim()) {
      setInsertOpen(false);
      handlePasted(c.text);
      return true;
    }
    say(X.clipNothing);
    return false;
  }
  // paste on the canvas (Ctrl+V, long-press → Paste): copied elements, text becomes a note, pictures become photos
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea')) return;
      const content = fromDataTransfer(e.clipboardData);
      const clip = getClip();
      if (!content.files.length && !imageUrlsFromHtml(content.html).length && clip && (!content.text.trim() || content.text === clip.text)) {
        e.preventDefault();
        pasteClip();
        return;
      }
      if (content.files.length || content.html || content.text.trim()) {
        e.preventDefault();
        void importClip(content);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h]);
  async function pasteFromClipboard() {
    const c = await fromAsyncClipboard();
    if (c) {
      await importClip(c);
      return;
    }
    // the browser does not allow reading pictures here: plain text may still work, otherwise point to the long-press field
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        await importClip({ files: [], html: '', text });
        return;
      }
      say(T.pasteEmpty);
    } catch {
      say(T.pasteDenied);
    }
  }

  function childSpot(parent: MMNode): { x: number; y: number } {
    const lp = layoutNode(parent);
    const incoming = mapRef.current.edges.find((e) => e.to === parent.id);
    const from = incoming ? byId.get(incoming.from) : undefined;
    const base = from ? Math.atan2(parent.y - from.y, parent.x - from.x) : 0;
    const boxes = mapRef.current.nodes.filter((n) => n.shape !== 'frame' && n.shape !== 'draw').map((n) => ({ n, l: layoutNode(n) }));
    for (const deg of [0, 38, -38, 76, -76, 114, -114, 152, -152, 180]) {
      const a = base + (deg * Math.PI) / 180;
      const dist = lp.w / 2 + 150;
      const x = parent.x + Math.cos(a) * dist;
      const y = parent.y + Math.sin(a) * dist;
      const clash = boxes.some(({ n, l }) => Math.abs(n.x - x) < l.w / 2 + 90 && Math.abs(n.y - y) < l.h / 2 + 40);
      if (!clash) return { x, y };
    }
    return { x: parent.x + lp.w / 2 + 150, y: parent.y + 90 };
  }
  const NEUTRAL = new Set(['frame', 'image', 'sticker', 'draw', 'doodle', 'maplink']);
  function addChild(parent: MMNode, at?: { x: number; y: number }) {
    const spot = at ?? childSpot(parent);
    const neutral = NEUTRAL.has(parent.shape);
    const child = newNode({
      x: spot.x,
      y: spot.y,
      color: neutral ? NODE_COLORS[mapRef.current.nodes.length % NODE_COLORS.length] : parent.color,
      shape: neutral || parent.shape === 'note' ? 'rounded' : parent.shape === 'circle' || parent.shape === 'diamond' ? 'pill' : parent.shape,
      look: parent.look === 'solid' ? 'soft' : parent.look,
      size: Math.max(1, parent.size - (parent.size > 2 ? 1 : 0)) as MMNode['size'],
      font: neutral ? undefined : parent.font,
    });
    const edge = newEdge(parent.id, child.id, { color: neutral ? '#8a8478' : parent.color, width: 2 });
    commit((m) => ({ ...m, nodes: [...m.nodes, child], edges: [...m.edges, edge] }));
    markPop(child.id);
    spark(spot.x, spot.y);
    feedback('select');
    setSel({ kind: 'node', id: child.id });
    setExtra([]);
    setTextEdit({ kind: 'node', id: child.id });
    setStyleOpen(false);
  }
  function connect(a: string, b: string) {
    if (a === b) return;
    const existing = mapRef.current.edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    if (existing) {
      setSel({ kind: 'edge', id: existing.id });
      setExtra([]);
      return;
    }
    const src = byId.get(a);
    const edge = newEdge(a, b, { color: src && !NEUTRAL.has(src.shape) ? src.color : '#8a8478', width: 2 });
    commit((m) => ({ ...m, edges: [...m.edges, edge] }));
    feedback('settle');
    setSel({ kind: 'edge', id: edge.id });
    setExtra([]);
    setStyleOpen(true);
  }
  const patchNode = (nid: string, patch: Partial<MMNode>, key = '') => commit((m) => ({ ...m, nodes: m.nodes.map((n) => (n.id === nid ? { ...n, ...patch } : n)) }), key);
  const patchEdge = (eid: string, patch: Partial<MMEdge>, key = '') => commit((m) => ({ ...m, edges: m.edges.map((e) => (e.id === eid ? { ...e, ...patch } : e)) }), key);
  /** style changes apply to everything that is selected */
  function patchSelected(patch: Partial<MMNode>) {
    const ids = new Set(selIds);
    if (!ids.size) return;
    commit(
      (m) => {
        let grp: string | undefined;
        if (patch.ganim === true && ids.size > 1) {
          const gs = new Set(m.nodes.filter((n) => ids.has(n.id)).map((n) => n.grp));
          if (gs.size !== 1 || gs.has(undefined)) grp = createId('grp');
        }
        return {
          ...m,
          nodes: m.nodes.map((n) => {
            if (!ids.has(n.id)) return n;
            const q: Partial<MMNode> = { ...patch };
            if ('shape' in q && !REGULAR_SHAPES.has(n.shape)) delete q.shape;
            if (('look' in q || 'font' in q || 'bold' in q || 'italic' in q) && (n.shape === 'draw' || n.shape === 'sticker' || n.shape === 'image')) {
              delete q.look;
              delete q.font;
              delete q.bold;
              delete q.italic;
            }
            if (grp) q.grp = grp;
            return { ...n, ...q };
          }),
        };
      },
      `style:${selIds.join(',')}`,
    );
  }
  function removeSelected(silent = false) {
    if (!sel) return;
    if (sel.kind === 'node') {
      const ids = new Set(selIds.length ? selIds : [sel.id]);
      commit((m) => ({ ...m, nodes: m.nodes.filter((n) => !ids.has(n.id)), edges: m.edges.filter((e) => !ids.has(e.from) && !ids.has(e.to)) }));
    } else commit((m) => ({ ...m, edges: m.edges.filter((e) => e.id !== sel.id) }));
    clearSelection();
    setTextEdit(null);
    setStyleOpen(false);
    feedback('close');
    if (!silent) say(T.removed);
  }
  function layerSelected(how: LayerMove) {
    const ids = new Set(selIds);
    commit((m) => ({ ...m, nodes: moveLayers(m.nodes, ids, how) }));
  }
  function setRotationSelected(deg: number) {
    if (!selNode) return;
    const ids = new Set(selIds);
    if (ids.size === 1) {
      const r = ((deg % 360) + 360) % 360;
      patchNode(selNode.id, { rot: r ? r : undefined }, `rot:${selNode.id}`);
    } else {
      const cur = Math.round(((selNode.rot ?? 0) + 540) % 360) - 180;
      commit((m) => ({ ...m, nodes: rotateNodes(m.nodes, ids, deg - cur) }), 'rotsel');
    }
  }
  function rotateBySelected(deg: number) {
    const ids = new Set(selIds);
    commit((m) => ({ ...m, nodes: rotateNodes(m.nodes, ids, deg) }));
  }
  function scaleSelected(f: number) {
    const ids = new Set(selIds);
    commit((m) => ({ ...m, nodes: scaleNodes(m.nodes, ids, f) }));
  }
  const grouped = multiSel && selNode?.grp !== undefined && selIds.every((i) => byId.get(i)?.grp === selNode?.grp);
  function toggleGroup() {
    const ids = new Set(selIds);
    if (ids.size < 2) return;
    if (grouped) commit((m) => ({ ...m, nodes: m.nodes.map((n) => (ids.has(n.id) ? { ...n, grp: undefined, ganim: undefined } : n)) }));
    else {
      const g = createId('grp');
      commit((m) => ({ ...m, nodes: m.nodes.map((n) => (ids.has(n.id) ? { ...n, grp: g } : n)) }));
      say(X.groupHint);
    }
  }

  // ---- to a new mind map / sub maps ----
  function createFromSelection(title: string, open: boolean) {
    const ids = [...selIds];
    if (!ids.length) return;
    const parts = mapPartsFor(mapRef.current, ids);
    const made = newMap(title || T.untitled, 'empty', lang);
    made.nodes = parts.nodes;
    made.edges = parts.edges;
    made.bg = { ...mapRef.current.bg };
    if (newMapSub) made.parentId = mapRef.current.id;
    mindmapRepo.save(made);
    const b = selectionBounds(copyOf(mapRef.current, ids).nodes);
    const cx = Math.round((b.minX + b.maxX) / 2);
    const cy = Math.round((b.minY + b.maxY) / 2);
    if (newMapRemove) {
      const set = new Set(ids);
      commit((m) => ({ ...m, nodes: m.nodes.filter((n) => !set.has(n.id)), edges: m.edges.filter((e) => !set.has(e.from) && !set.has(e.to)) }));
      clearSelection();
    }
    if (newMapSub) {
      const at = newMapRemove ? { x: cx, y: cy } : { x: Math.round(b.maxX + 220), y: cy };
      addMapLink(made, at);
    }
    setNewMapOpen(false);
    if (open) {
      flush();
      navigate(`/entdecken/mindmap/${made.id}`);
    } else say(fmt(X.newMapMade, { t: made.title }));
  }
  function createSubmap(title: string) {
    const made = newMap(title || T.untitled, 'empty', lang);
    made.parentId = mapRef.current.id;
    made.bg = { ...mapRef.current.bg };
    mindmapRepo.save(made);
    addMapLink(made);
    setSubOpen(false);
    say(X.submapMade);
  }
  function showSubmaps() {
    const linked = new Set(mapRef.current.nodes.filter((n) => n.mapId).map((n) => n.mapId));
    const kids = mindmapRepo.getAll().filter((m) => m.parentId === mapRef.current.id && !m.archived && !linked.has(m.id));
    if (!kids.length) {
      say(X.subsNone);
      return;
    }
    const base = viewCentre();
    const nodes = kids.map((k, i) => newNode({ x: base.x + (i % 2) * 350 - 175, y: base.y + Math.floor(i / 2) * 250, shape: 'maplink', mapId: k.id, text: k.title, fw: 320, fh: 220, color: '#4a8f9e' }));
    commit((m) => ({ ...m, nodes: [...m.nodes, ...nodes] }));
    nodes.forEach((n) => markPop(n.id));
    say(fmt(X.subsShown, { n: nodes.length }));
  }
  function openLinked(n: MMNode) {
    if (n.mapId && mindmapRepo.getById(n.mapId)) {
      flush();
      navigate(`/entdecken/mindmap/${n.mapId}`);
    } else say(X.mapMissing);
  }
  const parentMap = map.parentId ? mindmapRepo.getById(map.parentId) : undefined;
  function archiveMap() {
    flush();
    mindmapRepo.save({ ...mapRef.current, updatedAt: new Date().toISOString(), view: camRef.current?.view, archived: true, archivedAt: new Date().toISOString() });
    goneRef.current = true;
    window.clearTimeout(saveTimer.current);
    navigate('/entdecken/mindmap', { replace: true });
  }

  // ---- keyboard (desktop) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input,textarea');
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!typing && mod && k === 'c' && selIds.length) {
        e.preventDefault();
        doCopy();
      } else if (!typing && mod && k === 'x' && selIds.length) {
        e.preventDefault();
        doCut();
      } else if (!typing && mod && k === 'd' && selIds.length) {
        e.preventDefault();
        duplicateSelected();
      } else if (!typing && mod && k === 'a') {
        e.preventDefault();
        selectNodes(mapRef.current.nodes.map((n) => n.id), true);
      } else if (!typing && mod && k === 'g' && multiSel) {
        e.preventDefault();
        toggleGroup();
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        removeSelected();
      } else if (!typing && e.key === 'Enter' && sel && selNode && hasText(selNode)) {
        setTextEdit(sel);
      } else if (e.key === 'Escape') {
        setTextEdit(null);
        setMenuOpen(false);
        if (toolRef.current === 'draw' || toolRef.current === 'multi') setTool('select');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- pen, eraser, selection rectangle (they take over a one-finger drag on the background) ----
  claimFn.current = (e) => {
    const cm = camRef.current!;
    if (toolRef.current === 'draw') {
      const scale = cm.view.scale;
      const p0 = cm.toWorld(e.clientX, e.clientY);
      if (penRef.current.erase) return startErase(p0, scale);
      let pts = [p0.x, p0.y];
      setLiveStroke(pts);
      return {
        move: (cx, cy) => {
          const p = cm.toWorld(cx, cy);
          const lx = pts[pts.length - 2];
          const ly = pts[pts.length - 1];
          if (Math.hypot(p.x - lx, p.y - ly) < 1.4 / scale) return;
          pts = [...pts, p.x, p.y];
          setLiveStroke(pts);
        },
        up: (cx, cy) => {
          const p = cm.toWorld(cx, cy);
          if (pts.length >= 4) pts = [...pts, p.x, p.y];
          const simple = simplifyPts(pts, 0.7 / scale);
          const s = penRef.current;
          const node = strokeNode(simple, { color: s.color, sw: Math.round((s.sw / scale) * 10) / 10, pen: s.kind });
          setLiveStroke(null);
          if (node) commit((m) => ({ ...m, nodes: [...m.nodes, node] }));
        },
        cancel: () => setLiveStroke(null),
      };
    }
    if (toolRef.current === 'multi' || e.shiftKey) {
      const p0 = cm.toWorld(e.clientX, e.clientY);
      const base = e.shiftKey ? new Set(selIdsRef.current) : new Set<string>();
      let cur = p0;
      setMarquee({ x0: p0.x, y0: p0.y, x1: p0.x, y1: p0.y });
      return {
        move: (cx, cy) => {
          cur = cm.toWorld(cx, cy);
          setMarquee({ x0: p0.x, y0: p0.y, x1: cur.x, y1: cur.y });
        },
        up: (cx, cy) => {
          cur = cm.toWorld(cx, cy);
          setMarquee(null);
          const scale = cm.view.scale;
          const x0 = Math.min(p0.x, cur.x);
          const x1 = Math.max(p0.x, cur.x);
          const y0 = Math.min(p0.y, cur.y);
          const y1 = Math.max(p0.y, cur.y);
          if ((x1 - x0) * scale < 8 && (y1 - y0) * scale < 8) {
            if (!e.shiftKey) {
              clearSelection();
              setStyleOpen(false);
            }
            return;
          }
          const hit = mapRef.current.nodes.filter((n) => {
            const l = layoutNode(n);
            return n.x + l.w / 2 >= x0 && n.x - l.w / 2 <= x1 && n.y + l.h / 2 >= y0 && n.y - l.h / 2 <= y1;
          });
          // a big frame the rectangle only touches is not what the person meant
          const picks = hit.filter((n) => n.shape !== 'frame' || (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1)).map((n) => n.id);
          const ids = [...new Set([...base, ...picks])];
          selectNodes(ids, true);
        },
        cancel: () => setMarquee(null),
      };
    }
    return null;
  };
  const selIdsRef = useRef(selIds);
  selIdsRef.current = selIds;

  function startErase(p0: { x: number; y: number }, scale: number) {
    // the whole gesture is one undo step
    commit((m) => m);
    let changed = false;
    const apply = (x: number, y: number) => {
      const s = penRef.current;
      const r = (s.sw * 1.4 + 8) / scale;
      setEraserAt({ x, y, r });
      const cur = mapRef.current.nodes;
      let out: MMNode[] | null = null;
      for (let i = 0; i < cur.length; i++) {
        const n = cur[i];
        if (n.shape !== 'draw') continue;
        const l = layoutNode(n);
        if (Math.abs(n.x - x) > l.w / 2 + r + 4 || Math.abs(n.y - y) > l.h / 2 + r + 4) continue;
        const pieces = eraseStroke(n, x, y, r);
        if (!pieces) continue;
        if (!out) out = [...cur];
        const idx = out.findIndex((o) => o.id === n.id);
        if (idx < 0) continue;
        const repl = s.whole ? [] : pieces;
        out.splice(idx, 1, ...repl);
      }
      if (out) {
        changed = true;
        const next = out;
        quiet((m) => ({ ...m, nodes: next }));
      }
    };
    apply(p0.x, p0.y);
    return {
      move: (cx: number, cy: number) => {
        const p = camRef.current!.toWorld(cx, cy);
        apply(p.x, p.y);
      },
      up: () => {
        setEraserAt(null);
        if (!changed) hist.current.past.pop();
        bump((n) => n + 1);
      },
      cancel: () => {
        setEraserAt(null);
        if (!changed) hist.current.past.pop();
        bump((n) => n + 1);
      },
    };
  }

  // ---- node pointer handling ----
  const nodeDrag = useRef<{ id: string; sx: number; sy: number; moved: boolean; origin: Record<string, { x: number; y: number }> } | null>(null);
  function containedIds(frame: MMNode): string[] {
    const l = layoutNode(frame);
    return mapRef.current.nodes.filter((n) => n.id !== frame.id && n.shape !== 'frame' && Math.abs(n.x - frame.x) < l.w / 2 && Math.abs(n.y - frame.y) < l.h / 2).map((n) => n.id);
  }
  function nodeDown(e: RPE<SVGGElement>, n: MMNode) {
    e.stopPropagation();
    camRef.current!.stopMomentum();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    const movers = selSet.has(n.id) ? selIds : withGroupMates(mapRef.current.nodes, [n.id]);
    const origin: Record<string, { x: number; y: number }> = {};
    movers.forEach((mid) => {
      const c = byId.get(mid);
      if (!c) return;
      origin[mid] = { x: c.x, y: c.y };
      if (c.shape === 'frame') containedIds(c).forEach((cid) => { const k = byId.get(cid)!; origin[cid] = { x: k.x, y: k.y }; });
    });
    nodeDrag.current = { id: n.id, sx: e.clientX, sy: e.clientY, moved: false, origin };
  }
  function nodeMove(e: RPE<SVGGElement>) {
    const d = nodeDrag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
    if (tool === 'connect') return;
    if (!d.moved) {
      d.moved = true;
      setDraggingId(d.id);
      if (!selSet.has(d.id)) selectNodes([d.id], true);
      setTextEdit(null);
    }
    const s = camRef.current!.view.scale;
    const dx = (e.clientX - d.sx) / s;
    const dy = (e.clientY - d.sy) / s;
    const next: Record<string, { x: number; y: number }> = {};
    Object.entries(d.origin).forEach(([nid, o]) => { next[nid] = { x: o.x + dx, y: o.y + dy }; });
    setDragPos(next);
  }
  function toggleInSelection(id: string) {
    const mates = withGroupMates(mapRef.current.nodes, [id]);
    if (selSet.has(id)) {
      const rest = selIds.filter((i) => !mates.includes(i));
      if (!rest.length) clearSelection();
      else {
        setSel({ kind: 'node', id: rest[0] });
        setExtra(rest.slice(1));
      }
    } else {
      const all = [...selIds, ...mates.filter((m2) => !selIds.includes(m2))];
      setSel({ kind: 'node', id: all[0] });
      setExtra(all.slice(1));
    }
    setTextEdit(null);
    feedback('select');
  }
  function nodeUp(e: RPE<SVGGElement>, n: MMNode) {
    const d = nodeDrag.current;
    nodeDrag.current = null;
    if (!d) return;
    if (d.moved) {
      const pos = dragPosRef.current;
      commit((m) => ({ ...m, nodes: m.nodes.map((x) => (pos[x.id] ? { ...x, x: Math.round(pos[x.id].x), y: Math.round(pos[x.id].y) } : x)) }));
      setDragPos({});
      setDraggingId(null);
      feedback('settle');
      return;
    }
    if (e.type === 'pointercancel') return;
    // a tap
    if (tool === 'connect') {
      if (n.shape === 'draw') return;
      if (!connectFrom) {
        setConnectFrom(n.id);
        setSel({ kind: 'node', id: n.id });
        setExtra([]);
        feedback('select');
      } else if (connectFrom === n.id) {
        setConnectFrom(null);
        setTool('select');
      } else {
        connect(connectFrom, n.id);
        setConnectFrom(null);
        setTool('select');
      }
      return;
    }
    if (tool === 'multi' || e.shiftKey) {
      toggleInSelection(n.id);
      return;
    }
    const now = performance.now();
    const dbl = lastNodeTap.current.id === n.id && now - lastNodeTap.current.t < 400;
    lastNodeTap.current = { t: now, id: n.id };
    const wasOnly = sel?.kind === 'node' && sel.id === n.id && count === 1;
    selectNodes([n.id], true);
    if (n.shape === 'maplink') {
      if (dbl) openLinked(n);
    } else if (hasText(n) && (dbl || (wasOnly && !styleOpen))) setTextEdit({ kind: 'node', id: n.id });
    setMenuOpen(false);
  }
  const dragPosRef = useRef(dragPos);
  dragPosRef.current = dragPos;

  // ---- "+" handle: tap = new sub-node, drag = to another node or to empty space ----
  const handleRef = useRef<{ sx: number; sy: number; moved: boolean } | null>(null);
  function handleDown(e: RPE<SVGGElement>, n: MMNode) {
    e.stopPropagation();
    camRef.current!.stopMomentum();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    handleRef.current = { sx: e.clientX, sy: e.clientY, moved: false };
    void n;
  }
  function handleMove(e: RPE<SVGGElement>, n: MMNode) {
    const h = handleRef.current;
    if (!h) return;
    if (!h.moved && Math.hypot(e.clientX - h.sx, e.clientY - h.sy) < 8) return;
    h.moved = true;
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    setLinkDrag({ from: n.id, x: p.x, y: p.y });
  }
  function nodeAtPoint(x: number, y: number, exclude: string): MMNode | undefined {
    const list = mapRef.current.nodes.filter((n) => n.id !== exclude && n.shape !== 'draw');
    const hit = (n: MMNode) => {
      const l = layoutNode(n);
      return Math.abs(n.x - x) <= l.w / 2 + 8 && Math.abs(n.y - y) <= l.h / 2 + 8;
    };
    return [...list].reverse().find((n) => n.shape !== 'frame' && hit(n)) ?? list.find((n) => n.shape === 'frame' && hit(n));
  }
  function handleUp(e: RPE<SVGGElement>, n: MMNode) {
    const h = handleRef.current;
    handleRef.current = null;
    const ld = linkDrag;
    setLinkDrag(null);
    if (!h) return;
    if (!h.moved) {
      addChild(n);
      return;
    }
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    const target = nodeAtPoint(p.x, p.y, n.id);
    if (target) connect(n.id, target.id);
    else if (ld) addChild(n, { x: p.x, y: p.y });
  }

  // ---- edge: select, bend ----
  const bendRef = useRef<{ id: string } | null>(null);
  function bendDown(e: RPE<SVGGElement>, edge: MMEdge) {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    bendRef.current = { id: edge.id };
    setBendDrag({ id: edge.id, bend: edge.bend });
  }
  function bendMove(e: RPE<SVGGElement>, edge: MMEdge) {
    if (!bendRef.current) return;
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return;
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.max(-400, Math.min(400, (p.x - mx) * (-dy / len) + (p.y - my) * (dx / len)));
    setBendDrag({ id: edge.id, bend: Math.abs(bend) < 8 ? 0 : bend });
  }
  function bendUp(edge: MMEdge) {
    if (bendRef.current && bendDrag) patchEdge(edge.id, { bend: Math.round(bendDrag.bend) });
    bendRef.current = null;
    setBendDrag(null);
  }

  // ---- frames and map cards: resize ----
  const resizeRef = useRef<{ sx: number; sy: number; fw: number; fh: number } | null>(null);
  function resizeDown(e: RPE<SVGGElement>, n: MMNode) {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    const l = layoutNode(n);
    resizeRef.current = { sx: e.clientX, sy: e.clientY, fw: l.w, fh: l.h };
    setResizeDrag({ id: n.id, fw: l.w, fh: l.h });
  }
  function resizeMove(e: RPE<SVGGElement>, n: MMNode) {
    const r = resizeRef.current;
    if (!r) return;
    const s = camRef.current!.view.scale;
    setResizeDrag({ id: n.id, fw: Math.max(140, r.fw + ((e.clientX - r.sx) / s) * 2), fh: Math.max(100, r.fh + ((e.clientY - r.sy) / s) * 2) });
  }
  function resizeUp(n: MMNode) {
    if (resizeRef.current && resizeDrag) patchNode(n.id, { fw: Math.round(resizeDrag.fw), fh: Math.round(resizeDrag.fh) });
    resizeRef.current = null;
    setResizeDrag(null);
  }

  // ---- everything else: scale handle (corner) and rotate handle (above) ----
  const scaleRef = useRef<{ cx: number; cy: number; d0: number; sc0: number } | null>(null);
  function scaleDown(e: RPE<SVGGElement>, n: MMNode) {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    scaleRef.current = { cx: n.x, cy: n.y, d0: Math.max(8, Math.hypot(p.x - n.x, p.y - n.y)), sc0: n.sc ?? 1 };
    setScaleDrag({ id: n.id, sc: n.sc ?? 1 });
  }
  function scaleMove(e: RPE<SVGGElement>, n: MMNode) {
    const r = scaleRef.current;
    if (!r) return;
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    const sc = Math.min(8, Math.max(0.2, r.sc0 * (Math.hypot(p.x - r.cx, p.y - r.cy) / r.d0)));
    setScaleDrag({ id: n.id, sc });
  }
  function scaleUp(n: MMNode) {
    if (scaleRef.current && scaleDrag) patchNode(n.id, { sc: Math.round(scaleDrag.sc * 1000) / 1000 });
    scaleRef.current = null;
    setScaleDrag(null);
  }
  const rotRef = useRef<{ cx: number; cy: number } | null>(null);
  function rotDown(e: RPE<SVGGElement>, n: MMNode) {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    rotRef.current = { cx: n.x, cy: n.y };
    setRotDrag({ id: n.id, rot: n.rot ?? 0 });
  }
  function rotMove(e: RPE<SVGGElement>, n: MMNode) {
    const r = rotRef.current;
    if (!r) return;
    const p = camRef.current!.toWorld(e.clientX, e.clientY);
    let deg = (Math.atan2(p.y - r.cy, p.x - r.cx) * 180) / Math.PI + 90;
    deg = ((deg % 360) + 360) % 360;
    const snapped = Math.round(deg / 15) * 15;
    if (Math.abs(snapped - deg) < 4) deg = snapped % 360;
    setRotDrag({ id: n.id, rot: Math.round(deg * 10) / 10 });
  }
  function rotUp(n: MMNode) {
    if (rotRef.current && rotDrag) patchNode(n.id, { rot: rotDrag.rot ? rotDrag.rot : undefined });
    rotRef.current = null;
    setRotDrag(null);
  }

  // ---- sharing / printing / menu ----
  async function shareLink() {
    const hasPhotos = mapRef.current.nodes.some((n) => n.img);
    const forLink = hasPhotos ? { ...mapRef.current, nodes: mapRef.current.nodes.map((n) => (n.img ? { ...n, img: undefined, shape: 'rounded' as const, text: n.text || '📷' } : n)) } : mapRef.current;
    if (hasPhotos) say(T.shareNoPhotosInLink);
    const token = await encodeMap(toPayload(forLink, settings.userName));
    const url = `${window.location.origin}/entdecken/mindmap/importieren?d=${encodeURIComponent(token)}`;
    if (url.length > 7000) say(T.shareTooBig);
    await shareOrCopy({ title: map.title, text: buildShareText({ kind: 'mindmap', title: map.title || T.pageTitle, url, from: settings.userName, lang }) }, T.shareCopied);
  }
  async function shareFile() {
    const payload = JSON.stringify(toPayload(mapRef.current, settings.userName));
    await deliverTextFile(payload, `${(map.title || 'mindmap').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.mindmap.json`, 'application/json', map.title || 'Mindmap');
  }
  const [printImages, setPrintImages] = useState<{ overview?: string; tiles: (string | undefined)[] } | undefined>(undefined);
  const [snapMsg, setSnapMsg] = useState<string | null>(null);
  async function print() {
    flush();
    // the drawings become real pictures first, so they are on the page for sure
    let imgs: Awaited<ReturnType<typeof mindmapPrintImages>> | undefined;
    try {
      imgs = await mindmapPrintImages(mapRef.current);
      if (!imgs.overview) imgs = undefined;
    } catch {
      imgs = undefined;
    }
    setPrintImages(imgs);
    setPrinting(true);
    setTimeout(() => triggerPrint(T.pdf, 'mindmap'), imgs ? 300 : 80);
  }
  /** photo button: the map as it looks right now, saved as a picture */
  async function takeSnapshot() {
    flush();
    setMenuOpen(false);
    const blob = await mindmapSnapshotPng(mapRef.current);
    let msg: string;
    if (!blob) msg = lang === 'en' ? 'The picture could not be made on this device.' : 'Das Bild ließ sich auf diesem Gerät nicht erstellen.';
    else {
      const r = await deliverImage(blob, `${(map.title || 'mindmap').replace(/[^\p{L}\p{N}_-]+/gu, '_')}-${stamp()}.png`, map.title || 'Mindmap');
      msg = r === 'cancelled' ? '' : r === 'shared' ? (lang === 'en' ? 'Picture ready – save it from the share menu.' : 'Bild ist bereit – im Teilen-Menü sichern.') : (lang === 'en' ? 'Picture saved to your downloads.' : 'Bild wurde in deinen Downloads gespeichert.');
    }
    if (msg) {
      setSnapMsg(msg);
      setTimeout(() => setSnapMsg(null), 3500);
    }
  }
  useEffect(() => {
    const clear = () => setPrinting(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);
  function duplicateMap() {
    flush();
    const now = new Date().toISOString();
    const copy: MindMap = { ...mapRef.current, id: createId('mm'), title: `${mapRef.current.title} (2)`, createdAt: now, updatedAt: now };
    mindmapRepo.save(copy);
    navigate(`/entdecken/mindmap/${copy.id}`, { replace: true });
  }
  function deleteMap() {
    if (!window.confirm(T.deleteMapConfirm)) return;
    window.clearTimeout(saveTimer.current);
    const gone = mapRef.current.id;
    // sub maps stay – they just become top level maps
    mindmapRepo.getAll().filter((m) => m.parentId === gone).forEach((m) => mindmapRepo.save({ ...m, parentId: undefined }));
    mindmapRepo.remove(gone);
    goneRef.current = true;
    goBack(navigate, '/entdecken/mindmap');
  }
  // never write a deleted or archived map back on unmount
  useEffect(() => {
    return () => {
      if (goneRef.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  // ---- render ----
  const view = cam.view;
  const posOf = (n: MMNode): MMNode => {
    const dp = dragPos[n.id];
    const rs = resizeDrag?.id === n.id ? resizeDrag : null;
    const sd = scaleDrag?.id === n.id ? scaleDrag : null;
    const rd = rotDrag?.id === n.id ? rotDrag : null;
    return { ...n, ...(dp ?? {}), ...(rs ? { fw: rs.fw, fh: rs.fh } : {}), ...(sd ? { sc: sd.sc } : {}), ...(rd ? { rot: rd.rot } : {}) };
  };
  const nodes = map.nodes.map(posOf);
  const nById = new Map(nodes.map((n) => [n.id, n]));
  const float = !settings.reduceMotion && nodes.length < 60;
  const animate = animOn && !settings.reduceMotion && tool !== 'draw';
  const items = orderedItems({ nodes, edges: map.edges });
  const centres = useMemo(() => (animate ? groupCentresOf(nodes) : undefined), [animate, nodes]);
  const edgeGeoms = map.edges.map((e) => {
    const a = nById.get(e.from);
    const b = nById.get(e.to);
    if (!a || !b) return null;
    const bend = bendDrag?.id === e.id ? bendDrag.bend : e.bend;
    return { e: bendDrag?.id === e.id ? { ...e, bend } : e, g: edgeGeometry(e, a, b, layoutNode(a), layoutNode(b), bend) };
  }).filter(Boolean) as { e: MMEdge; g: ReturnType<typeof edgeGeometry> }[];
  const geomOf = new Map(edgeGeoms.map((x) => [x.e.id, x]));

  const textTarget = textEdit?.kind === 'node' ? byId.get(textEdit.id) : textEdit?.kind === 'edge' ? map.edges.find((e) => e.id === textEdit.id) : undefined;
  const textValue = textEdit?.kind === 'node' ? (textTarget as MMNode | undefined)?.text ?? '' : (textTarget as MMEdge | undefined)?.label ?? '';
  const ctlBtn = 'w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40';
  const barBtn = (active = false) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[58px] py-2 px-2 rounded-[var(--radius-md)] text-[11.5px] shrink-0 ${active ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`;
  const fitAll = () => cam.fit(mapBounds(mapRef.current), 56);
  const actions: StyleActions = {
    layer: layerSelected,
    rotateBy: rotateBySelected,
    setRotation: setRotationSelected,
    scaleBy: scaleSelected,
    toggleGroup,
    grouped,
  };
  const selBounds = multiSel ? selectionBounds(selIds.map((i) => nById.get(i)).filter(Boolean) as MMNode[]) : null;
  const sn = selNode ? nById.get(selNode.id) : undefined;
  const snL = sn ? layoutNode(sn) : null;
  const drawing = tool === 'draw';
  const pwLive = penWidth({ sw: pen.sw / view.scale, pen: pen.kind });

  return (
    <>
      <div className={`fixed inset-0 z-[150] no-print select-none ${animOn ? '' : 'mm-paused'}`} style={{ background: bgCss(map.bg.tone) }} data-has-bgimg={map.bg.img ? 'true' : undefined} data-testid="mindmap-editor" data-tool={tool} data-anim={animate ? 'on' : 'off'}>
        {map.bg.img && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url(${map.bg.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} data-testid="mm-bgimg" />
            {(map.bg.imgDim ?? 0) > 0 && <div className="absolute inset-0 pointer-events-none" style={{ background: bgColor(map.bg.tone), opacity: map.bg.imgDim }} />}
          </>
        )}
        {/* canvas */}
        <div ref={containerRef} className="absolute inset-0 touch-none" {...cam.bind} style={{ cursor: drawing ? 'crosshair' : cam.gesturing ? 'grabbing' : 'default' }} data-testid="mm-canvas">
          <svg width="100%" height="100%" style={{ display: 'block' }} data-testid="mm-svg" data-scale={view.scale.toFixed(3)}>
            <SceneProvider uid={uid} resolveMap={resolveMap}>
              <SceneDefs uid={uid} />
              <g transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
                {!map.bg.img && <BackgroundPattern kind={map.bg.kind} dark={dark} uid={uid} />}
                <g style={{ pointerEvents: drawing ? 'none' : undefined }}>
                  {items.map((it) => {
                    if (it.kind === 'edge') {
                      const gm = geomOf.get(it.edge.id);
                      if (!gm) return null;
                      return <EdgeView key={it.edge.id} edge={gm.e} geom={gm.g} selected={sel?.kind === 'edge' && sel.id === it.edge.id} onPointerDown={(ev) => { ev.stopPropagation(); setSel({ kind: 'edge', id: it.edge.id }); setExtra([]); setTextEdit(null); setStyleOpen(true); setMenuOpen(false); }} />;
                    }
                    const n = it.node;
                    const isSel = selSet.has(n.id);
                    return (
                      <g key={n.id} onPointerDown={(e) => nodeDown(e, n)} onPointerMove={nodeMove} onPointerUp={(e) => nodeUp(e, n)} onPointerCancel={(e) => nodeUp(e, n)}>
                        {n.shape === 'frame' && <FrameHit node={n} />}
                        <NodeView node={n} bg={bgc} selected={isSel} lifted={draggingId === n.id} pop={popIds.has(n.id)} float={n.shape !== 'frame' && n.shape !== 'draw' && !n.anim && float && draggingId !== n.id} placeholder={n.shape === 'frame' ? T.newText.replace(' …', '') : T.newText.replace(' …', '')} animate={animate} groupCentre={centres?.get(n.id)} />
                        {(n.shape === 'frame' || n.shape === 'maplink') && sel?.kind === 'node' && sel.id === n.id && !multiSel && !draggingId && (
                          <g
                            transform={`translate(${n.x + layoutNode(n).w / 2},${n.y + layoutNode(n).h / 2})`}
                            onPointerDown={(e) => resizeDown(e, n)}
                            onPointerMove={(e) => resizeMove(e, n)}
                            onPointerUp={() => resizeUp(n)}
                            className="mm-handle"
                            data-testid="mm-resize"
                          >
                            <circle r={16} fill="transparent" />
                            <circle r={7} fill="#fff" stroke="#3e7c63" strokeWidth={2.5} />
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {edgeGeoms.map(({ e, g }) =>
                    e.label ? (
                      <g key={`l-${e.id}`} onPointerDown={(ev) => { ev.stopPropagation(); setSel({ kind: 'edge', id: e.id }); setExtra([]); setStyleOpen(true); }} data-testid={`mm-edge-label-${e.id}`}>
                        <EdgeLabel text={e.label} x={g.mid.x} y={g.mid.y} color={e.color} bg={bgc} />
                      </g>
                    ) : null,
                  )}
                  {/* handles of the selected thing */}
                  {sn && snL && !multiSel && !draggingId && !textEdit && tool === 'select' && (
                    <>
                      {sn.shape !== 'frame' && sn.shape !== 'draw' && (
                        <g transform={`translate(${rotPt(sn, snL.w / 2 + 26, 0).x},${rotPt(sn, snL.w / 2 + 26, 0).y})`} onPointerDown={(e) => handleDown(e, sn)} onPointerMove={(e) => handleMove(e, sn)} onPointerUp={(e) => handleUp(e, sn)} className="mm-handle" data-testid="mm-plus-handle">
                          <circle r={22} fill="transparent" />
                          <circle r={14} fill="#3e7c63" className="mm-shadow" />
                          <path d="M -6 0 H 6 M 0 -6 V 6" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
                        </g>
                      )}
                      {sn.shape !== 'frame' && sn.shape !== 'maplink' && (
                        <>
                          <g transform={`translate(${rotPt(sn, snL.w / 2, snL.h / 2).x},${rotPt(sn, snL.w / 2, snL.h / 2).y})`} onPointerDown={(e) => scaleDown(e, sn)} onPointerMove={(e) => scaleMove(e, sn)} onPointerUp={() => scaleUp(sn)} className="mm-handle" data-testid="mm-scale-handle" style={{ cursor: 'nwse-resize' }}>
                            <circle r={18} fill="transparent" />
                            <rect x={-6.5} y={-6.5} width={13} height={13} rx={3} fill="#fff" stroke="#3e7c63" strokeWidth={2.5} />
                          </g>
                          <g transform={`translate(${rotPt(sn, 0, -snL.h / 2 - 32).x},${rotPt(sn, 0, -snL.h / 2 - 32).y})`} onPointerDown={(e) => rotDown(e, sn)} onPointerMove={(e) => rotMove(e, sn)} onPointerUp={() => rotUp(sn)} className="mm-handle" data-testid="mm-rotate-handle">
                            <circle r={18} fill="transparent" />
                            <circle r={8} fill="#fff" stroke="#3e7c63" strokeWidth={2.5} />
                            <path d="M -3.2 0.5 A 3.4 3.4 0 1 1 0 3.6" fill="none" stroke="#3e7c63" strokeWidth={1.6} strokeLinecap="round" />
                          </g>
                        </>
                      )}
                    </>
                  )}
                  {selEdge && geomOf.get(selEdge.id) && (() => {
                    const gm = geomOf.get(selEdge.id)!;
                    return (
                      <g transform={`translate(${gm.g.mid.x},${gm.g.mid.y})`} onPointerDown={(e) => bendDown(e, selEdge)} onPointerMove={(e) => bendMove(e, selEdge)} onPointerUp={() => bendUp(selEdge)} className="mm-handle" data-testid="mm-bend-handle">
                        <circle r={22} fill="transparent" />
                        <circle r={8.5} fill="#fff" stroke="#3e7c63" strokeWidth={3} />
                      </g>
                    );
                  })()}
                  {selBounds && (
                    <rect x={selBounds.minX - 10} y={selBounds.minY - 10} width={selBounds.maxX - selBounds.minX + 20} height={selBounds.maxY - selBounds.minY + 20} rx={12} fill="none" stroke="#3e7c63" strokeWidth={2} strokeDasharray="7 6" opacity={0.7} pointerEvents="none" data-testid="mm-multi-box" />
                  )}
                </g>
                {linkDrag && nById.get(linkDrag.from) && (
                  <line x1={nById.get(linkDrag.from)!.x} y1={nById.get(linkDrag.from)!.y} x2={linkDrag.x} y2={linkDrag.y} stroke="#3e7c63" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
                )}
                {connectFrom && nById.get(connectFrom) && (
                  <circle cx={nById.get(connectFrom)!.x} cy={nById.get(connectFrom)!.y} r={Math.max(layoutNode(nById.get(connectFrom)!).w, layoutNode(nById.get(connectFrom)!).h) * 0.62} fill="none" stroke="#3e7c63" strokeWidth={3} strokeDasharray="6 8" className="mm-ring" />
                )}
                {liveStroke && (
                  <path
                    d={strokePath(liveStroke)}
                    fill="none"
                    stroke={pen.color}
                    strokeWidth={pen.kind === 'pencil' ? pwLive * 0.8 : pwLive}
                    strokeLinecap={pen.kind === 'marker' ? 'square' : 'round'}
                    strokeLinejoin="round"
                    opacity={pen.kind === 'marker' ? 0.42 : pen.kind === 'pencil' ? 0.85 : 1}
                    pointerEvents="none"
                    data-testid="mm-live-stroke"
                  />
                )}
                {eraserAt && <circle cx={eraserAt.x} cy={eraserAt.y} r={eraserAt.r} fill="rgba(224,122,95,0.12)" stroke="#e07a5f" strokeWidth={1.5 / view.scale} pointerEvents="none" data-testid="mm-eraser" />}
                {marquee && (
                  <rect x={Math.min(marquee.x0, marquee.x1)} y={Math.min(marquee.y0, marquee.y1)} width={Math.abs(marquee.x1 - marquee.x0)} height={Math.abs(marquee.y1 - marquee.y0)} fill="rgba(62,124,99,0.10)" stroke="#3e7c63" strokeWidth={1.5 / view.scale} strokeDasharray={`${6 / view.scale} ${5 / view.scale}`} pointerEvents="none" data-testid="mm-marquee" />
                )}
                {sparks.map((s) => (
                  <circle key={s.id} cx={s.x} cy={s.y} r={26} fill="none" stroke="#3e7c63" strokeWidth={3} className="mm-sparkle" />
                ))}
              </g>
            </SceneProvider>
          </svg>
        </div>

        {fromDiary && (
          <button
            type="button"
            onClick={() => { flush(); backToDiary(); }}
            className="absolute left-3 z-10 px-3.5 py-2 rounded-full text-[13px] font-medium shadow-md"
            style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 54px)', background: 'var(--color-primary)', color: 'var(--color-surface)' }}
            data-testid="mm-back-diary"
          >
            ← {lang === 'en' ? 'Back to the diary entry' : 'Zurück zum Tagebucheintrag'}
          </button>
        )}

        {/* top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center gap-2 px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
          <button type="button" onClick={() => { flush(); if (fromDiary) backToDiary(); else goBack(navigate, '/entdecken/mindmap'); }} aria-label={fromDiary ? (lang === 'en' ? 'Back to the diary entry' : 'Zurück zum Tagebucheintrag') : T.back} className={ctlBtn} data-testid="mm-back"><ChevronLeft size={20} /></button>
          <input
            value={map.title}
            onChange={(e) => commit((m) => ({ ...m, title: e.target.value }), 'title')}
            placeholder={T.titlePh}
            aria-label={T.titlePh}
            data-testid="mm-title"
            className="flex-1 min-w-0 h-10 rounded-full px-4 text-[15px] outline-none bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)]"
          />
          <button type="button" onClick={undo} disabled={!hist.current.past.length} aria-label={T.undo} className={ctlBtn} data-testid="mm-undo"><Undo2 size={17} /></button>
          <button type="button" onClick={redo} disabled={!hist.current.future.length} aria-label={T.redo} className={ctlBtn} data-testid="mm-redo"><Redo2 size={17} /></button>
          <button type="button" onClick={() => void takeSnapshot()} aria-label={lang === 'en' ? 'Save snapshot' : 'Momentaufnahme speichern'} title={lang === 'en' ? 'Save snapshot' : 'Momentaufnahme speichern'} className={ctlBtn} data-testid="mm-snapshot"><Camera size={17} /></button>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={T.menu} className={ctlBtn} data-testid="mm-menu"><Ellipsis size={19} /></button>
        </div>

        {snapMsg && (
          <div className="absolute left-3 right-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] px-4 py-2.5 text-[13px] text-[var(--color-text)] z-30" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 52px)' }} role="status" data-testid="mm-snapshot-msg">{snapMsg}</div>
        )}
        {menuOpen && (
          <div className="absolute right-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] py-1.5 min-w-[240px] z-20 max-h-[70vh] overflow-y-auto" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 48px)' }} data-testid="mm-menu-list">
            {[
              { id: 'bg', icon: <ImageIcon size={16} />, label: T.background, run: () => setBgOpen(true) },
              { id: 'fit', icon: <Maximize size={16} />, label: T.fit, run: fitAll },
              { id: 'anim', icon: animOn ? <Pause size={16} /> : <Play size={16} />, label: animOn ? X.menuAnimOff : X.menuAnimOn, run: () => setAnimOn((v) => !v) },
              { id: 'submap', icon: <FolderTree size={16} />, label: X.menuSubmap, run: () => setSubOpen(true) },
              { id: 'showsubs', icon: <Link2 size={16} />, label: X.menuShowSubs, run: showSubmaps },
              ...(parentMap ? [{ id: 'parent', icon: <Upload size={16} />, label: `${X.menuParent}: ${parentMap.title || '–'}`, run: () => { flush(); navigate(`/entdecken/mindmap/${parentMap.id}`); } }] : []),
              { id: 'snap', icon: <Camera size={16} />, label: lang === 'en' ? 'Save snapshot (picture)' : 'Momentaufnahme speichern (Bild)', run: () => void takeSnapshot() },
              { id: 'pdf', icon: <FileDown size={16} />, label: T.pdf, run: () => void print() },
              { id: 'share', icon: <Share2 size={16} />, label: T.share, run: () => void shareLink() },
              { id: 'file', icon: <Download size={16} />, label: T.shareFile, run: () => void shareFile() },
              { id: 'dup', icon: <Copy size={16} />, label: T.duplicateMap, run: duplicateMap },
              { id: 'archive', icon: <Archive size={16} />, label: X.menuArchive, run: archiveMap },
              { id: 'del', icon: <Trash2 size={16} />, label: T.deleteMap, run: deleteMap, danger: true },
            ].map((it) => (
              <button key={it.id} type="button" onClick={() => { setMenuOpen(false); it.run(); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left ${'danger' in it && it.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`} data-testid={`mm-menu-${it.id}`}>
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>
        )}

        {/* zoom */}
        <div className="absolute right-3 flex flex-col gap-2" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 58px)' }}>
          <button type="button" onClick={() => cam.zoomAt(1.3)} aria-label={T.zoomIn} className={ctlBtn} data-testid="mm-zoom-in"><Plus size={18} /></button>
          <button type="button" onClick={() => cam.zoomAt(1 / 1.3)} aria-label={T.zoomOut} className={ctlBtn} data-testid="mm-zoom-out"><Minus size={18} /></button>
          <button type="button" onClick={fitAll} aria-label={T.fit} className={ctlBtn} data-testid="mm-zoom-fit"><Maximize size={16} /></button>
        </div>

        {/* text sheet on top – the keyboard never covers it */}
        {textEdit && textTarget && (
          <div className="absolute left-3 right-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-3 flex items-end gap-2 z-20" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 54px)' }} data-testid="mm-text-sheet">
            {textEdit.kind === 'node' ? (
              <textarea
                autoFocus
                rows={2}
                value={textValue}
                onChange={(e) => patchNode(textEdit.id, { text: e.target.value }, `text:${textEdit.id}`)}
                onFocus={(e) => e.currentTarget.select()}
                placeholder={T.newText}
                data-testid="mm-text-input"
                className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-[15px] outline-none"
              />
            ) : (
              <input
                autoFocus
                value={textValue}
                onChange={(e) => patchEdge(textEdit.id, { label: e.target.value || undefined }, `label:${textEdit.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && setTextEdit(null)}
                placeholder={T.newLabel}
                data-testid="mm-label-input"
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2.5 text-[15px] outline-none"
              />
            )}
            <button type="button" onClick={() => setTextEdit(null)} className="h-10 px-4 rounded-full text-[14px] text-white flex items-center gap-1" style={{ background: 'var(--color-primary)' }} data-testid="mm-text-done"><Check size={16} />{T.textDone}</button>
          </div>
        )}

        {/* empty hint */}
        {map.nodes.length === 0 && !textEdit && !drawing && (
          <p className="absolute left-1/2 -translate-x-1/2 text-center text-[13.5px] px-6 max-w-[320px] leading-relaxed pointer-events-none" style={{ top: '42%', color: dark ? '#cfd3d6' : '#6b665c' }} data-testid="mm-empty-hint">{T.emptyHint}</p>
        )}
        {tool === 'connect' && (
          <p className="absolute left-1/2 -translate-x-1/2 text-[13px] px-4 py-2 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)]" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }} data-testid="mm-connect-hint">
            {connectFrom ? T.connectHint2 : T.connectHint}
          </p>
        )}
        {(tool === 'multi' || drawing) && !textEdit && (
          <p className="absolute left-1/2 -translate-x-1/2 text-[12.5px] px-4 py-2 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)] max-w-[88vw] text-center" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }} data-testid="mm-tool-hint" data-hint>
            {drawing ? (pen.erase ? X.eraseHint : X.penHint) : X.multiHint}
          </p>
        )}
        {toast && <p className="absolute left-1/2 -translate-x-1/2 bottom-28 text-[13px] px-4 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] shadow-[var(--shadow-md)] z-10" role="status">{toast}</p>}

        {/* bottom: calm by default, tools only for what is selected */}
        <div className="absolute left-0 right-0 bottom-0 bg-[var(--color-surface)] rounded-t-[22px] shadow-[0_-4px_18px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }} data-testid="mm-bottom">
          {(selNode || selEdge) && styleOpen && !drawing && (
            <div className="px-4 pt-3 max-h-[42vh] overflow-y-auto">
              {selNode && <NodeStyleSheet node={selNode} count={count} tab={tab} setTab={setTab} onChange={patchSelected} actions={actions} T={T} X={X} lang={lang} reduceMotion={settings.reduceMotion} />}
              {selEdge && (
                <EdgeStyleSheet
                  edge={selEdge}
                  onChange={(p) => patchEdge(selEdge.id, p, `estyle:${selEdge.id}`)}
                  onLabel={() => setTextEdit({ kind: 'edge', id: selEdge.id })}
                  onReverse={() => patchEdge(selEdge.id, { from: selEdge.to, to: selEdge.from })}
                  onRemove={() => removeSelected()}
                  T={T}
                />
              )}
            </div>
          )}
          {drawing ? (
            <PenBar pen={pen} setPen={setPen} onDone={() => setTool('select')} onUndo={undo} canUndo={hist.current.past.length > 0} X={X} lang={lang} />
          ) : (
            <div className="overflow-x-auto" data-testid="mm-bar-scroll">
              <div className="flex items-center justify-around px-2 pt-1.5 w-max min-w-full">
                {!sel && tool !== 'multi' && (
                  <>
                    <button type="button" onClick={addNode} className={barBtn()} data-testid="mm-add-node"><Plus size={20} />{T.addNode}</button>
                    <button type="button" onClick={addFreeText} className={barBtn()} data-testid="mm-add-text"><Type size={19} />{X.addText}</button>
                    <button type="button" onClick={addNote} className={barBtn()} data-testid="mm-add-note"><StickyNote size={19} />{T.addNote}</button>
                    <button type="button" onClick={addFrame} className={barBtn()} data-testid="mm-add-frame"><SquareDashed size={19} />{T.addFrame}</button>
                    <button type="button" onClick={() => setDoodleOpen(true)} className={barBtn()} data-testid="mm-add-doodle"><Shapes size={19} />{X.doodles}</button>
                    <button type="button" onClick={() => { setTool('draw'); setConnectFrom(null); }} className={barBtn()} data-testid="mm-draw"><PenLine size={19} />{X.pen}</button>
                    {clipNow && clipNow.nodes.length > 0 && (
                      <button type="button" onClick={() => pasteClip()} className={barBtn()} data-testid="mm-paste-clip"><ClipboardPaste size={19} />{X.paste}</button>
                    )}
                    <button type="button" onClick={() => setInsertOpen(true)} className={barBtn()} data-testid="mm-add-more"><ImageIcon size={19} />{T.addMore}</button>
                    <button type="button" onClick={() => { setTool('multi'); setConnectFrom(null); }} className={barBtn()} data-testid="mm-multi"><BoxSelect size={19} />{X.multi}</button>
                    <button type="button" onClick={() => { setTool(tool === 'connect' ? 'select' : 'connect'); setConnectFrom(null); }} className={barBtn(tool === 'connect')} data-testid="mm-connect"><Spline size={19} />{T.connect}</button>
                  </>
                )}
                {!sel && tool === 'multi' && (
                  <>
                    <button type="button" onClick={() => selectNodes(mapRef.current.nodes.map((n) => n.id), true)} className={barBtn()} data-testid="mm-select-all"><BoxSelect size={19} />{X.selectAll}</button>
                    {clipNow && clipNow.nodes.length > 0 && (
                      <button type="button" onClick={() => pasteClip()} className={barBtn()} data-testid="mm-paste-clip"><ClipboardPaste size={19} />{X.paste}</button>
                    )}
                    <button type="button" onClick={() => setTool('select')} className={barBtn()} data-testid="mm-multi-done"><Check size={19} />{X.multiDone}</button>
                  </>
                )}
                {selNode && !multiSel && (
                  <>
                    {hasText(selNode) && <button type="button" onClick={() => setTextEdit({ kind: 'node', id: selNode.id })} className={barBtn(!!textEdit)} data-testid="mm-edit-text"><Type size={19} />{T.text}</button>}
                    <button type="button" onClick={() => setStyleOpen((v) => !v)} className={barBtn(styleOpen)} data-testid="mm-style"><Palette size={19} />{T.style}</button>
                    {selNode.shape === 'maplink' && <button type="button" onClick={() => openLinked(selNode)} className={barBtn()} data-testid="mm-open-map"><ExternalLink size={19} />{X.openMap}</button>}
                    {selNode.shape !== 'frame' && selNode.shape !== 'draw' && <button type="button" onClick={() => addChild(selNode)} className={barBtn()} data-testid="mm-add-child"><CornerDownRight size={19} />{T.child}</button>}
                    {selNode.shape !== 'draw' && <button type="button" onClick={() => { setTool('connect'); setConnectFrom(selNode.id); }} className={barBtn()} data-testid="mm-connect-from"><Spline size={19} />{T.connect}</button>}
                    <button type="button" onClick={doCopy} className={barBtn()} data-testid="mm-copy"><Copy size={18} />{X.copy}</button>
                    <button type="button" onClick={duplicateSelected} className={barBtn()} data-testid="mm-duplicate"><Layers size={18} />{T.duplicate}</button>
                    <button type="button" onClick={() => setTool('multi')} className={barBtn()} data-testid="mm-multi-from"><BoxSelect size={19} />{X.moreSelect}</button>
                    <button type="button" onClick={() => { setNewMapRemove(false); setNewMapOpen(true); }} className={barBtn()} data-testid="mm-to-newmap"><FolderTree size={18} />{X.toNewMap}</button>
                    <button type="button" onClick={() => removeSelected()} className={`${barBtn()} !text-[var(--color-danger)]`} data-testid="mm-remove"><Trash2 size={18} />{T.remove}</button>
                  </>
                )}
                {selNode && multiSel && (
                  <>
                    <button type="button" onClick={() => setStyleOpen((v) => !v)} className={barBtn(styleOpen)} data-testid="mm-style"><Palette size={19} />{T.style}</button>
                    <button type="button" onClick={doCopy} className={barBtn()} data-testid="mm-copy"><Copy size={18} />{X.copy}</button>
                    <button type="button" onClick={doCut} className={barBtn()} data-testid="mm-cut"><Scissors size={18} />{X.cut}</button>
                    <button type="button" onClick={duplicateSelected} className={barBtn()} data-testid="mm-duplicate"><Layers size={18} />{T.duplicate}</button>
                    <button type="button" onClick={toggleGroup} className={barBtn(grouped)} data-testid="mm-group"><Users size={18} />{grouped ? X.ungroup : X.group}</button>
                    <button type="button" onClick={() => { setNewMapRemove(false); setNewMapOpen(true); }} className={barBtn()} data-testid="mm-to-newmap"><FolderTree size={18} />{X.toNewMap}</button>
                    <button type="button" onClick={() => removeSelected()} className={`${barBtn()} !text-[var(--color-danger)]`} data-testid="mm-remove"><Trash2 size={18} />{T.remove}</button>
                  </>
                )}
                {selEdge && (
                  <>
                    <button type="button" onClick={() => setTextEdit({ kind: 'edge', id: selEdge.id })} className={barBtn(!!textEdit)} data-testid="mm-edge-text"><Type size={19} />{T.labelBtn}</button>
                    <button type="button" onClick={() => setStyleOpen((v) => !v)} className={barBtn(styleOpen)} data-testid="mm-edge-style"><Palette size={19} />{T.style}</button>
                    <button type="button" onClick={() => removeSelected()} className={`${barBtn()} !text-[var(--color-danger)]`} data-testid="mm-remove"><Trash2 size={18} />{T.remove}</button>
                  </>
                )}
                {sel && (
                  <button type="button" onClick={() => { clearSelection(); setStyleOpen(false); setTextEdit(null); if (tool === 'multi') setTool('select'); }} aria-label={T.close} className={barBtn()} data-testid="mm-deselect"><ChevronDown size={20} /></button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={insertOpen} onClose={() => { setInsertOpen(false); setStickerPick(false); }} title={T.insertTitle}>
        <div className="flex flex-col gap-2.5" data-testid="mm-insert-modal">
          {!stickerPick ? (
            <>
              {clipNow && clipNow.nodes.length > 0 && (
                <button type="button" onClick={() => pasteClip()} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-primary-soft)]" data-testid="mm-insert-clip">
                  <Copy size={20} className="mt-0.5 text-[var(--color-primary)]" />
                  <span><span className="block text-[14.5px] text-[var(--color-text)]">{X.insertClip}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{fmt(X.insertClipSub, { n: clipNow.nodes.length })}</span></span>
                </button>
              )}
              <button type="button" onClick={addFreeText} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-text">
                <Type size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{X.insertText}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{X.insertTextSub}</span></span>
              </button>
              <button type="button" onClick={() => photoInput.current?.click()} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-photo">
                <Camera size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{T.insertPhoto}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{T.insertPhotoSub}</span></span>
              </button>
              <button type="button" onClick={() => setStickerPick(true)} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-sticker">
                <Smile size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{T.insertSticker}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{T.insertStickerSub}</span></span>
              </button>
              <button type="button" onClick={() => { setInsertOpen(false); setDoodleOpen(true); }} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-doodle">
                <Shapes size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{X.insertDoodle}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{X.insertDoodleSub}</span></span>
              </button>
              <button type="button" onClick={() => { setInsertOpen(false); setMapPickOpen(true); }} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-maplink">
                <Link2 size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{X.insertMapLink}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{X.insertMapLinkSub}</span></span>
              </button>
              <button type="button" onClick={() => void pasteFromClipboard()} className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface-muted)]" data-testid="mm-insert-paste">
                <ClipboardPaste size={20} className="mt-0.5 text-[var(--color-primary)]" />
                <span><span className="block text-[14.5px] text-[var(--color-text)]">{T.insertPaste}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{T.insertPasteSub}</span></span>
              </button>
              <div
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={X.clipField}
                onBeforeInput={(e) => e.preventDefault()}
                onKeyDown={(e) => { if (!(e.ctrlKey || e.metaKey)) e.preventDefault(); }}
                className="rounded-[var(--radius-md)] px-4 py-3 text-[13px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-strong)] text-center"
                data-testid="mm-insert-paste-field"
              >
                {pasting ? X.clipWorking : X.clipField}
              </div>
              <p className="text-[12px] text-[var(--color-text-faint)]">{X.clipHow}</p>
            </>
          ) : (
            <EmojiPicker value="" onChange={addSticker} />
          )}
        </div>
      </Modal>
      <DoodlePickerModal open={doodleOpen} onClose={() => setDoodleOpen(false)} onPick={addDoodle} X={X} lang={lang} />
      <MapPickModal
        open={mapPickOpen}
        onClose={() => setMapPickOpen(false)}
        maps={mapPickOpen ? mindmapRepo.getAll().filter((m) => m.id !== map.id && !m.archived).sort((a, b) => a.title.localeCompare(b.title)) : []}
        onPick={(m) => { setMapPickOpen(false); addMapLink(m); }}
        X={X}
        title={X.pickMap}
      />
      {subOpen && <NameModal key="sub" open onClose={() => setSubOpen(false)} title={X.submapTitle} label={X.submapName} initial="" cta={X.submapCreate} onSubmit={createSubmap} testId="mm-submap" />}
      {newMapOpen && (
        <NameModal key="newmap" open onClose={() => setNewMapOpen(false)} title={X.newMapTitle} label={X.newMapName} initial={selNode?.text?.trim().slice(0, 40) || ''} cta={X.newMapOpen} onSubmit={(name) => createFromSelection(name, true)} testId="mm-newmap">
          <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
            <input type="checkbox" checked={newMapRemove} onChange={(e) => setNewMapRemove(e.target.checked)} data-testid="mm-newmap-remove" />
            {X.newMapRemove}
          </label>
          <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
            <input type="checkbox" checked={newMapSub} onChange={(e) => setNewMapSub(e.target.checked)} data-testid="mm-newmap-sub" />
            {X.newMapAsSub}
          </label>
          <button type="button" onClick={() => { const el = document.querySelector<HTMLInputElement>('[data-testid="mm-newmap-name"]'); createFromSelection(el?.value.trim() ?? '', false); }} className="px-4 py-3 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mm-newmap-stay">
            {X.newMapStay}
          </button>
        </NameModal>
      )}
      <Modal open={pasteChoice !== null} onClose={() => setPasteChoice(null)} title={T.pasteLines}>
        <div className="flex flex-col gap-2.5" data-testid="mm-paste-choice">
          <button type="button" className="px-4 py-3 rounded-full text-[14px] text-white" style={{ background: 'var(--color-primary)' }} onClick={() => { addPastedText(pasteChoice ?? '', true); setPasteChoice(null); }} data-testid="mm-paste-many">{T.pasteMany}</button>
          <button type="button" className="px-4 py-3 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" onClick={() => { addPastedText(pasteChoice ?? '', false); setPasteChoice(null); }} data-testid="mm-paste-one">{T.pasteOne}</button>
        </div>
      </Modal>
      <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" data-testid="mm-photo-input" onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ''; setInsertOpen(false); if (fs.length) void addPhotos(fs); }} />

      <input ref={bgPhotoInput} type="file" accept="image/*" className="hidden" data-testid="mm-bgimg-input" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void resizeImageFile(f, 1600, 0.78).then((url) => commit((m) => ({ ...m, bg: { ...m.bg, img: url, imgDim: m.bg.imgDim ?? 0.35 } }))).catch(() => {}); }} />
      <Modal open={bgOpen} onClose={() => setBgOpen(false)} title={T.background}>
        <div className="flex flex-col gap-4" data-testid="mm-bg-modal">
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{X.bgPattern}</p>
            <div className="flex gap-2 flex-wrap">
              {BG_KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => commit((m) => ({ ...m, bg: { ...m.bg, kind: k.id } }))} className={`px-4 py-2 rounded-full text-[13.5px] border ${map.bg.kind === k.id ? 'text-white border-transparent' : 'text-[var(--color-text)] border-[var(--color-border-strong)]'}`} style={map.bg.kind === k.id ? { background: 'var(--color-primary)' } : undefined} data-testid={`mm-bgkind-${k.id}`}>{lang === 'en' ? k.en : k.de}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{T.bgTone}</p>
            <div className="flex gap-2.5 flex-wrap items-center">
              {BG_TONES.map((t) => (
                <button key={t.id} type="button" onClick={() => commit((m) => ({ ...m, bg: { ...m.bg, tone: t.id } }))} aria-label={lang === 'en' ? t.en : t.de} className="w-10 h-10 rounded-full" style={{ background: t.css ?? t.color, border: `2px solid ${mixHex(t.color, '#000000', 0.18)}`, outline: map.bg.tone === t.id ? '3px solid var(--color-primary)' : 'none', outlineOffset: 2 }} data-testid={`mm-bgtone-${t.id}`} />
              ))}
              <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer" style={{ background: HEX_TONE.test(map.bg.tone) ? map.bg.tone : 'conic-gradient(#e8a83d, #6fbf73, #4a8f9e, #9a7bc4, #d9778a, #e8a83d)', outline: HEX_TONE.test(map.bg.tone) ? '3px solid var(--color-primary)' : 'none', outlineOffset: 2 }} title={X.bgCustom}>
                <input type="color" value={HEX_TONE.test(map.bg.tone) ? map.bg.tone : '#fbf8f1'} onChange={(e) => commit((m) => ({ ...m, bg: { ...m.bg, tone: e.target.value } }), 'bgcolor')} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={X.bgCustom} data-testid="mm-bgtone-custom" />
              </label>
            </div>
          </div>
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{lang === 'en' ? 'Own photo as background' : 'Eigenes Foto als Hintergrund'}</p>
            <div className="flex gap-2 flex-wrap items-center">
              <button type="button" onClick={() => bgPhotoInput.current?.click()} className="px-4 py-2 rounded-full text-[13.5px] border border-[var(--color-border-strong)] text-[var(--color-text)] flex items-center gap-1.5" data-testid="mm-bgimg-pick">
                <ImageIcon size={15} /> {map.bg.img ? (lang === 'en' ? 'Change photo' : 'Foto ändern') : (lang === 'en' ? 'Choose a photo' : 'Foto wählen')}
              </button>
              {map.bg.img && (
                <button type="button" onClick={() => commit((m) => ({ ...m, bg: { kind: m.bg.kind, tone: m.bg.tone } }))} className="px-4 py-2 rounded-full text-[13.5px] border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid="mm-bgimg-remove">
                  {lang === 'en' ? 'Remove photo' : 'Foto entfernen'}
                </button>
              )}
            </div>
            {map.bg.img && (
              <div className="mt-3">
                <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{lang === 'en' ? 'Photo strength (calmer = easier to read)' : 'Stärke des Fotos (ruhiger = besser lesbar)'}</p>
                <div className="flex gap-2 flex-wrap">
                  {([[0, lang === 'en' ? 'Full' : 'Voll'], [0.35, lang === 'en' ? 'Soft' : 'Weich'], [0.65, lang === 'en' ? 'Calm' : 'Ruhig']] as [number, string][]).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => commit((m) => ({ ...m, bg: { ...m.bg, imgDim: v } }))} className={`px-4 py-2 rounded-full text-[13.5px] border ${(map.bg.imgDim ?? 0) === v ? 'text-white border-transparent' : 'text-[var(--color-text)] border-[var(--color-border-strong)]'}`} style={(map.bg.imgDim ?? 0) === v ? { background: 'var(--color-primary)' } : undefined} data-testid={`mm-bgimg-dim-${v}`}>{label}</button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11.5px] text-[var(--color-text-faint)] mt-2">{lang === 'en' ? 'The photo stays on this device. It is not part of share links or shared files.' : 'Das Foto bleibt auf diesem Gerät. Es ist nicht in Links oder geteilten Dateien enthalten.'}</p>
          </div>
        </div>
      </Modal>

      {printing && <MindmapPrintView map={map} lang={lang} images={printImages} />}
    </>
  );
}

/** a frame only reacts on its border and title bar, so you can still pan across its inside */
function FrameHit({ node }: { node: MMNode }) {
  const L = layoutNode(node);
  return (
    <g>
      <rect x={-L.w / 2 + node.x} y={-L.h / 2 + node.y} width={L.w} height={Math.min(L.h, L.fs * 3)} fill="transparent" />
      <rect x={-L.w / 2 + node.x} y={-L.h / 2 + node.y} width={L.w} height={L.h} fill="none" stroke="transparent" strokeWidth={24} pointerEvents="stroke" />
    </g>
  );
}

void MapItems;
void tabsFor;
