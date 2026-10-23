import { createId } from '../../services/storage/repository';
import { layoutNode, newEdge, nodesByZ, type MMEdge, type MMNode, type MindMap } from './mindmapModel';

/** The in-app clipboard of the mind map editor (survives opening another map – handy for moving things between maps). */
export interface MMClip {
  nodes: MMNode[];
  edges: MMEdge[];
  /** plain text of what was copied, so the system clipboard can be recognised as "the same thing" */
  text: string;
}
let CLIP: MMClip | null = null;
export const getClip = () => CLIP;
export const setClip = (c: MMClip | null) => {
  CLIP = c;
};

export function selectionBounds(nodes: MMNode[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const l = layoutNode(n);
    const r = ((n.rot ?? 0) * Math.PI) / 180;
    const hw = (Math.abs(Math.cos(r)) * l.w + Math.abs(Math.sin(r)) * l.h) / 2;
    const hh = (Math.abs(Math.sin(r)) * l.w + Math.abs(Math.cos(r)) * l.h) / 2;
    minX = Math.min(minX, n.x - hw);
    maxX = Math.max(maxX, n.x + hw);
    minY = Math.min(minY, n.y - hh);
    maxY = Math.max(maxY, n.y + hh);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/** the picked nodes plus everything that is grouped with them */
export function withGroupMates(nodes: MMNode[], ids: string[]): string[] {
  const set = new Set(ids);
  const groups = new Set(nodes.filter((n) => set.has(n.id) && n.grp).map((n) => n.grp as string));
  if (!groups.size) return ids;
  const out = [...ids];
  for (const n of nodes) if (n.grp && groups.has(n.grp) && !set.has(n.id)) out.push(n.id);
  return out;
}

/** what a copy of these nodes consists of: the nodes and the lines between them */
export function copyOf(map: Pick<MindMap, 'nodes' | 'edges'>, ids: string[]): { nodes: MMNode[]; edges: MMEdge[] } {
  const set = new Set(ids);
  return { nodes: nodesByZ(map.nodes).filter((n) => set.has(n.id)).map((n) => ({ ...n })), edges: map.edges.filter((e) => set.has(e.from) && set.has(e.to)).map((e) => ({ ...e })) };
}

/** fresh ids (nodes, lines, groups) and a shifted position; the layout between the pieces stays as it was */
export function instantiate(clip: { nodes: MMNode[]; edges: MMEdge[] }, shift: { dx: number; dy: number }): { nodes: MMNode[]; edges: MMEdge[] } {
  const idMap = new Map<string, string>();
  const grpMap = new Map<string, string>();
  const nodes = clip.nodes.map((n) => {
    const id = createId('mmn');
    idMap.set(n.id, id);
    let grp = n.grp;
    if (grp) {
      if (!grpMap.has(grp)) grpMap.set(grp, createId('grp'));
      grp = grpMap.get(grp);
    }
    return { ...n, id, grp, x: Math.round(n.x + shift.dx), y: Math.round(n.y + shift.dy), z: undefined };
  });
  const edges = clip.edges
    .filter((e) => idMap.has(e.from) && idMap.has(e.to))
    .map((e) => newEdge(idMap.get(e.from) as string, idMap.get(e.to) as string, { ...e, id: createId('mme'), from: idMap.get(e.from) as string, to: idMap.get(e.to) as string }));
  return { nodes, edges };
}

/** a short text for the system clipboard (so "paste" in another app gives something sensible) */
export function clipText(nodes: MMNode[]): string {
  return nodes
    .map((n) => n.text.trim())
    .filter(Boolean)
    .join('\n');
}

/** scale a selection around its centre (positions and sizes) */
export function scaleNodes(nodes: MMNode[], ids: Set<string>, factor: number): MMNode[] {
  const picked = nodes.filter((n) => ids.has(n.id));
  const b = selectionBounds(picked);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    const x = Math.round(cx + (n.x - cx) * factor);
    const y = Math.round(cy + (n.y - cy) * factor);
    if (n.shape === 'frame' || n.shape === 'maplink') {
      const l = layoutNode(n);
      return { ...n, x, y, fw: Math.round(Math.min(3000, Math.max(80, l.w * factor))), fh: Math.round(Math.min(3000, Math.max(60, l.h * factor))) };
    }
    return { ...n, x, y, sc: Math.round(Math.min(8, Math.max(0.2, (n.sc ?? 1) * factor)) * 1000) / 1000 };
  });
}

/** rotate a selection around its centre */
export function rotateNodes(nodes: MMNode[], ids: Set<string>, deg: number): MMNode[] {
  const picked = nodes.filter((n) => ids.has(n.id));
  const b = selectionBounds(picked);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    const dx = n.x - cx;
    const dy = n.y - cy;
    const rot = n.shape === 'frame' ? n.rot : (((n.rot ?? 0) + deg) % 360 + 360) % 360;
    return { ...n, x: Math.round(cx + dx * c - dy * s), y: Math.round(cy + dx * s + dy * c), rot: rot ? Math.round(rot * 10) / 10 : undefined };
  });
}

/** the pieces for a new mind map: moved to the middle, lines between them kept */
export function mapPartsFor(map: Pick<MindMap, 'nodes' | 'edges'>, ids: string[]): { nodes: MMNode[]; edges: MMEdge[] } {
  const part = copyOf(map, ids);
  const b = selectionBounds(part.nodes);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return { nodes: part.nodes.map((n) => ({ ...n, x: Math.round(n.x - cx), y: Math.round(n.y - cy), z: undefined })), edges: part.edges };
}

/** all maps below `id` (children, grandchildren …) */
export function descendantsOf(maps: MindMap[], id: string): string[] {
  const out: string[] = [];
  const walk = (pid: string, depth: number) => {
    if (depth > 12) return;
    for (const m of maps) {
      if (m.parentId === pid && !out.includes(m.id)) {
        out.push(m.id);
        walk(m.id, depth + 1);
      }
    }
  };
  walk(id, 0);
  return out;
}
