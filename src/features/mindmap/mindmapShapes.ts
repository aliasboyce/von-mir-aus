/**
 * Formen der Mindmap: Umrisse (eckig oder abgerundet), Textfläche und der Punkt, an dem eine Linie die Form verlässt.
 * Reine Funktionen ohne Abhängigkeiten – das Modell, die Zeichnung und die Linien benutzen sie gemeinsam.
 */
export type Pt = [number, number];

/** all shape ids (the model re-exports this as MMShape) */
export type ShapeId =
  | 'rect' | 'rounded' | 'square' | 'pill' | 'oval' | 'circle' | 'diamond' | 'hexagon' | 'cloud' | 'note' | 'plain' | 'frame'
  | 'triangle' | 'pentagon' | 'octagon' | 'parallelogram' | 'trapezoid' | 'star' | 'heart' | 'arrow' | 'bubble' | 'cross' | 'banner'
  | 'image' | 'sticker' | 'draw' | 'doodle' | 'maplink'
  | 'todo' | 'table' | 'proscons' | 'appcard';

/** shapes that are round by themselves when `round` is not set (old maps keep their look) */
const LEGACY_ROUND = new Set<string>(['rounded', 'pill', 'frame', 'maplink']);
export const isRoundShape = (shape: string, round: boolean | undefined) => round ?? LEGACY_ROUND.has(shape);

/** shapes with a rounded variant (the "abgerundet" switch) */
export const ROUNDABLE = new Set<string>(['rect', 'rounded', 'square', 'note', 'frame', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'parallelogram', 'trapezoid', 'star', 'cross', 'arrow', 'banner', 'bubble', 'todo', 'table', 'proscons', 'appcard']);

/** these are drawn as an ellipse (and left along an ellipse) */
const ELLIPSE = new Set<string>(['oval', 'circle', 'cloud', 'heart']);

/** content blocks: card-like elements with their own inner layout */
export const BLOCK_SHAPES = new Set<string>(['todo', 'table', 'proscons', 'appcard']);

function fit(pts: Pt[], w: number, h: number): Pt[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const sx = w / (maxX - minX || 1);
  const sy = h / (maxY - minY || 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return pts.map(([x, y]) => [(x - cx) * sx, (y - cy) * sy] as Pt);
}
const regular = (n: number): Pt[] => Array.from({ length: n }, (_, i) => [Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n), Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n)] as Pt);
const starPts = (n: number, r2: number): Pt[] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : 1;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    return [Math.cos(a) * r, Math.sin(a) * r] as Pt;
  });

/** the outline of a polygon-like shape, centred on (0,0); null for round / free shapes */
export function polyOf(shape: string, w: number, h: number): Pt[] | null {
  const x = -w / 2;
  const y = -h / 2;
  switch (shape) {
    case 'triangle':
      return [[0, y], [-x, -y], [x, -y]];
    case 'diamond':
      return [[0, y], [-x, 0], [0, -y], [x, 0]];
    case 'pentagon':
      return fit(regular(5), w, h);
    case 'hexagon': {
      const i = Math.min(h * 0.5, w * 0.22);
      return [[x + i, y], [-x - i, y], [-x, 0], [-x - i, -y], [x + i, -y], [x, 0]];
    }
    case 'octagon': {
      const c = Math.min(w, h) * 0.29;
      return [[x + c, y], [-x - c, y], [-x, y + c], [-x, -y - c], [-x - c, -y], [x + c, -y], [x, -y - c], [x, y + c]];
    }
    case 'parallelogram': {
      const s = Math.min(w * 0.22, h * 0.7);
      return [[x + s, y], [-x, y], [-x - s, -y], [x, -y]];
    }
    case 'trapezoid': {
      const s = Math.min(w * 0.2, h * 0.7);
      return [[x + s, y], [-x - s, y], [-x, -y], [x, -y]];
    }
    case 'star':
      return fit(starPts(5, 0.46), w, h);
    case 'cross': {
      const a = w / 2;
      const b = h / 2;
      const t = Math.min(a, b) * 0.36;
      return [[-t, -b], [t, -b], [t, -t], [a, -t], [a, t], [t, t], [t, b], [-t, b], [-t, t], [-a, t], [-a, -t], [-t, -t]];
    }
    case 'arrow': {
      const neck = x + w * 0.58;
      return [[x, -h * 0.24], [neck, -h * 0.24], [neck, y], [-x, 0], [neck, -y], [neck, h * 0.24], [x, h * 0.24]];
    }
    case 'banner': {
      const n = Math.min(h * 0.32, w * 0.2);
      return [[x, y], [-x, y], [-x - n, 0], [-x, -y], [x, -y], [x + n, 0]];
    }
    case 'rect':
    case 'rounded':
    case 'square':
    case 'note':
    case 'image':
    case 'frame':
    case 'maplink':
    case 'plain':
    case 'bubble':
    case 'pill':
    case 'todo':
    case 'table':
    case 'proscons':
    case 'appcard':
      return [[x, y], [-x, y], [-x, -y], [x, -y]];
    default:
      return null;
  }
}

