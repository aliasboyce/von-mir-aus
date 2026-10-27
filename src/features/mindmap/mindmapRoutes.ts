import { boundaryOffset } from './mindmapShapes';

/* ------------------------------------------------------------ arrow heads */

export type MMHead = 'none' | 'arrow' | 'stealth' | 'open' | 'triangleOpen' | 'circle' | 'circleOpen' | 'diamond' | 'diamondOpen' | 'square' | 'bar' | 'crow' | 'slash' | 'heart' | 'star';

export const HEADS: { id: MMHead; de: string; en: string }[] = [
  { id: 'none', de: 'Ohne', en: 'None' },
  { id: 'arrow', de: 'Pfeil', en: 'Arrow' },
  { id: 'stealth', de: 'Spitze', en: 'Dart' },
  { id: 'open', de: 'Offen', en: 'Open' },
  { id: 'triangleOpen', de: 'Dreieck hohl', en: 'Hollow triangle' },
  { id: 'circle', de: 'Punkt', en: 'Dot' },
  { id: 'circleOpen', de: 'Kreis', en: 'Circle' },
  { id: 'diamond', de: 'Raute', en: 'Diamond' },
  { id: 'diamondOpen', de: 'Raute hohl', en: 'Hollow diamond' },
  { id: 'square', de: 'Quadrat', en: 'Square' },
  { id: 'bar', de: 'Strich', en: 'Bar' },
  { id: 'crow', de: 'Gabel', en: 'Fork' },
  { id: 'slash', de: 'Schrägstrich', en: 'Slash' },
  { id: 'heart', de: 'Herz', en: 'Heart' },
  { id: 'star', de: 'Stern', en: 'Star' },
];

/** how a head is drawn: solid = filled with the line colour, hollow = filled with the page colour, line = strokes only */
export interface HeadShape {
  d: string;
  kind: 'solid' | 'hollow' | 'line';
}
const n1 = (v: number) => Math.round(v * 100) / 100;

/** the head in its own frame: the tip sits at (0,0) and points along +x */
export function headShape(head: MMHead, s: number): HeadShape | null {
  const a = (x: number, y: number) => `${n1(x * s)} ${n1(y * s)}`;
  switch (head) {
    case 'arrow':
      return { d: `M 0 0 L ${a(-0.913, -0.408)} L ${a(-0.913, 0.408)} Z`, kind: 'solid' };
    case 'triangleOpen':
      return { d: `M 0 0 L ${a(-0.913, -0.408)} L ${a(-0.913, 0.408)} Z`, kind: 'hollow' };
    case 'stealth':
      return { d: `M 0 0 L ${a(-1, -0.5)} L ${a(-0.68, 0)} L ${a(-1, 0.5)} Z`, kind: 'solid' };
    case 'open':
      return { d: `M ${a(-0.9, -0.5)} L 0 0 L ${a(-0.9, 0.5)}`, kind: 'line' };
    case 'circle':
    case 'circleOpen':
      return { d: `M ${a(-0.9, 0)} a ${n1(0.45 * s)} ${n1(0.45 * s)} 0 1 0 ${n1(0.9 * s)} 0 a ${n1(0.45 * s)} ${n1(0.45 * s)} 0 1 0 ${n1(-0.9 * s)} 0 Z`, kind: head === 'circle' ? 'solid' : 'hollow' };
    case 'diamond':
    case 'diamondOpen':
      return { d: `M 0 0 L ${a(-0.5, -0.36)} L ${a(-1, 0)} L ${a(-0.5, 0.36)} Z`, kind: head === 'diamond' ? 'solid' : 'hollow' };
    case 'square':
      return { d: `M 0 ${n1(-0.4 * s)} L ${a(-0.8, -0.4)} L ${a(-0.8, 0.4)} L 0 ${n1(0.4 * s)} Z`, kind: 'solid' };
    case 'bar':
      return { d: `M 0 ${n1(-0.6 * s)} L 0 ${n1(0.6 * s)}`, kind: 'line' };
    case 'crow':
      return { d: `M ${a(-1, 0)} L ${a(0, -0.5)} M ${a(-1, 0)} L 0 0 M ${a(-1, 0)} L ${a(0, 0.5)}`, kind: 'line' };
    case 'slash':
      return { d: `M ${a(-0.35, 0.55)} L ${a(0.15, -0.55)}`, kind: 'line' };
    case 'heart': {
      const k = (1.2 * s) / 96;
      // tip of the heart towards the target: (x,y) of the upright heart → (y-40, x)
      const P = (x: number, y: number) => `${n1((y - 40) * k)} ${n1(x * k)}`;
      return { d: `M ${P(0, 40)} C ${P(-50, 6)} ${P(-46, -38)} ${P(-22, -38)} C ${P(-8, -38)} ${P(0, -28)} ${P(0, -22)} C ${P(0, -28)} ${P(8, -38)} ${P(22, -38)} C ${P(46, -38)} ${P(50, 6)} ${P(0, 40)} Z`, kind: 'solid' };
    }
    case 'star': {
      const r = 0.6 * s;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const rr = i % 2 ? r * 0.46 : r;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        return `${n1(-r + Math.cos(ang) * rr)} ${n1(Math.sin(ang) * rr)}`;
      });
      return { d: 'M ' + pts.join(' L ') + ' Z', kind: 'solid' };
    }
    default:
      return null;
  }
}

