import { approxTextWidth, wrapText } from '../../components/canvas/svgText';
import { createRepository, createId } from '../../services/storage/repository';

/* ------------------------------------------------------------------ types */

export type MMShape = 'rounded' | 'pill' | 'oval' | 'circle' | 'diamond' | 'hexagon' | 'cloud' | 'note' | 'plain' | 'frame';
export type MMLook = 'solid' | 'soft' | 'outline';
export type MMDash = 'solid' | 'dashed' | 'dotted';
export type MMArrow = 'none' | 'end' | 'both';
export type MMBgKind = 'plain' | 'dots' | 'grid' | 'lines';

export interface MMNode {
  id: string;
  x: number;
  y: number;
  text: string;
  shape: MMShape;
  color: string;
  look: MMLook;
  /** 1 = S … 4 = XL */
  size: 1 | 2 | 3 | 4;
  symbol?: string;
  /** only for frames (cluster areas): free width/height */
  fw?: number;
  fh?: number;
}

export interface MMEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  color: string;
  dash: MMDash;
  /** 1 thin, 2 normal, 3 thick */
  width: 1 | 2 | 3;
  arrow: MMArrow;
  /** sideways bend in world px (0 = straight) */
  bend: number;
  /** dashes keep flowing along the line */
  flow?: boolean;
}

export interface MindMap {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  bg: { kind: MMBgKind; tone: string };
  nodes: MMNode[];
  edges: MMEdge[];
  view?: { scale: number; tx: number; ty: number };
}

export const mindmapRepo = createRepository<MindMap>('mindmaps');

/* ------------------------------------------------------------- constants */

export const SHAPES: { id: MMShape; de: string; en: string }[] = [
  { id: 'rounded', de: 'Rechteck', en: 'Rectangle' },
  { id: 'pill', de: 'Kapsel', en: 'Pill' },
  { id: 'oval', de: 'Oval', en: 'Oval' },
  { id: 'circle', de: 'Kreis', en: 'Circle' },
  { id: 'diamond', de: 'Raute', en: 'Diamond' },
  { id: 'hexagon', de: 'Sechseck', en: 'Hexagon' },
  { id: 'cloud', de: 'Wolke', en: 'Cloud' },
  { id: 'note', de: 'Notizzettel', en: 'Sticky note' },
  { id: 'plain', de: 'Nur Text', en: 'Text only' },
  { id: 'frame', de: 'Rahmen / Cluster', en: 'Frame / cluster' },
];

export const BG_TONES: { id: string; color: string; de: string; en: string }[] = [
  { id: 'paper', color: '#fbf8f1', de: 'Papier', en: 'Paper' },
  { id: 'white', color: '#ffffff', de: 'Weiß', en: 'White' },
  { id: 'mint', color: '#eaf3ee', de: 'Mint', en: 'Mint' },
  { id: 'sky', color: '#e8f0f7', de: 'Himmel', en: 'Sky' },
  { id: 'blush', color: '#f7ebee', de: 'Rosé', en: 'Blush' },
  { id: 'lavender', color: '#efe9f6', de: 'Lavendel', en: 'Lavender' },
  { id: 'sand', color: '#f3ecdc', de: 'Sand', en: 'Sand' },
  { id: 'night', color: '#23282e', de: 'Nacht', en: 'Night' },
];
export const bgColor = (tone: string) => BG_TONES.find((t) => t.id === tone)?.color ?? BG_TONES[0].color;

const FONT: Record<number, number> = { 1: 13, 2: 16, 3: 20, 4: 27 };
const BASIS: Record<number, number> = { 1: 120, 2: 168, 3: 224, 4: 300 };
export const STROKE: Record<number, number> = { 1: 2, 2: 3.5, 3: 6 };

/* ------------------------------------------------------------ colour utils */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [120, 140, 130];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
}
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** text colour that reads well on a background */
export const readableOn = (bg: string) => (luminance(bg) > 0.42 ? '#26231f' : '#ffffff');

