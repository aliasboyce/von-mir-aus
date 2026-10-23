import { seededRandom } from '../../hooks/seededRandom';
import type { NetworkEntry } from '../../data/types';

export interface Pt {
  x: number;
  y: number;
}

/** the "you" node sits at 0.5 / 0.5; one graph unit is the side of the square the net lives in */
export const CENTER: Pt = { x: 0.5, y: 0.5 };

/** is `parentId` a real, non-cyclic parent of this entry? */
export function validParentId(entry: NetworkEntry, byId: Map<string, NetworkEntry>): string | undefined {
  const pid = entry.parentId;
  if (!pid || pid === entry.id || !byId.has(pid)) return undefined;
  // walk up – a cycle (A under B under A) counts as no parent
  const seen = new Set([entry.id]);
  let cur: string | undefined = pid;
  while (cur) {
    if (seen.has(cur)) return undefined;
    seen.add(cur);
    cur = byId.get(cur)?.parentId;
    if (cur && !byId.has(cur)) break;
  }
  return pid;
}

export function childrenOf(entries: NetworkEntry[], id: string): NetworkEntry[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return entries.filter((e) => validParentId(e, byId) === id);
}

export function descendantIds(entries: NetworkEntry[], id: string): Set<string> {
  const out = new Set<string>();
  const walk = (pid: string) => childrenOf(entries, pid).forEach((c) => {
    if (!out.has(c.id)) {
      out.add(c.id);
      walk(c.id);
    }
  });
  walk(id);
  return out;
}

/**
 * Positions of every entry, in graph units. Saved positions win. Top-level entries without one sit on
 * a circle around "you" (as before); sub-elements without one fan out from their parent, away from the
 * centre – so a sub-element spreads like a branch of a mind map and is tied to its parent only.
 */
export function computePositions(entries: NetworkEntry[]): Map<string, Pt> {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const parentOf = new Map<string, string | undefined>();
  entries.forEach((e) => parentOf.set(e.id, validParentId(e, byId)));
  const top = entries.filter((e) => !parentOf.get(e.id));
  const out = new Map<string, Pt>();

  top.forEach((e, i) => {
    if (e.position) return out.set(e.id, e.position);
    const angle = (2 * Math.PI * i) / Math.max(top.length, 1) - Math.PI / 2;
    const jitter = (seededRandom(e.id, 'r') - 0.5) * 0.06;
    const r = 0.36 + jitter;
    out.set(e.id, {
      x: Math.min(0.92, Math.max(0.08, CENTER.x + Math.cos(angle) * r)),
      y: Math.min(0.92, Math.max(0.08, CENTER.y + Math.sin(angle) * r)),
    });
  });

  const place = (pid: string, depth: number) => {
    const parentPos = out.get(pid);
    if (!parentPos) return;
    const kids = entries.filter((e) => parentOf.get(e.id) === pid);
    // outward direction: from the centre (or from the grandparent) through the parent
    const gp = parentOf.get(pid);
    const from = gp ? out.get(gp) ?? CENTER : CENTER;
    let base = Math.atan2(parentPos.y - from.y, parentPos.x - from.x);
    if (Math.hypot(parentPos.x - from.x, parentPos.y - from.y) < 0.02) base = -Math.PI / 2;
    const free = kids.filter((k) => !k.position);
    const placedAlready = kids.length - free.length;
    free.forEach((k, i) => {
      const n = free.length + placedAlready;
      const step = Math.min(0.8, (Math.PI * 1.3) / Math.max(n, 2));
      const idx = placedAlready + i;
      const angle = base + (idx - (n - 1) / 2) * step;
      const r = depth === 0 ? 0.17 : 0.14;
      // stay inside the first screen when auto-placed (dragging them further out is always possible)
      out.set(k.id, {
        x: Math.min(0.93, Math.max(0.07, parentPos.x + Math.cos(angle) * r)),
        y: Math.min(0.93, Math.max(0.07, parentPos.y + Math.sin(angle) * r)),
      });
    });
    kids.forEach((k) => {
      if (k.position) out.set(k.id, k.position);
      place(k.id, depth + 1);
    });
  };
  const visited = new Set<string>();
  const run = (pid: string, depth: number) => {
    if (visited.has(pid)) return;
    visited.add(pid);
    place(pid, depth);
  };
  top.forEach((e) => run(e.id, 0));
  // anything still unplaced (should not happen) goes to the centre ring
  entries.forEach((e) => {
    if (!out.has(e.id)) out.set(e.id, e.position ?? { x: 0.5, y: 0.5 });
  });
  return out;
}

/** where a brand-new sub-element of `parent` would appear (computed with it included, then saved) */
export function positionForNewChild(entries: NetworkEntry[], parentId: string, childId: string): Pt | undefined {
  const probe = entries.some((e) => e.id === childId)
    ? entries
    : [...entries, { id: childId, parentId, name: '', category: 'person', helpsWith: [], createdAt: '', updatedAt: '' } as NetworkEntry];
  return computePositions(probe).get(childId);
}

export interface NetBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
/** the box around all nodes (and the centre), in graph units */
export function netBounds(positions: Map<string, Pt>): NetBounds {
  let minX = CENTER.x;
  let maxX = CENTER.x;
  let minY = CENTER.y;
  let maxY = CENTER.y;
  positions.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  return { minX, minY, maxX, maxY };
}