/** which heads a line has: new fields win, the old "arrow" setting is the fallback */
export function headsOf(e: { arrow: 'none' | 'end' | 'both'; h0?: MMHead; h1?: MMHead }): { h0: MMHead; h1: MMHead } {
  return {
    h0: e.h0 ?? (e.arrow === 'both' ? 'arrow' : 'none'),
    h1: e.h1 ?? (e.arrow === 'end' || e.arrow === 'both' ? 'arrow' : 'none'),
  };
}

/* ----------------------------------------------------------------- routes */

export type MMRoute = 'auto' | 'angle' | 'elbow' | 'elbowR' | 'scurve' | 'wave' | 'zigzag';

export const ROUTES: { id: MMRoute; de: string; en: string }[] = [
  { id: 'auto', de: 'Gerade / Bogen', en: 'Straight / arc' },
  { id: 'angle', de: 'Winkel', en: 'Angle' },
  { id: 'elbow', de: 'Rechtwinklig', en: 'Right angle' },
  { id: 'elbowR', de: 'Rechtwinklig rund', en: 'Soft right angle' },
  { id: 'scurve', de: 'S-Kurve', en: 'S-curve' },
  { id: 'wave', de: 'Welle', en: 'Wave' },
  { id: 'zigzag', de: 'Zickzack', en: 'Zigzag' },
];

export interface EdgeGeometry {
  path: string;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  /** the middle of the line (labels sit here) */
  mid: { x: number; y: number };
  /** direction in which the line leaves its ends (radians, pointing outwards) */
  a0: number;
  a1: number;
  /** where the grab handle sits */
  handle: { x: number; y: number };
}

interface NodeLike {
  x: number;
  y: number;
  shape: string;
}
interface Box {
  w: number;
  h: number;
}
export interface RouteEdge {
  bend: number;
  route?: MMRoute;
  amp?: number;
}

const GAP = 4;
type P = { x: number; y: number };

function polyline(pts: P[], r: number): string {
  // drop repeated points
  const q = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.5);
  if (q.length < 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  if (r <= 0 || q.length < 3) return 'M ' + q.map((p) => `${p.x} ${p.y}`).join(' L ');
  let d = `M ${q[0].x} ${q[0].y}`;
  for (let i = 1; i < q.length - 1; i++) {
    const p = q[i - 1];
    const c = q[i];
    const n = q[i + 1];
    const d1 = Math.hypot(c.x - p.x, c.y - p.y);
    const d2 = Math.hypot(n.x - c.x, n.y - c.y);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const a = { x: c.x + ((p.x - c.x) / d1) * rr, y: c.y + ((p.y - c.y) / d1) * rr };
    const b = { x: c.x + ((n.x - c.x) / d2) * rr, y: c.y + ((n.y - c.y) / d2) * rr };
    d += ` L ${n1(a.x)} ${n1(a.y)} Q ${c.x} ${c.y} ${n1(b.x)} ${n1(b.y)}`;
  }
  const last = q[q.length - 1];
  return d + ` L ${last.x} ${last.y}`;
}

