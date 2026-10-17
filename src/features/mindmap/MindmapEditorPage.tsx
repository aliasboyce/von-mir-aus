import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft, CornerDownRight, Copy, Ellipsis, FileDown, Image as ImageIcon, Maximize, Minus, Palette, Plus, Redo2, Share2, SquareDashed, StickyNote, Spline, Trash2, Type, Undo2, Download } from 'lucide-react';
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
import { approxTextWidth } from '../../components/canvas/svgText';
import { BG_TONES, bgColor, edgeGeometry, layoutNode, mapBounds, mindmapRepo, newEdge, newNode, toPayload, encodeMap, mixHex, type MMEdge, type MMNode, type MindMap } from './mindmapModel';
import { EdgeLabel, EdgeView, NodeView } from './MindmapScene';
import { EdgeStyleSheet, NodeStyleSheet, type StyleTab } from './MindmapPanels';
import { MindmapPrintView } from './MindmapPrintView';
import { mindmapTexts } from './mindmapTexts';

const NODE_COLORS = ['#6aa08a', '#4a8f9e', '#e8a83d', '#e07a5f', '#9a7bc4', '#d9778a', '#7a9e4a'];
type Sel = { kind: 'node' | 'edge'; id: string } | null;
interface Snap {
  title: string;
  bg: MindMap['bg'];
  nodes: MMNode[];
  edges: MMEdge[];
}
const snapOf = (m: MindMap): Snap => ({ title: m.title, bg: m.bg, nodes: m.nodes, edges: m.edges });

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
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);

  const [map, setMap] = useState<MindMap>(initial);
  const mapRef = useRef(map);
  mapRef.current = map;
  const hist = useRef<{ past: Snap[]; future: Snap[]; lastKey: string; lastAt: number }>({ past: [], future: [], lastKey: '', lastAt: 0 });
  const [, bump] = useState(0);
  const saveTimer = useRef<number | undefined>(undefined);
  const [sel, setSel] = useState<Sel>(null);
  const [tool, setTool] = useState<'select' | 'connect'>('select');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [tab, setTab] = useState<StyleTab>('shape');
  const [textEdit, setTextEdit] = useState<Sel>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState('');
  const [popIds, setPopIds] = useState<Set<string>>(new Set());
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // --- drag state (live positions while a node/frame is moved) ---
  const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkDrag, setLinkDrag] = useState<{ from: string; x: number; y: number } | null>(null);
  const [bendDrag, setBendDrag] = useState<{ id: string; bend: number } | null>(null);
  const [resizeDrag, setResizeDrag] = useState<{ id: string; fw: number; fh: number } | null>(null);
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
      setSel(null);
      setTextEdit(null);
      setStyleOpen(false);
      setTool('select');
      setConnectFrom(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const cam = useCamera(containerRef, { enabled: true, minScale: 0.12, maxScale: 4, initial: initial.view ?? { scale: 1, tx: 0, ty: 0 }, onBackgroundTap: onBgTap });
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
      const next = fn(prev);
      mapRef.current = next;
      setMap(next);
      scheduleSave();
      bump((n) => n + 1);
    },
    [scheduleSave],
  );
  const applySnap = (s: Snap) => {
    const next = { ...mapRef.current, ...s };
    mapRef.current = next;
    setMap(next);
    setSel((cur) => (cur && (cur.kind === 'node' ? s.nodes.some((n) => n.id === cur.id) : s.edges.some((e) => e.id === cur.id)) ? cur : null));
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
  const dark = bgc === '#23282e';
  const selNode = sel?.kind === 'node' ? byId.get(sel.id) : undefined;
  const selEdge = sel?.kind === 'edge' ? map.edges.find((e) => e.id === sel.id) : undefined;

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

  // ---- actions ----
  function addNodeAt(x: number, y: number, patch: Partial<MMNode> = {}, select = true) {
    const count = mapRef.current.nodes.length;
    const n = newNode({ x, y, color: NODE_COLORS[count % NODE_COLORS.length], ...patch });
    commit((m) => ({ ...m, nodes: [...m.nodes, n] }));
    markPop(n.id);
    spark(x, y);
    feedback('select');
    if (select) {
      setSel({ kind: 'node', id: n.id });
      setTextEdit({ kind: 'node', id: n.id });
      setStyleOpen(false);
    }
    return n;
  }
  function viewCentre() {
    const p = camRef.current!.toWorld((containerRef.current?.getBoundingClientRect().left ?? 0) + box.w / 2, (containerRef.current?.getBoundingClientRect().top ?? 0) + box.h / 2 - 60);
    const c = mapRef.current.nodes.length;
    return { x: p.x + ((c % 5) - 2) * 36, y: p.y + ((c % 4) - 1.5) * 36 };
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

  function childSpot(parent: MMNode): { x: number; y: number } {
    const lp = layoutNode(parent);
    const incoming = mapRef.current.edges.find((e) => e.to === parent.id);
    const from = incoming ? byId.get(incoming.from) : undefined;
    const base = from ? Math.atan2(parent.y - from.y, parent.x - from.x) : 0;
    const boxes = mapRef.current.nodes.filter((n) => n.shape !== 'frame').map((n) => ({ n, l: layoutNode(n) }));
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
  function addChild(parent: MMNode, at?: { x: number; y: number }) {
    const spot = at ?? childSpot(parent);
    const child = newNode({
      x: spot.x,
      y: spot.y,
      color: parent.shape === 'frame' ? NODE_COLORS[mapRef.current.nodes.length % NODE_COLORS.length] : parent.color,
      shape: parent.shape === 'frame' || parent.shape === 'note' ? 'rounded' : parent.shape === 'circle' || parent.shape === 'diamond' ? 'pill' : parent.shape,
      look: parent.look === 'solid' ? 'soft' : parent.look,
      size: Math.max(1, parent.size - (parent.size > 2 ? 1 : 0)) as MMNode['size'],
    });
    const edge = newEdge(parent.id, child.id, { color: parent.shape === 'frame' ? '#8a8478' : parent.color, width: 2 });
    commit((m) => ({ ...m, nodes: [...m.nodes, child], edges: [...m.edges, edge] }));
    markPop(child.id);
    spark(spot.x, spot.y);
    feedback('select');
    setSel({ kind: 'node', id: child.id });
    setTextEdit({ kind: 'node', id: child.id });
    setStyleOpen(false);
  }
  function connect(a: string, b: string) {
    if (a === b) return;
    const existing = mapRef.current.edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    if (existing) {
      setSel({ kind: 'edge', id: existing.id });
      return;
    }
    const src = byId.get(a);
    const edge = newEdge(a, b, { color: src && src.shape !== 'frame' ? src.color : '#8a8478', width: 2 });
    commit((m) => ({ ...m, edges: [...m.edges, edge] }));
    feedback('settle');
    setSel({ kind: 'edge', id: edge.id });
    setStyleOpen(true);
  }
  const patchNode = (nid: string, patch: Partial<MMNode>, key = '') => commit((m) => ({ ...m, nodes: m.nodes.map((n) => (n.id === nid ? { ...n, ...patch } : n)) }), key);
  const patchEdge = (eid: string, patch: Partial<MMEdge>, key = '') => commit((m) => ({ ...m, edges: m.edges.map((e) => (e.id === eid ? { ...e, ...patch } : e)) }), key);
  function removeSelected() {
    if (!sel) return;
    if (sel.kind === 'node') commit((m) => ({ ...m, nodes: m.nodes.filter((n) => n.id !== sel.id), edges: m.edges.filter((e) => e.from !== sel.id && e.to !== sel.id) }));
    else commit((m) => ({ ...m, edges: m.edges.filter((e) => e.id !== sel.id) }));
    setSel(null);
    setTextEdit(null);
    setStyleOpen(false);
    feedback('close');
    say(T.removed);
  }
  function duplicateSelected() {
    if (!selNode) return;
    const copy: MMNode = { ...selNode, id: createId('mmn'), x: selNode.x + 44, y: selNode.y + 44 };
    commit((m) => ({ ...m, nodes: [...m.nodes, copy] }));
    markPop(copy.id);
    setSel({ kind: 'node', id: copy.id });
    feedback('select');
  }

  // ---- keyboard (desktop) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input,textarea');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        removeSelected();
      } else if (!typing && e.key === 'Enter' && sel) {
        setTextEdit(sel);
      } else if (e.key === 'Escape') {
        setTextEdit(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
    const origin: Record<string, { x: number; y: number }> = { [n.id]: { x: n.x, y: n.y } };
    if (n.shape === 'frame') containedIds(n).forEach((cid) => { const c = byId.get(cid)!; origin[cid] = { x: c.x, y: c.y }; });
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
      setSel({ kind: 'node', id: d.id });
      setTextEdit(null);
    }
    const s = camRef.current!.view.scale;
    const dx = (e.clientX - d.sx) / s;
    const dy = (e.clientY - d.sy) / s;
    const next: Record<string, { x: number; y: number }> = {};
    Object.entries(d.origin).forEach(([nid, o]) => { next[nid] = { x: o.x + dx, y: o.y + dy }; });
    setDragPos(next);
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
      if (!connectFrom) {
        setConnectFrom(n.id);
        setSel({ kind: 'node', id: n.id });
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
    const now = performance.now();
    const dbl = lastNodeTap.current.id === n.id && now - lastNodeTap.current.t < 400;
    lastNodeTap.current = { t: now, id: n.id };
    setSel({ kind: 'node', id: n.id });
    if (dbl || (sel?.kind === 'node' && sel.id === n.id && !styleOpen)) setTextEdit({ kind: 'node', id: n.id });
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
    const list = mapRef.current.nodes.filter((n) => n.id !== exclude);
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

  // ---- frame: resize ----
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

  // ---- sharing / printing / menu ----
  async function shareLink() {
    const token = await encodeMap(toPayload(mapRef.current, settings.userName));
    const url = `${window.location.origin}/entdecken/mindmap/importieren?d=${encodeURIComponent(token)}`;
    if (url.length > 7000) say(T.shareTooBig);
    await shareOrCopy({ title: map.title, text: buildShareText({ kind: 'mindmap', title: map.title || T.pageTitle, url, from: settings.userName, lang }) }, T.shareCopied);
  }
  async function shareFile() {
    const payload = JSON.stringify(toPayload(mapRef.current, settings.userName));
    await deliverTextFile(payload, `${(map.title || 'mindmap').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.mindmap.json`, 'application/json', map.title || 'Mindmap');
  }
  function print() {
    flush();
    setPrinting(true);
    setTimeout(() => triggerPrint(T.pdf, 'mindmap'), 80);
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
    mindmapRepo.remove(mapRef.current.id);
    mapRef.current = { ...mapRef.current, id: '__gone__' };
    goBack(navigate, '/entdecken/mindmap');
  }
  // never write a deleted map back on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current.id === '__gone__') window.clearTimeout(saveTimer.current);
    };
  }, []);

  // ---- render ----
  const view = cam.view;
  const posOf = (n: MMNode): MMNode => {
    const dp = dragPos[n.id];
    const rs = resizeDrag?.id === n.id ? resizeDrag : null;
    return { ...n, ...(dp ?? {}), ...(rs ? { fw: rs.fw, fh: rs.fh } : {}) };
  };
  const nodes = map.nodes.map(posOf);
  const nById = new Map(nodes.map((n) => [n.id, n]));
  const frames = nodes.filter((n) => n.shape === 'frame');
  const others = nodes.filter((n) => n.shape !== 'frame');
  const patternColor = dark ? '#ffffff' : '#000000';
  const spacing = 32 * view.scale;
  const float = !settings.reduceMotion && nodes.length < 60;
  const edgeGeoms = map.edges.map((e) => {
    const a = nById.get(e.from);
    const b = nById.get(e.to);
    if (!a || !b) return null;
    const bend = bendDrag?.id === e.id ? bendDrag.bend : e.bend;
    return { e: bendDrag?.id === e.id ? { ...e, bend } : e, g: edgeGeometry(e, a, b, layoutNode(a), layoutNode(b), bend) };
  }).filter(Boolean) as { e: MMEdge; g: ReturnType<typeof edgeGeometry> }[];

  const textTarget = textEdit?.kind === 'node' ? byId.get(textEdit.id) : textEdit?.kind === 'edge' ? map.edges.find((e) => e.id === textEdit.id) : undefined;
  const textValue = textEdit?.kind === 'node' ? (textTarget as MMNode | undefined)?.text ?? '' : (textTarget as MMEdge | undefined)?.label ?? '';
  const ctlBtn = 'w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40';
  const barBtn = (active = false) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[58px] py-2 px-2 rounded-[var(--radius-md)] text-[11.5px] ${active ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`;
  const fitAll = () => cam.fit(mapBounds(mapRef.current), 56);

  return (
    <>
      <div className="fixed inset-0 z-[150] no-print select-none" style={{ background: bgc }} data-testid="mindmap-editor">
        {/* canvas */}
        <div ref={containerRef} className="absolute inset-0 touch-none" {...cam.bind} style={{ cursor: cam.gesturing ? 'grabbing' : 'default' }} data-testid="mm-canvas">
          <svg width="100%" height="100%" style={{ display: 'block' }} data-testid="mm-svg" data-scale={view.scale.toFixed(3)}>
            {map.bg.kind !== 'plain' && (
              <>
                <defs>
                  <pattern id="mm-bg" x={view.tx} y={view.ty} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
                    {map.bg.kind === 'dots' && <circle cx={spacing / 2} cy={spacing / 2} r={Math.max(1, 1.5 * view.scale)} fill={patternColor} opacity={0.16} />}
                    {map.bg.kind === 'grid' && <path d={`M ${spacing} 0 H 0 V ${spacing}`} fill="none" stroke={patternColor} strokeWidth={1} opacity={0.09} />}
                    {map.bg.kind === 'lines' && <path d={`M 0 ${spacing} H ${spacing}`} fill="none" stroke={patternColor} strokeWidth={1} opacity={0.11} />}
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mm-bg)" pointerEvents="none" />
              </>
            )}
            <g transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
              {frames.map((n) => (
                <g key={n.id} onPointerDown={(e) => nodeDown(e, n)} onPointerMove={nodeMove} onPointerUp={(e) => nodeUp(e, n)} onPointerCancel={(e) => nodeUp(e, n)}>
                  <FrameHit node={n} />
                  <NodeView node={n} bg={bgc} selected={sel?.kind === 'node' && sel.id === n.id} lifted={draggingId === n.id} pop={popIds.has(n.id)} placeholder={T.newText.replace(' …', '')} />
                  {sel?.kind === 'node' && sel.id === n.id && !draggingId && (
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
              ))}
              {edgeGeoms.map(({ e, g }) => (
                <EdgeView key={e.id} edge={e} geom={g} selected={sel?.kind === 'edge' && sel.id === e.id} onPointerDown={(ev) => { ev.stopPropagation(); setSel({ kind: 'edge', id: e.id }); setTextEdit(null); setStyleOpen(true); setMenuOpen(false); }} />
              ))}
              {others.map((n) => (
                <g key={n.id} onPointerDown={(e) => nodeDown(e, n)} onPointerMove={nodeMove} onPointerUp={(e) => nodeUp(e, n)} onPointerCancel={(e) => nodeUp(e, n)}>
                  <NodeView node={n} bg={bgc} selected={sel?.kind === 'node' && sel.id === n.id} lifted={draggingId === n.id} pop={popIds.has(n.id)} float={float && draggingId !== n.id} placeholder={T.newText.replace(' …', '')} />
                </g>
              ))}
              {edgeGeoms.map(({ e, g }) =>
                e.label ? (
                  <g key={`l-${e.id}`} onPointerDown={(ev) => { ev.stopPropagation(); setSel({ kind: 'edge', id: e.id }); setStyleOpen(true); }} data-testid={`mm-edge-label-${e.id}`}>
                    <EdgeLabel text={e.label} x={g.mid.x} y={g.mid.y} color={e.color} bg={bgc} />
                  </g>
                ) : null,
              )}
              {/* handles of the selected thing */}
              {selNode && !draggingId && !textEdit && tool === 'select' && selNode.shape !== 'frame' && (
                <g transform={`translate(${nById.get(selNode.id)!.x + layoutNode(nById.get(selNode.id)!).w / 2 + 26},${nById.get(selNode.id)!.y})`} onPointerDown={(e) => handleDown(e, selNode)} onPointerMove={(e) => handleMove(e, selNode)} onPointerUp={(e) => handleUp(e, selNode)} className="mm-handle" data-testid="mm-plus-handle">
                  <circle r={22} fill="transparent" />
                  <circle r={14} fill="#3e7c63" className="mm-shadow" />
                  <path d="M -6 0 H 6 M 0 -6 V 6" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
                </g>
              )}
              {selEdge && edgeGeoms.find((x) => x.e.id === selEdge.id) && (() => {
                const gm = edgeGeoms.find((x) => x.e.id === selEdge.id)!;
                return (
                  <g transform={`translate(${gm.g.mid.x},${gm.g.mid.y})`} onPointerDown={(e) => bendDown(e, selEdge)} onPointerMove={(e) => bendMove(e, selEdge)} onPointerUp={() => bendUp(selEdge)} className="mm-handle" data-testid="mm-bend-handle">
                    <circle r={22} fill="transparent" />
                    <circle r={8.5} fill="#fff" stroke="#3e7c63" strokeWidth={3} />
                  </g>
                );
              })()}
              {linkDrag && nById.get(linkDrag.from) && (
                <line x1={nById.get(linkDrag.from)!.x} y1={nById.get(linkDrag.from)!.y} x2={linkDrag.x} y2={linkDrag.y} stroke="#3e7c63" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
              )}
              {connectFrom && nById.get(connectFrom) && (
                <circle cx={nById.get(connectFrom)!.x} cy={nById.get(connectFrom)!.y} r={Math.max(layoutNode(nById.get(connectFrom)!).w, layoutNode(nById.get(connectFrom)!).h) * 0.62} fill="none" stroke="#3e7c63" strokeWidth={3} strokeDasharray="6 8" className="mm-ring" />
              )}
              {sparks.map((s) => (
                <circle key={s.id} cx={s.x} cy={s.y} r={26} fill="none" stroke="#3e7c63" strokeWidth={3} className="mm-sparkle" />
              ))}
            </g>
          </svg>
        </div>

        {/* top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center gap-2 px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
          <button type="button" onClick={() => { flush(); goBack(navigate, '/entdecken/mindmap'); }} aria-label={T.back} className={ctlBtn} data-testid="mm-back"><ChevronLeft size={20} /></button>
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
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={T.menu} className={ctlBtn} data-testid="mm-menu"><Ellipsis size={19} /></button>
        </div>

        {menuOpen && (
          <div className="absolute right-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] py-1.5 min-w-[220px] z-20" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 48px)' }} data-testid="mm-menu-list">
            {[
              { id: 'bg', icon: <ImageIcon size={16} />, label: T.background, run: () => setBgOpen(true) },
              { id: 'fit', icon: <Maximize size={16} />, label: T.fit, run: fitAll },
              { id: 'pdf', icon: <FileDown size={16} />, label: T.pdf, run: print },
              { id: 'share', icon: <Share2 size={16} />, label: T.share, run: () => void shareLink() },
              { id: 'file', icon: <Download size={16} />, label: T.shareFile, run: () => void shareFile() },
              { id: 'dup', icon: <Copy size={16} />, label: T.duplicateMap, run: duplicateMap },
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
        {map.nodes.length === 0 && !textEdit && (
          <p className="absolute left-1/2 -translate-x-1/2 text-center text-[13.5px] px-6 max-w-[320px] leading-relaxed pointer-events-none" style={{ top: '42%', color: dark ? '#cfd3d6' : '#6b665c' }} data-testid="mm-empty-hint">{T.emptyHint}</p>
        )}
        {tool === 'connect' && (
          <p className="absolute left-1/2 -translate-x-1/2 text-[13px] px-4 py-2 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)]" style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 56px)' }} data-testid="mm-connect-hint">
            {connectFrom ? T.connectHint2 : T.connectHint}
          </p>
        )}
        {toast && <p className="absolute left-1/2 -translate-x-1/2 bottom-28 text-[13px] px-4 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] shadow-[var(--shadow-md)]" role="status">{toast}</p>}

        {/* bottom: calm by default, tools only for what is selected */}
        <div className="absolute left-0 right-0 bottom-0 bg-[var(--color-surface)] rounded-t-[22px] shadow-[0_-4px_18px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }} data-testid="mm-bottom">
          {(selNode || selEdge) && styleOpen && (
            <div className="px-4 pt-3 max-h-[40vh] overflow-y-auto">
              {selNode && <NodeStyleSheet node={selNode} tab={tab} setTab={setTab} onChange={(p) => patchNode(selNode.id, p, `style:${selNode.id}`)} T={T} lang={lang} />}
              {selEdge && (
                <EdgeStyleSheet
                  edge={selEdge}
                  onChange={(p) => patchEdge(selEdge.id, p, `estyle:${selEdge.id}`)}
                  onLabel={() => setTextEdit({ kind: 'edge', id: selEdge.id })}
                  onReverse={() => patchEdge(selEdge.id, { from: selEdge.to, to: selEdge.from })}
                  onRemove={removeSelected}
                  T={T}
                />
              )}
            </div>
          )}
          <div className="flex items-center justify-around px-2 pt-1.5">
            {!sel && (
              <>
                <button type="button" onClick={addNode} className={barBtn()} data-testid="mm-add-node"><Plus size={20} />{T.addNode}</button>
                <button type="button" onClick={addNote} className={barBtn()} data-testid="mm-add-note"><StickyNote size={19} />{T.addNote}</button>
                <button type="button" onClick={addFrame} className={barBtn()} data-testid="mm-add-frame"><SquareDashed size={19} />{T.addFrame}</button>
                <button type="button" onClick={() => { setTool(tool === 'connect' ? 'select' : 'connect'); setConnectFrom(null); }} className={barBtn(tool === 'connect')} data-testid="mm-connect"><Spline size={19} />{T.connect}</button>
              </>
            )}
            {selNode && (
              <>
                <button type="button" onClick={() => setTextEdit({ kind: 'node', id: selNode.id })} className={barBtn(!!textEdit)} data-testid="mm-edit-text"><Type size={19} />{T.text}</button>
                <button type="button" onClick={() => setStyleOpen((v) => !v)} className={barBtn(styleOpen)} data-testid="mm-style"><Palette size={19} />{T.style}</button>
                {selNode.shape !== 'frame' && <button type="button" onClick={() => addChild(selNode)} className={barBtn()} data-testid="mm-add-child"><CornerDownRight size={19} />{T.child}</button>}
                <button type="button" onClick={() => { setTool('connect'); setConnectFrom(selNode.id); }} className={barBtn()} data-testid="mm-connect-from"><Spline size={19} />{T.connect}</button>
                <button type="button" onClick={duplicateSelected} className={barBtn()} data-testid="mm-duplicate"><Copy size={18} />{T.duplicate}</button>
                <button type="button" onClick={removeSelected} className={`${barBtn()} !text-[var(--color-danger)]`} data-testid="mm-remove"><Trash2 size={18} />{T.remove}</button>
              </>
            )}
            {selEdge && (
              <>
                <button type="button" onClick={() => setTextEdit({ kind: 'edge', id: selEdge.id })} className={barBtn(!!textEdit)} data-testid="mm-edge-text"><Type size={19} />{T.labelBtn}</button>
                <button type="button" onClick={() => setStyleOpen((v) => !v)} className={barBtn(styleOpen)} data-testid="mm-edge-style"><Palette size={19} />{T.style}</button>
                <button type="button" onClick={removeSelected} className={`${barBtn()} !text-[var(--color-danger)]`} data-testid="mm-remove"><Trash2 size={18} />{T.remove}</button>
              </>
            )}
            {sel && (
              <button type="button" onClick={() => { setSel(null); setStyleOpen(false); setTextEdit(null); }} aria-label={T.close} className={barBtn()} data-testid="mm-deselect"><ChevronDown size={20} /></button>
            )}
          </div>
        </div>
      </div>

      <Modal open={bgOpen} onClose={() => setBgOpen(false)} title={T.background}>
        <div className="flex flex-col gap-4" data-testid="mm-bg-modal">
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{T.bgKind}</p>
            <div className="flex gap-2 flex-wrap">
              {([['dots', T.bgDots], ['grid', T.bgGrid], ['lines', T.bgLines], ['plain', T.bgPlain]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => commit((m) => ({ ...m, bg: { ...m.bg, kind: k } }))} className={`px-4 py-2 rounded-full text-[13.5px] border ${map.bg.kind === k ? 'text-white border-transparent' : 'text-[var(--color-text)] border-[var(--color-border-strong)]'}`} style={map.bg.kind === k ? { background: 'var(--color-primary)' } : undefined} data-testid={`mm-bgkind-${k}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{T.bgTone}</p>
            <div className="flex gap-2.5 flex-wrap">
              {BG_TONES.map((t) => (
                <button key={t.id} type="button" onClick={() => commit((m) => ({ ...m, bg: { ...m.bg, tone: t.id } }))} aria-label={lang === 'en' ? t.en : t.de} className="w-10 h-10 rounded-full" style={{ background: t.color, border: `2px solid ${mixHex(t.color, '#000000', 0.18)}`, outline: map.bg.tone === t.id ? '3px solid var(--color-primary)' : 'none', outlineOffset: 2 }} data-testid={`mm-bgtone-${t.id}`} />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {printing && <MindmapPrintView map={map} lang={lang} />}
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

void approxTextWidth;
