import { approxTextWidth, wrapText } from '../../components/canvas/svgText';
import type { MMNode } from './mindmapModel';

/**
 * Inhalts-Karten der Mindmap: To-do-Liste, Tabelle, Pro & Contra und Karten aus der App.
 * Hier steht nur die Rechnung (Größe, Zeilen, Positionen); gezeichnet wird in MindmapScene.
 * Alle Koordinaten liegen relativ zur Mitte der Karte.
 */

export interface TodoItem {
  id: string;
  t: string;
  done?: boolean;
}
export type RefKind = 'skill' | 'tool' | 'resource' | 'contact' | 'letter' | 'project' | 'appointment';
export interface RefSnap {
  title: string;
  sub?: string;
  emoji: string;
  color: string;
  label: string;
}

const lines = (text: string, w: number, fs: number, f: number, max = 99) => {
  const l = text.trim() ? wrapText(text, Math.max(20, w) / f, fs) : [];
  return l.length > max ? [...l.slice(0, max - 1), l[max - 1].replace(/\s*\S{0,3}$/, '') + ' …'] : l;
};

/* ------------------------------------------------------------------ to-do */

export interface TodoLayout {
  w: number;
  h: number;
  pad: number;
  fs: number;
  lh: number;
  tfs: number;
  tlh: number;
  titleLines: string[];
  titleH: number;
  cr: number;
  textX: number;
  rows: { id: string; lines: string[]; top: number; h: number; cy: number; done: boolean; width: number[] }[];
}
export function todoLayout(n: Pick<MMNode, 'fw' | 'text' | 'items'>, fs: number, f: number): TodoLayout {
  const w = Math.max(160, n.fw ?? 270);
  const pad = fs * 0.95;
  const lh = fs * 1.3;
  const tfs = fs * 1.1;
  const tlh = tfs * 1.3;
  const cr = Math.max(8, fs * 0.62);
  const textX = -w / 2 + pad + cr * 2 + fs * 0.7;
  const titleLines = lines(n.text, w - 2 * pad, tfs, f);
  const titleH = titleLines.length ? titleLines.length * tlh + pad * 0.5 : 0;
  const items = n.items ?? [];
  const rows: TodoLayout['rows'] = [];
  let y = pad + titleH;
  for (const it of items) {
    const l = lines(it.t || '', w - 2 * pad - cr * 2 - fs * 1.4, fs, f);
    const rh = Math.max(l.length * lh, cr * 2 + 2) + fs * 0.55;
    rows.push({ id: it.id, lines: l, top: y, h: rh, cy: y + rh / 2, done: !!it.done, width: l.map((x) => approxTextWidth(x, fs) * f) });
    y += rh;
  }
  if (!items.length) y += fs * 2.2;
  const h = y + pad * 0.7;
  // convert to centre-relative
  const off = -h / 2;
  return { w, h, pad, fs, lh, tfs, tlh, titleLines, titleH, cr, textX, rows: rows.map((r) => ({ ...r, top: r.top + off, cy: r.cy + off })) };
}

/* ------------------------------------------------------------------ table */

export interface TableLayout {
  w: number;
  h: number;
  cols: number;
  colW: number;
  fs: number;
  lh: number;
  titleLines: string[];
  titleH: number;
  top: number;
  rows: { top: number; h: number; cells: string[][] }[];
}
export const defaultGrid = (): string[][] => [['', '', ''], ['', '', ''], ['', '', '']];
export function tableLayout(n: Pick<MMNode, 'fw' | 'text' | 'grid'>, fs: number, f: number): TableLayout {
  const grid = n.grid && n.grid.length ? n.grid : defaultGrid();
  const cols = Math.max(1, ...grid.map((r) => r.length));
  const w = Math.max(cols * 70, n.fw ?? Math.max(cols * 104, 240));
  const colW = w / cols;
  const lh = fs * 1.28;
  const titleLines = lines(n.text, w - fs * 1.4, fs * 1.1, f);
  const titleH = titleLines.length ? titleLines.length * fs * 1.4 + fs * 0.5 : 0;
  const rows: TableLayout['rows'] = [];
  let y = titleH;
  for (const r of grid) {
    const cells = Array.from({ length: cols }, (_, c) => lines(r[c] ?? '', colW - fs * 1.1, fs, f, 4));
    const rh = Math.max(fs * 2.3, Math.max(...cells.map((c) => c.length)) * lh + fs * 0.9);
    rows.push({ top: y, h: rh, cells });
    y += rh;
  }
  const h = y;
  return { w, h, cols, colW, fs, lh, titleLines, titleH, top: -h / 2, rows: rows.map((r) => ({ ...r, top: r.top - h / 2 })) };
}