/** straight base line between two nodes, leaving each along the outline */
function straightAnchors(from: NodeLike, to: NodeLike, lf: Box, lt: Box): { p0: P; p1: P; len: number; ux: number; uy: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const o0 = boundaryOffset(from.shape, lf.w, lf.h, dx, dy);
  const o1 = boundaryOffset(to.shape, lt.w, lt.h, -dx, -dy);
  const ux = dx / len;
  const uy = dy / len;
  const p0 = { x: from.x + o0.x + ux * GAP, y: from.y + o0.y + uy * GAP };
  const p1 = { x: to.x + o1.x - ux * GAP, y: to.y + o1.y - uy * GAP };
  return { p0, p1, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), ux, uy };
}

/** elbow / S-curve ends: out of the side that faces the other node */
function sideAnchors(from: NodeLike, to: NodeLike, lf: Box, lt: Box): { horizontal: boolean; p0: P; p1: P } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const horizontal = Math.abs(dx) * 0.8 >= Math.abs(dy) || (Math.abs(dx) > (lf.w + lt.w) / 2 + 20 && Math.abs(dy) < (lf.h + lt.h) / 2);
  if (horizontal) {
    const s = dx >= 0 ? 1 : -1;
    return { horizontal, p0: { x: from.x + s * (lf.w / 2 + GAP), y: from.y }, p1: { x: to.x - s * (lt.w / 2 + GAP), y: to.y } };
  }
  const s = dy >= 0 ? 1 : -1;
  return { horizontal, p0: { x: from.x, y: from.y + s * (lf.h / 2 + GAP) }, p1: { x: to.x, y: to.y - s * (lt.h / 2 + GAP) } };
}