export interface NodeStyle {
  fill: string;
  stroke: string;
  text: string;
  strokeWidth: number;
}
export function nodeStyle(n: MMNode, bg: string): NodeStyle {
  const dark = luminance(bg) < 0.25;
  if (n.shape === 'plain') return { fill: 'none', stroke: 'none', text: n.look === 'solid' || n.look === 'outline' ? n.color : dark ? '#f1ede4' : '#26231f', strokeWidth: 0 };
  if (n.shape === 'frame') return { fill: mixHex(n.color, dark ? '#23282e' : '#ffffff', dark ? 0.78 : 0.86), stroke: n.color, text: dark ? '#f1ede4' : mixHex(n.color, '#000000', 0.45), strokeWidth: 2 };
  if (n.look === 'solid') return { fill: n.color, stroke: mixHex(n.color, '#000000', 0.12), text: readableOn(n.color), strokeWidth: 1.2 };
  if (n.look === 'soft') {
    const fill = mixHex(n.color, dark ? '#23282e' : '#ffffff', dark ? 0.55 : 0.78);
    return { fill, stroke: n.color, text: readableOn(fill), strokeWidth: 2 };
  }
  return { fill: dark ? '#23282e' : '#ffffff', stroke: n.color, text: dark ? '#f1ede4' : '#26231f', strokeWidth: 3 };
}

/* ----------------------------------------------------------------- layout */

export interface NodeLayout {
  w: number;
  h: number;
  lines: string[];
  fs: number;
  lh: number;
  symbolSize: number;
  /** y offset (from node centre) of the first text baseline */
  textTop: number;
  symbolY: number;
}

export function layoutNode(n: MMNode): NodeLayout {
  const fs = FONT[n.size] ?? 16;
  const lh = fs * 1.28;
  const basis = BASIS[n.size] ?? 168;
  const symbolSize = n.symbol ? fs * (n.text.trim() ? 1.9 : 3) : 0;
  const padX = fs * 0.95;
  const padY = fs * 0.72;

  if (n.shape === 'frame') {
    const w = n.fw ?? 380;
    const h = n.fh ?? 250;
    const lines = n.text.trim() ? wrapText(n.text, w - 2 * padX - 24, fs) : [];
    return { w, h, lines, fs, lh, symbolSize: 0, textTop: -h / 2 + padY + fs * 0.9, symbolY: 0 };
  }

  const textW =
    n.shape === 'diamond' ? basis * 0.62
    : n.shape === 'circle' ? basis * 0.68
    : n.shape === 'oval' || n.shape === 'cloud' ? basis * 0.8
    : n.shape === 'hexagon' ? basis * 0.86
    : basis - 2 * padX;
  const lines = n.text.trim() ? wrapText(n.text, textW, fs) : [];
  const widest = lines.reduce((m, l) => Math.max(m, approxTextWidth(l, fs)), 0);
  const symbolBlock = n.symbol ? symbolSize + (lines.length ? fs * 0.15 : 0) : 0;
  const contentH = symbolBlock + lines.length * lh || lh;
  const contentW = Math.max(widest, symbolSize);

  let w: number;
  let h: number;
  switch (n.shape) {
    case 'circle': {
      const d = Math.max(basis * 0.62, contentW / 0.7 + padX, (contentH + padY * 2) * 1.05);
      w = d;
      h = d;
      break;
    }
    case 'diamond':
      w = Math.max(basis * 0.8, contentW / 0.62 + padX);
      h = Math.max(w * 0.62, contentH / 0.55 + padY);
      break;
    case 'oval':
    case 'cloud':
      w = Math.max(basis * 0.6, contentW / 0.8 + padX * 1.4);
      h = Math.max(w * (n.shape === 'cloud' ? 0.6 : 0.5), contentH + padY * (n.shape === 'cloud' ? 3.2 : 2.2));
      break;
    case 'hexagon':
      w = Math.max(basis * 0.55, contentW + padX * 2.8);
      h = contentH + padY * 2.2;
      break;
    case 'plain':
      w = Math.max(fs * 3, contentW + padX * 0.6);
      h = contentH + padY * 0.8;
      break;
    case 'note':
      w = Math.max(basis * 0.7, contentW + padX * 2);
      h = Math.max(w * 0.72, contentH + padY * 2.4);
      break;
    case 'pill':
      h = contentH + padY * 1.8;
      w = Math.max(basis * 0.5, contentW + padX * 2 + h * 0.4);
      break;
    default:
      w = Math.max(basis * 0.55, contentW + padX * 2);
      h = contentH + padY * 2;
  }
  const top = -contentH / 2;
  return {
    w,
    h,
    lines,
    fs,
    lh,
    symbolSize,
    symbolY: top + symbolSize * 0.5,
    textTop: top + symbolBlock + lh * 0.78,
  };
}

/* --------------------------------------------------------------- outlines */