const f1 = (v: number) => Math.round(v * 10) / 10;

/** polygon with softly rounded corners (quadratic curves through the corner points) */
export function roundedPoly(pts: Pt[], r: number): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[(i - 1 + n) % n];
    const c = pts[i];
    const q = pts[(i + 1) % n];
    const d1 = Math.hypot(p[0] - c[0], p[1] - c[1]) || 1;
    const d2 = Math.hypot(q[0] - c[0], q[1] - c[1]) || 1;
    const rr1 = Math.min(r, d1 / 2.2, d2 / 2.2);
    const a: Pt = [c[0] + ((p[0] - c[0]) / d1) * rr1, c[1] + ((p[1] - c[1]) / d1) * rr1];
    const b: Pt = [c[0] + ((q[0] - c[0]) / d2) * rr1, c[1] + ((q[1] - c[1]) / d2) * rr1];
    d += `${i === 0 ? 'M' : ' L'} ${f1(a[0])} ${f1(a[1])} Q ${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}`;
  }
  return d + ' Z';
}
const sharpPoly = (pts: Pt[]) => 'M ' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ') + ' Z';

export function rr(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

function heartPath(w: number, h: number): string {
  // the doodle heart (x -48…48, y -38…40) stretched to the box
  const sx = w / 96;
  const sy = h / 78;
  const P = (x: number, y: number) => `${f1(x * sx)} ${f1((y - 1) * sy)}`;
  return `M ${P(0, 40)} C ${P(-50, 6)} ${P(-46, -38)} ${P(-22, -38)} C ${P(-8, -38)} ${P(0, -28)} ${P(0, -22)} C ${P(0, -28)} ${P(8, -38)} ${P(22, -38)} C ${P(46, -38)} ${P(50, 6)} ${P(0, 40)} Z`;
}

function bubblePath(w: number, h: number, round: boolean): string {
  const x = -w / 2;
  const y = -h / 2;
  const bh = h * 0.8;
  const r = round ? Math.min(14, bh / 3, w / 6) : 0;
  const tipX = x + w * 0.12;
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + bh - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + bh} H ${x + w * 0.4} L ${tipX} ${y + h} L ${x + w * 0.2} ${y + bh} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + bh - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

function cloudPath(w: number, h: number): string {
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

/** the outline path of a shape around (0,0); `round` = rounded corners (undefined = what the shape always had) */
export function shapePath(shape: string, w: number, h: number, round?: boolean): string {
  const x = -w / 2;
  const y = -h / 2;
  const rd = isRoundShape(shape, round);
  switch (shape) {
    case 'pill':
      return rr(x, y, w, h, h / 2);
    case 'rounded':
    case 'rect':
    case 'square':
    case 'todo':
    case 'table':
    case 'proscons':
    case 'appcard':
      return rr(x, y, w, h, rd ? Math.min(16, h / 3.2) : 0);
    case 'frame':
      return rr(x, y, w, h, rd ? 22 : 0);
    case 'maplink':
      return rr(x, y, w, h, rd ? 14 : 0);
    case 'note':
      return rr(x, y, w, h, round === true ? 12 : round === false ? 0 : 4);
    case 'image':
      return rr(x, y, w, h, 4);
    case 'oval':
    case 'circle':
      return `M ${x} 0 A ${w / 2} ${h / 2} 0 1 0 ${-x} 0 A ${w / 2} ${h / 2} 0 1 0 ${x} 0 Z`;
    case 'cloud':
      return cloudPath(w, h);
    case 'heart':
      return heartPath(w, h);
    case 'bubble':
      return bubblePath(w, h, rd);
    case 'plain':
    case 'sticker':
    case 'draw':
    case 'doodle':
      return '';
    default: {
      const poly = polyOf(shape, w, h);
      if (!poly) return '';
      return rd ? roundedPoly(poly, Math.min(w, h) * 0.13) : sharpPoly(poly);
    }
  }
}

function rayPoly(pts: Pt[], ux: number, uy: number): number | null {
  let best = Infinity;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (a[0] * ey - a[1] * ex) / den;
    const s = (a[0] * uy - a[1] * ux) / den;
    if (t > 1e-6 && s >= -1e-9 && s <= 1 + 1e-9 && t < best) best = t;
  }
  return Number.isFinite(best) ? best : null;
}

/** where a ray from the node centre towards (dx,dy) leaves the node outline */
export function boundaryOffset(shape: string, w: number, h: number, dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const hw = w / 2;
  const hh = h / 2;
  let t: number | null = null;
  if (ELLIPSE.has(shape)) {
    t = 1 / Math.sqrt((ux * ux) / (hw * hw) + (uy * uy) / (hh * hh));
  } else if (shape !== 'bubble' && shape !== 'pill') {
    const poly = polyOf(shape, w, h);
    if (poly && poly.length > 4) t = rayPoly(poly, ux, uy);
    else if (poly && shape === 'diamond') t = 1 / (Math.abs(ux) / hw + Math.abs(uy) / hh);
    else if (poly && shape === 'triangle') t = rayPoly(poly, ux, uy);
  }
  if (t === null || !Number.isFinite(t)) {
    t = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy));
  }
  return { x: ux * t, y: uy * t };
}