export function routeGeometry(e: RouteEdge, from: NodeLike, to: NodeLike, lf: Box, lt: Box, bend = e.bend): EdgeGeometry {
  const route = e.route ?? 'auto';
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  if (route === 'elbow' || route === 'elbowR' || route === 'scurve') {
    const { horizontal, p0, p1 } = sideAnchors(from, to, lf, lt);
    const off = Math.max(-600, Math.min(600, bend));
    const c = horizontal ? (p0.x + p1.x) / 2 + off : (p0.y + p1.y) / 2 + off;
    if (route === 'scurve') {
      const c1 = horizontal ? { x: c, y: p0.y } : { x: p0.x, y: c };
      const c2 = horizontal ? { x: c, y: p1.y } : { x: p1.x, y: c };
      const mid = { x: (p0.x + 3 * c1.x + 3 * c2.x + p1.x) / 8, y: (p0.y + 3 * c1.y + 3 * c2.y + p1.y) / 8 };
      return {
        path: `M ${n1(p0.x)} ${n1(p0.y)} C ${n1(c1.x)} ${n1(c1.y)} ${n1(c2.x)} ${n1(c2.y)} ${n1(p1.x)} ${n1(p1.y)}`,
        p0,
        p1,
        mid,
        handle: mid,
        a1: Math.atan2(p1.y - c2.y, p1.x - c2.x),
        a0: Math.atan2(p0.y - c1.y, p0.x - c1.x),
      };
    }
    const pts: P[] = horizontal ? [p0, { x: c, y: p0.y }, { x: c, y: p1.y }, p1] : [p0, { x: p0.x, y: c }, { x: p1.x, y: c }, p1];
    const mid = horizontal ? { x: c, y: (p0.y + p1.y) / 2 } : { x: (p0.x + p1.x) / 2, y: c };
    const path = polyline(pts, route === 'elbowR' ? 22 : 0);
    // the ends point along the first / last piece
    const a1 = horizontal ? Math.atan2(0, p1.x - c || (dx >= 0 ? 1 : -1)) : Math.atan2(p1.y - c || (dy >= 0 ? 1 : -1), 0);
    const a0 = horizontal ? Math.atan2(0, p0.x - c || (dx >= 0 ? -1 : 1)) : Math.atan2(p0.y - c || (dy >= 0 ? -1 : 1), 0);
    return { path, p0, p1, mid, handle: mid, a1, a0 };
  }

  if (route === 'wave' || route === 'zigzag') {
    const { p0, p1, len: L, ux, uy } = straightAnchors(from, to, lf, lt);
    const A = Math.max(2, Math.min(60, e.amp ?? 9));
    const lambda = route === 'wave' ? Math.max(26, A * 5) : Math.max(20, A * 3.2);
    const px = -uy;
    const py = ux;
    const pts: P[] = [];
    if (route === 'wave') {
      const steps = Math.max(8, Math.ceil(L / 3));
      for (let i = 0; i <= steps; i++) {
        const s = (i / steps) * L;
        const env = Math.min(1, s / (lambda / 2), (L - s) / (lambda / 2));
        const o = Math.sin((2 * Math.PI * s) / lambda) * A * Math.max(0, env);
        pts.push({ x: n1(p0.x + ux * s + px * o), y: n1(p0.y + uy * s + py * o) });
      }
    } else {
      pts.push(p0);
      let k = 0;
      for (let s = lambda / 4; s < L - lambda / 4; s += lambda / 2, k++) {
        const o = (k % 2 ? -1 : 1) * A;
        pts.push({ x: n1(p0.x + ux * s + px * o), y: n1(p0.y + uy * s + py * o) });
      }
      pts.push(p1);
    }
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    return {
      path: 'M ' + pts.map((p) => `${p.x} ${p.y}`).join(' L '),
      p0,
      p1,
      mid,
      handle: { x: mid.x + px * A, y: mid.y + py * A },
      a1: Math.atan2(uy, ux),
      a0: Math.atan2(-uy, -ux),
    };
  }

  // straight, arc (quadratic) or angle (one corner at the pulled point)
  const angle = route === 'angle';
  const cx = angle ? mx + nx * bend : mx + nx * bend * 2;
  const cy = angle ? my + ny * bend : my + ny * bend * 2;
  const o0 = boundaryOffset(from.shape, lf.w, lf.h, cx - from.x, cy - from.y);
  const o1 = boundaryOffset(to.shape, lt.w, lt.h, cx - to.x, cy - to.y);
  const u0 = Math.hypot(cx - from.x, cy - from.y) || 1;
  const u1 = Math.hypot(cx - to.x, cy - to.y) || 1;
  const p0 = { x: from.x + o0.x + ((cx - from.x) / u0) * GAP, y: from.y + o0.y + ((cy - from.y) / u0) * GAP };
  const p1 = { x: to.x + o1.x + ((cx - to.x) / u1) * GAP, y: to.y + o1.y + ((cy - to.y) / u1) * GAP };
  const straight = Math.abs(bend) < 0.5;
  const path = straight ? `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}` : angle ? `M ${p0.x} ${p0.y} L ${cx} ${cy} L ${p1.x} ${p1.y}` : `M ${p0.x} ${p0.y} Q ${cx} ${cy} ${p1.x} ${p1.y}`;
  const mid = straight ? { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 } : angle ? { x: cx, y: cy } : { x: 0.25 * p0.x + 0.5 * cx + 0.25 * p1.x, y: 0.25 * p0.y + 0.5 * cy + 0.25 * p1.y };
  const c = straight ? { x: p1.x, y: p1.y } : { x: cx, y: cy };
  const c0 = straight ? { x: p0.x, y: p0.y } : { x: cx, y: cy };
  return {
    path,
    p0,
    p1,
    mid,
    handle: mid,
    a1: Math.atan2(p1.y - c.y, p1.x - c.x),
    a0: Math.atan2(p0.y - (straight ? p1.y : c0.y), p0.x - (straight ? p1.x : c0.x)),
  };
}

/** what dragging the handle to a world point changes on the line */
export function dragEdgeHandle(e: RouteEdge, from: NodeLike, to: NodeLike, lf: Box, lt: Box, p: P): { bend?: number; amp?: number } {
  const route = e.route ?? 'auto';
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const proj = (p.x - mx) * (-dy / len) + (p.y - my) * (dx / len);
  if (route === 'wave' || route === 'zigzag') return { amp: Math.round(Math.max(2, Math.min(60, Math.abs(proj)))) };
  if (route === 'elbow' || route === 'elbowR' || route === 'scurve') {
    const { horizontal, p0, p1 } = sideAnchors(from, to, lf, lt);
    const base = horizontal ? (p0.x + p1.x) / 2 : (p0.y + p1.y) / 2;
    const off = (horizontal ? p.x : p.y) - base;
    return { bend: Math.abs(off) < 8 ? 0 : Math.max(-600, Math.min(600, Math.round(off))) };
  }
  const bend = Math.max(-400, Math.min(400, proj));
  return { bend: Math.abs(bend) < 8 ? 0 : Math.round(bend) };
}