export function shapePath(shape: MMShape, w: number, h: number): string {
  const x = -w / 2;
  const y = -h / 2;
  switch (shape) {
    case 'pill':
      return rr(x, y, w, h, h / 2);
    case 'rounded':
      return rr(x, y, w, h, Math.min(16, h / 3.2));
    case 'frame':
      return rr(x, y, w, h, 22);
    case 'note':
      return rr(x, y, w, h, 4);
    case 'oval':
    case 'circle':
      return `M ${x} 0 A ${w / 2} ${h / 2} 0 1 0 ${-x} 0 A ${w / 2} ${h / 2} 0 1 0 ${x} 0 Z`;
    case 'diamond':
      return `M 0 ${y} L ${-x} 0 L 0 ${-y} L ${x} 0 Z`;
    case 'hexagon': {
      const i = Math.min(h * 0.5, w * 0.22);
      return `M ${x + i} ${y} L ${-x - i} ${y} L ${-x} 0 L ${-x - i} ${-y} L ${x + i} ${-y} L ${x} 0 Z`;
    }
    case 'cloud': {
      const N = 12;
      const a = (w / 2) * 0.9;
      const b = (h / 2) * 0.9;
      const pts = Array.from({ length: N }, (_, k) => {
        const t = (k / N) * Math.PI * 2;
        return [Math.cos(t) * a, Math.sin(t) * b];
      });
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let k = 0; k < N; k++) {
        const p = pts[(k + 1) % N];
        const q = pts[k];
        const r = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.62;
        d += ` A ${r} ${r} 0 0 1 ${p[0]} ${p[1]}`;
      }
      return d + ' Z';
    }
    default:
      return '';
  }
}
function rr(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** where a ray from the node centre towards (dx,dy) leaves the node outline */
export function boundaryOffset(shape: MMShape, w: number, h: number, dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  let t: number;
  const hw = w / 2;
  const hh = h / 2;
  if (shape === 'oval' || shape === 'circle' || shape === 'cloud') {
    t = 1 / Math.sqrt((ux * ux) / (hw * hw) + (uy * uy) / (hh * hh));
  } else if (shape === 'diamond') {
    t = 1 / (Math.abs(ux) / hw + Math.abs(uy) / hh);
  } else {
    t = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy));
  }
  return { x: ux * t, y: uy * t };
}

export interface EdgeGeometry {
  path: string;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  mid: { x: number; y: number };
  a0: number;
  a1: number;
}

export function edgeGeometry(e: MMEdge, from: MMNode, to: MMNode, lf: NodeLayout, lt: NodeLayout, bend = e.bend): EdgeGeometry {
  const gap = 4;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend * 2;
  const cy = my + (dx / len) * bend * 2;
  // leave and arrive towards the control point so bent lines meet the outline naturally
  const o0 = boundaryOffset(from.shape, lf.w, lf.h, cx - from.x, cy - from.y);
  const o1 = boundaryOffset(to.shape, lt.w, lt.h, cx - to.x, cy - to.y);
  const u0 = Math.hypot(cx - from.x, cy - from.y) || 1;
  const u1 = Math.hypot(cx - to.x, cy - to.y) || 1;
  const p0 = { x: from.x + o0.x + ((cx - from.x) / u0) * gap, y: from.y + o0.y + ((cy - from.y) / u0) * gap };
  const p1 = { x: to.x + o1.x + ((cx - to.x) / u1) * gap, y: to.y + o1.y + ((cy - to.y) / u1) * gap };
  const straight = Math.abs(bend) < 0.5;
  const path = straight ? `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}` : `M ${p0.x} ${p0.y} Q ${cx} ${cy} ${p1.x} ${p1.y}`;
  const mid = straight ? { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 } : { x: 0.25 * p0.x + 0.5 * cx + 0.25 * p1.x, y: 0.25 * p0.y + 0.5 * cy + 0.25 * p1.y };
  const c = straight ? { x: p1.x, y: p1.y } : { x: cx, y: cy };
  const c0 = straight ? { x: p0.x, y: p0.y } : { x: cx, y: cy };
  return {
    path,
    p0,
    p1,
    mid,
    a1: Math.atan2(p1.y - c.y, p1.x - c.x),
    a0: Math.atan2(p0.y - (straight ? p1.y : c0.y), p0.x - (straight ? p1.x : c0.x)),
  };
}

