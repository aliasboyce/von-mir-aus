import { createId } from '../../services/storage/repository';
import { bgIsDark, type MMNode, type MindMap, type MMShape } from '../mindmap/mindmapModel';
import { newEdge3, newLayer3, newNode3, sanitizeSpace, type Font3D, type Node3D, type Shape3D, type Space3D } from './space3dModel';

/**
 * 2D-Mindmap → 3D-Raum. Es entsteht immer eine KOPIE; die Fläche bleibt unverändert.
 * 'levels' = Ebenen nach Abstand vom Hauptthema (außen liegt höher), 'flat' = alles auf einer Ebene.
 */
export type ConvertMode = 'levels' | 'flat';

const SHAPE: Partial<Record<MMShape, Shape3D>> = {
  rounded: 'cube', pill: 'capsule', oval: 'sphere', circle: 'sphere', diamond: 'diamond', hexagon: 'hex',
  cloud: 'thought', note: 'note', plain: 'text', image: 'photo', sticker: 'text', doodle: 'text', maplink: 'sphere',
};
const FONT: Record<string, Font3D> = { sans: 'sans', serif: 'serif', hand: 'hand', marker: 'marker', script: 'script', round: 'round', display: 'display', mono: 'mono', typewriter: 'mono' };

export interface ConvertResult { map: MindMap; skipped: number }

export function convertTo3d(src: MindMap, mode: ConvertMode, lang: 'de' | 'en'): ConvertResult {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const usable = src.nodes.filter((n) => n.shape !== 'frame' && n.shape !== 'draw');
  const skipped = src.nodes.length - usable.length;
  const ids = new Set(usable.map((n) => n.id));
  const edges = src.edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  // Abstand vom Hauptthema (Knoten mit den meisten Verbindungen; weitere Teile starten selbst neu)
  const adj = new Map<string, string[]>();
  usable.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => { adj.get(e.from)?.push(e.to); adj.get(e.to)?.push(e.from); });
  const depth = new Map<string, number>();
  const order = [...usable].sort((a, b) => (adj.get(b.id)?.length ?? 0) - (adj.get(a.id)?.length ?? 0));
  for (const start of order) {
    if (depth.has(start.id)) continue;
    depth.set(start.id, 0);
    const q = [start.id];
    while (q.length) {
      const id = q.shift()!;
      for (const nb of adj.get(id) ?? []) if (!depth.has(nb)) { depth.set(nb, (depth.get(id) ?? 0) + 1); q.push(nb); }
    }
  }
  const maxDepth = mode === 'levels' ? Math.min(5, Math.max(0, ...depth.values())) : 0;
  const GAP = 3.5;
  const layers = Array.from({ length: maxDepth + 1 }, (_, d) =>
    newLayer3(mode === 'flat' ? L('Alles', 'Everything') : d === 0 ? L('Hauptthema', 'Main topic') : L(`Stufe ${d + 1}`, `Level ${d + 1}`), d * GAP, d));

  // Lage: Mitte auf 0, Maßstab so, dass es gut in den Raum passt
  const xs = usable.map((n) => n.x);
  const ys = usable.map((n) => n.y);
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
  const span = Math.max(1, ...usable.map((n) => Math.max(Math.abs(n.x - cx), Math.abs(n.y - cy))));
  const k = Math.min(1 / 70, 16 / span);

  const nodes: Node3D[] = usable.map((n: MMNode) => {
    const d = mode === 'levels' ? Math.min(maxDepth, depth.get(n.id) ?? 0) : 0;
    const shape: Shape3D = SHAPE[n.shape] ?? 'sphere';
    const base: Partial<Node3D> = {
      text: n.text || (n.shape === 'image' ? '' : n.doodle ? '' : ''), shape, color: n.color, size: n.size ?? 2,
      x: Math.round((n.x - cx) * k * 100) / 100, z: Math.round((n.y - cy) * k * 100) / 100,
      y: layers[d].y, layerId: layers[d].id, symbol: n.symbol,
    };
    if (n.rot) base.rot = Math.round(((n.rot % 360) + 360) % 360);
    if (n.font && FONT[n.font]) base.font = FONT[n.font];
    if (n.bold) base.bold = true;
    if (n.italic) base.italic = true;
    if (n.mapId) base.link = n.mapId;
    if (n.sc && n.sc !== 1) base.size = Math.max(0.5, Math.min(6, Math.round(base.size! * n.sc * 10) / 10));
    if (n.border === 'none') base.outline = false;
    if (n.shape === 'image' && n.img) { base.image = n.img; base.ar = n.ar ?? 1.33; }
    if (n.shape === 'sticker' || n.shape === 'doodle') { base.text = n.text || n.symbol || '✦'; }
    if (n.shape === 'plain') { /* Text: Farbe gilt als Schriftfarbe */ }
    return { ...newNode3({ text: base.text ?? '' }), ...base, id: createId('n3') } as Node3D;
  });
  const idMap = new Map(usable.map((n, i) => [n.id, nodes[i].id]));
  const edges3 = edges.map((e) => newEdge3(idMap.get(e.from)!, idMap.get(e.to)!, { color: e.color, label: e.label, dashed: e.dash !== 'solid', arrow: e.arrow !== 'none' }));

  const dark = bgIsDark(src.bg.tone);
  const space: Space3D = sanitizeSpace({
    nodes, edges: edges3, layers,
    cam: { theta: 0.7, phi: 1.1, dist: 22, tx: 0, ty: (maxDepth * GAP) / 2, tz: 0 },
    bg: src.bg.img ? 'photo' : dark ? 'dark' : 'paper', grid: false,
    bgImage: src.bg.img, bgTone: dark ? 'dark' : 'light',
  }, lang);
  const now = new Date().toISOString();
  const map: MindMap = {
    ...src, id: createId('mm'), title: `${src.title || L('Mindmap', 'Mind map')} (3D)`, createdAt: now, updatedAt: now,
    kind: '3d', space, thumb: undefined, nodes: [], edges: [], view: undefined, parentId: undefined, archived: undefined, archivedAt: undefined,
  };
  return { map, skipped };
}