/* ------------------------------------------------------------ pro & contra */

export interface ProsConsLayout {
  w: number;
  h: number;
  pad: number;
  fs: number;
  lh: number;
  colW: number;
  titleLines: string[];
  titleH: number;
  headH: number;
  headTop: number;
  pros: { lines: string[]; top: number; h: number }[];
  cons: { lines: string[]; top: number; h: number }[];
}
export function prosConsLayout(n: Pick<MMNode, 'fw' | 'text' | 'pros' | 'cons'>, fs: number, f: number): ProsConsLayout {
  const w = Math.max(220, n.fw ?? 320);
  const pad = fs * 0.85;
  const lh = fs * 1.28;
  const colW = (w - pad * 3) / 2;
  const titleLines = lines(n.text, w - 2 * pad, fs * 1.1, f);
  const titleH = titleLines.length ? titleLines.length * fs * 1.4 + pad * 0.4 : 0;
  const headH = fs * 2.2;
  const col = (list: string[], start: number) => {
    const out: ProsConsLayout['pros'] = [];
    let y = start;
    for (const t of list) {
      const l = lines(t, colW - fs * 1.5, fs, f);
      const hh = Math.max(1, l.length) * lh + fs * 0.45;
      out.push({ lines: l, top: y, h: hh });
      y += hh;
    }
    return { out, end: y };
  };
  const start = pad + titleH + headH + pad * 0.3;
  const pros = col(n.pros ?? [], start);
  const cons = col(n.cons ?? [], start);
  const end = Math.max(pros.end, cons.end, start + fs * 2);
  const h = end + pad * 0.8;
  const off = -h / 2;
  const sh = (a: ProsConsLayout['pros']) => a.map((r) => ({ ...r, top: r.top + off }));
  return { w, h, pad, fs, lh, colW, titleLines, titleH, headH, headTop: pad + titleH + off, pros: sh(pros.out), cons: sh(cons.out) };
}

/* ------------------------------------------------------------- app cards */

export interface AppCardLayout {
  w: number;
  h: number;
  pad: number;
  icon: number;
  fs: number;
  lh: number;
  labelY: number;
  titleLines: string[];
  titleY: number;
  subLines: string[];
  subY: number;
  textX: number;
}
export function appCardLayout(n: Pick<MMNode, 'fw'>, snap: Pick<RefSnap, 'title' | 'sub'> | undefined, fs: number, f: number): AppCardLayout {
  const w = Math.max(190, n.fw ?? 262);
  const pad = fs * 0.7;
  const icon = fs * 3.6;
  const lh = fs * 1.28;
  const textX = -w / 2 + pad + icon + fs * 0.8;
  const tw = w - pad * 2 - icon - fs * 0.8;
  const titleLines = lines(snap?.title ?? '', tw, fs * 1.05, f, 3);
  const subLines = lines(snap?.sub ?? '', tw, fs * 0.85, f, 2);
  const labelH = fs * 0.95;
  const textH = labelH + titleLines.length * lh + subLines.length * fs * 1.15 + (subLines.length ? fs * 0.2 : 0);
  const h = Math.max(icon + pad * 2, textH + pad * 2);
  const top = -h / 2 + (h - textH) / 2;
  const titleY = top + labelH + fs * 0.95;
  const subY = titleY + (titleLines.length - 1) * lh + fs * 1.15;
  return { w, h, pad, icon, fs, lh, labelY: top + fs * 0.7, titleLines, titleY, subLines, subY, textX };
}