/**
 * How much room the text gets inside a shape (share of width / height), a vertical shift of the text block
 * (share of the height) and the lowest aspect ratio (height / width). Plain boxes need none of this.
 */
export interface ShapeFit {
  iw: number;
  ih: number;
  dy?: number;
  dx?: number;
  /** minimum height / width */
  min?: number;
  /** width = height */
  square?: boolean;
}
export const SHAPE_FIT: Partial<Record<string, ShapeFit>> = {
  square: { iw: 0.86, ih: 0.8, square: true },
  triangle: { iw: 0.5, ih: 0.5, dy: 0.17, min: 0.8 },
  pentagon: { iw: 0.7, ih: 0.62, dy: 0.06, min: 0.9 },
  octagon: { iw: 0.78, ih: 0.78, min: 0.8 },
  parallelogram: { iw: 0.72, ih: 0.86 },
  trapezoid: { iw: 0.7, ih: 0.86 },
  star: { iw: 0.4, ih: 0.4, dy: 0.05, square: true },
  heart: { iw: 0.56, ih: 0.46, dy: -0.04, min: 0.86 },
  arrow: { iw: 0.52, ih: 0.46, dx: -0.1, min: 0.55 },
  bubble: { iw: 0.86, ih: 0.64, dy: -0.1, min: 0.6 },
  cross: { iw: 0.34, ih: 0.34, square: true },
  banner: { iw: 0.78, ih: 0.72 },
};


/* ------------------------------------------------- frame and note outlines */

/** folder with a tab at the top left */
export function folderPath(w: number, h: number, tabW: number, tabH: number, round: boolean): string {
  const x = -w / 2;
  const y = -h / 2;
  const r = round ? Math.min(14, tabH / 2) : 0;
  const tw = Math.min(tabW, w - r * 2 - 4);
  return `M ${x + r} ${y} H ${x + tw - r} Q ${x + tw} ${y} ${x + tw + r * 0.6} ${y + tabH * 0.5} L ${x + tw + r * 0.9} ${y + tabH - r * 0.3} Q ${x + tw + r} ${y + tabH} ${x + tw + r * 2} ${y + tabH} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + tabH + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** four corner brackets only */
export function bracketsPath(w: number, h: number, len: number): string {
  const x = -w / 2;
  const y = -h / 2;
  const l = Math.min(len, w / 2.5, h / 2.5);
  return `M ${x} ${y + l} V ${y} H ${x + l} M ${-x - l} ${y} H ${-x} V ${y + l} M ${-x} ${-y - l} V ${-y} H ${-x - l} M ${x + l} ${-y} H ${x} V ${-y - l}`;
}

/** a soft, uneven blob that fills the box */
export function blobPath(w: number, h: number): string {
  const a = w / 2;
  const b = h / 2;
  const k = [1, 0.94, 1.04, 0.96, 1.02, 0.93, 1.05, 0.97];
  const pts = k.map((m, i) => {
    const t = (i / k.length) * Math.PI * 2;
    return [Math.cos(t) * a * m * 0.97, Math.sin(t) * b * m * 0.97] as Pt;
  });
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (i === 0) d += `M ${f1(p1[0])} ${f1(p1[1])}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + ' Z';
}

/** paper with a torn lower edge */
export function tornPath(w: number, h: number): string {
  const x = -w / 2;
  const y = -h / 2;
  const step = Math.max(10, w / 14);
  let d = `M ${x} ${y} H ${-x} V ${-y - 6}`;
  let i = 0;
  for (let px = -x; px > x + 1; px -= step, i++) {
    const nx = Math.max(x, px - step);
    d += ` L ${f1(px - step / 2)} ${f1(-y + (i % 2 ? -7 : 1))} L ${f1(nx)} ${f1(-y - 5 - (i % 3))}`;
  }
  return d + ' Z';
}