export function arrowHead(p: { x: number; y: number }, angle: number, size: number): string {
  const s = size;
  const a1 = angle + Math.PI - 0.42;
  const a2 = angle + Math.PI + 0.42;
  return `M ${p.x} ${p.y} L ${p.x + Math.cos(a1) * s} ${p.y + Math.sin(a1) * s} L ${p.x + Math.cos(a2) * s} ${p.y + Math.sin(a2) * s} Z`;
}

export function dashArray(dash: MMDash, width: number): string | undefined {
  if (dash === 'dashed') return `${width * 3.2} ${width * 2.4}`;
  if (dash === 'dotted') return `0.1 ${width * 2.2}`;
  return undefined;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
export function mapBounds(map: Pick<MindMap, 'nodes' | 'edges'>): Bounds {
  if (!map.nodes.length) return { minX: -200, minY: -150, maxX: 200, maxY: 150 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  map.nodes.forEach((n) => {
    const l = layoutNode(n);
    minX = Math.min(minX, n.x - l.w / 2);
    maxX = Math.max(maxX, n.x + l.w / 2);
    minY = Math.min(minY, n.y - l.h / 2);
    maxY = Math.max(maxY, n.y + l.h / 2);
  });
  // strongly bent lines and their labels can reach beyond the nodes
  map.edges.forEach((e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return;
    const g = edgeGeometry(e, a, b, layoutNode(a), layoutNode(b));
    minX = Math.min(minX, g.mid.x - 60);
    maxX = Math.max(maxX, g.mid.x + 60);
    minY = Math.min(minY, g.mid.y - 20);
    maxY = Math.max(maxY, g.mid.y + 20);
  });
  return { minX, minY, maxX, maxY };
}

/* ------------------------------------------------------------- creation */

export function newNode(partial: Partial<MMNode> & { x: number; y: number }): MMNode {
  return { id: createId('mmn'), text: '', shape: 'rounded', color: '#6aa08a', look: 'soft', size: 2, ...partial };
}
export function newEdge(from: string, to: string, partial: Partial<MMEdge> = {}): MMEdge {
  return { id: createId('mme'), from, to, color: '#8a8478', dash: 'solid', width: 2, arrow: 'none', bend: 0, ...partial };
}

export type Template = 'empty' | 'branches' | 'cluster';
export function newMap(title: string, template: Template, lang: 'de' | 'en'): MindMap {
  const now = new Date().toISOString();
  const map: MindMap = { id: createId('mm'), title, createdAt: now, updatedAt: now, bg: { kind: 'dots', tone: 'paper' }, nodes: [], edges: [] };
  const L = lang === 'en' ? { centre: 'My topic', a: 'Idea', b: 'Idea', c: 'Idea', d: 'Idea', cl: 'Group' } : { centre: 'Mein Thema', a: 'Idee', b: 'Idee', c: 'Idee', d: 'Idee', cl: 'Gruppe' };
  if (template === 'branches') {
    const c = newNode({ x: 0, y: 0, text: L.centre, shape: 'oval', color: '#3e7c63', look: 'solid', size: 3 });
    const colors = ['#e07a5f', '#4a8f9e', '#e8a83d', '#9a7bc4'];
    const kids = [
      [-300, -170],
      [300, -170],
      [-300, 170],
      [300, 170],
    ].map(([x, y], i) => newNode({ x, y, text: [L.a, L.b, L.c, L.d][i], shape: 'pill', color: colors[i], look: 'soft' }));
    map.nodes = [c, ...kids];
    map.edges = kids.map((k, i) => newEdge(c.id, k.id, { color: colors[i], width: 3, bend: i % 2 ? 14 : -14 }));
  } else if (template === 'cluster') {
    const f1 = newNode({ x: -230, y: 0, shape: 'frame', text: `${L.cl} 1`, color: '#4a8f9e', fw: 340, fh: 260 });
    const f2 = newNode({ x: 230, y: 0, shape: 'frame', text: `${L.cl} 2`, color: '#e07a5f', fw: 340, fh: 260 });
    const n1 = newNode({ x: -230, y: -10, shape: 'note', text: '', color: '#e8a83d', look: 'soft' });
    const n2 = newNode({ x: 230, y: -10, shape: 'note', text: '', color: '#e8a83d', look: 'soft' });
    map.nodes = [f1, f2, n1, n2];
  }
  return map;
}

/* ---------------------------------------------------------------- sharing */

export interface SharedMapPayload {
  v: 1;
  title: string;
  bg: MindMap['bg'];
  nodes: MMNode[];
  edges: MMEdge[];
  from?: string;
}

function toB64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(bytes as unknown as BufferSource).catch(() => {});
  writer.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

export function toPayload(map: MindMap, from?: string): SharedMapPayload {
  return { v: 1, title: map.title, bg: map.bg, nodes: map.nodes, edges: map.edges, from: from?.trim() || undefined };
}

/** "z." = deflate-compressed, "p." = plain (older browsers) */
export async function encodeMap(p: SharedMapPayload): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(p));
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'z.' + toB64(await pipe(raw, new CompressionStream('deflate-raw')));
    } catch {
      // plain fallback below
    }
  }
  return 'p.' + toB64(raw);
}

const SHAPE_IDS = SHAPES.map((s) => s.id) as string[];
const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const colorOk = (x: unknown, d: string) => (typeof x === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(x) ? x : d);

/** only known fields, sane sizes – whatever arrives in a link is treated as untrusted */
export function validatePayload(x: unknown): SharedMapPayload | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges) || o.nodes.length > 400 || o.edges.length > 800) return null;
  const nodes: MMNode[] = [];
  const ids = new Set<string>();
  for (const raw of o.nodes) {
    const r = raw as Record<string, unknown>;
    const id = str(r?.id, 60);
    if (!id || ids.has(id)) continue;
    ids.add(id);
    const size = num(r.size, 2);
    nodes.push({
      id,
      x: num(r.x),
      y: num(r.y),
      text: str(r.text, 400),
      shape: SHAPE_IDS.includes(r.shape as string) ? (r.shape as MMShape) : 'rounded',
      color: colorOk(r.color, '#6aa08a'),
      look: r.look === 'solid' || r.look === 'outline' ? r.look : 'soft',
      size: (size >= 1 && size <= 4 ? Math.round(size) : 2) as MMNode['size'],
      symbol: typeof r.symbol === 'string' && r.symbol ? str(r.symbol, 12) : undefined,
      fw: typeof r.fw === 'number' ? Math.min(3000, Math.max(80, r.fw)) : undefined,
      fh: typeof r.fh === 'number' ? Math.min(3000, Math.max(60, r.fh)) : undefined,
    });
  }
  const edges: MMEdge[] = [];
  for (const raw of o.edges) {
    const r = raw as Record<string, unknown>;
    const from = str(r?.from, 60);
    const to = str(r?.to, 60);
    if (!ids.has(from) || !ids.has(to) || from === to) continue;
    const w = num(r.width, 2);
    edges.push({
      id: str(r.id, 60) || createId('mme'),
      from,
      to,
      label: typeof r.label === 'string' && r.label ? str(r.label, 120) : undefined,
      color: colorOk(r.color, '#8a8478'),
      dash: r.dash === 'dashed' || r.dash === 'dotted' ? r.dash : 'solid',
      width: (w === 1 || w === 3 ? w : 2) as MMEdge['width'],
      arrow: r.arrow === 'end' || r.arrow === 'both' ? r.arrow : 'none',
      bend: Math.min(400, Math.max(-400, num(r.bend))),
      flow: r.flow === true ? true : undefined,
    });
  }
  const bgr = (o.bg ?? {}) as Record<string, unknown>;
  const kind = bgr.kind === 'plain' || bgr.kind === 'grid' || bgr.kind === 'lines' ? bgr.kind : 'dots';
  return {
    v: 1,
    title: str(o.title, 120) || 'Mindmap',
    bg: { kind, tone: BG_TONES.some((t) => t.id === bgr.tone) ? (bgr.tone as string) : 'paper' },
    nodes,
    edges,
    from: typeof o.from === 'string' ? str(o.from, 60) : undefined,
  };
}

export async function decodeMap(token: string): Promise<SharedMapPayload | null> {
  try {
    const t = token.trim();
    const kind = t.slice(0, 2);
    const bytes = fromB64(t.slice(2));
    let raw = bytes;
    if (kind === 'z.') raw = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (kind !== 'p.') return null;
    return validatePayload(JSON.parse(new TextDecoder().decode(raw)));
  } catch {
    return null;
  }
}

export function mapFromPayload(p: SharedMapPayload): MindMap {
  const now = new Date().toISOString();
  return { id: createId('mm'), title: p.title, createdAt: now, updatedAt: now, bg: p.bg, nodes: p.nodes, edges: p.edges };
}
