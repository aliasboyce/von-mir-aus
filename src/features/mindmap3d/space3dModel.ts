import { createId } from '../../services/storage/repository';

/**
 * 3D-Mindmap („Raum“): Dinge liegen im Raum, nicht auf einer Fläche. Es gibt benannte, sichtbare Ebenen
 * (waagrechte Scheiben in einer Höhe), Formen, Verbindungen mit Beschriftung. Drehen, Zoomen, Verschieben.
 * Gespeichert wird im selben Mindmap-Eintrag (`kind: '3d'`, `space`), damit Ordner, Archiv, Sicherung,
 * Tagebuch- und Projekt-Verknüpfungen ohne Umweg funktionieren.
 */
export type Shape3D = 'sphere' | 'cube' | 'cone' | 'cylinder' | 'pyramid' | 'ring' | 'diamond' | 'gem' | 'star' | 'heart' | 'plate' | 'text';

export interface Node3D {
  id: string;
  text: string;
  shape: Shape3D;
  color: string;
  x: number;
  y: number;
  z: number;
  /** 1–4 */
  size: number;
  layerId?: string;
  symbol?: string;
  /** Mindmap, die sich hinter diesem Ding verbirgt */
  link?: string;
  note?: string;
}
export interface Edge3D { id: string; from: string; to: string; color: string; label?: string; dashed?: boolean; arrow?: boolean }
export interface Layer3D { id: string; name: string; y: number; color: string; visible: boolean; plane: boolean }
export interface Space3D {
  nodes: Node3D[];
  edges: Edge3D[];
  layers: Layer3D[];
  /** Kamera: Drehung (theta waagrecht, phi senkrecht), Abstand, Blickpunkt */
  cam: { theta: number; phi: number; dist: number; tx: number; ty: number; tz: number };
  bg: 'dark' | 'light' | 'dusk';
  grid: boolean;
}

export const SHAPES3D: { id: Shape3D; de: string; en: string; icon: string }[] = [
  { id: 'sphere', de: 'Kugel', en: 'Sphere', icon: '⚪' },
  { id: 'cube', de: 'Würfel', en: 'Cube', icon: '🟦' },
  { id: 'cone', de: 'Kegel', en: 'Cone', icon: '🔺' },
  { id: 'cylinder', de: 'Zylinder', en: 'Cylinder', icon: '🥫' },
  { id: 'pyramid', de: 'Pyramide', en: 'Pyramid', icon: '🔻' },
  { id: 'ring', de: 'Ring', en: 'Ring', icon: '⭕' },
  { id: 'diamond', de: 'Doppelkegel', en: 'Diamond', icon: '🔶' },
  { id: 'gem', de: 'Kristall', en: 'Crystal', icon: '💎' },
  { id: 'star', de: 'Stern', en: 'Star', icon: '⭐' },
  { id: 'heart', de: 'Herz', en: 'Heart', icon: '❤️' },
  { id: 'plate', de: 'Tafel', en: 'Plate', icon: '▭' },
  { id: 'text', de: 'Nur Text', en: 'Text only', icon: '🔤' },
];

export const COLORS3D = ['#e07a5f', '#e8a83d', '#7a9e4a', '#4a8f9e', '#3e6bb0', '#9a7bc4', '#d9778a', '#f4f1ea', '#8a8f98'];
export const LAYER_COLORS = ['#4a8f9e', '#e8a83d', '#9a7bc4', '#7a9e4a', '#d9778a', '#3e6bb0'];
export const NODE_SIZE_UNIT = 0.9;

export function newNode3(p: Partial<Node3D> & { text: string }): Node3D {
  return { id: createId('n3'), shape: 'sphere', color: COLORS3D[3], x: 0, y: 0, z: 0, size: 2, ...p };
}
export function newEdge3(from: string, to: string, p: Partial<Edge3D> = {}): Edge3D {
  return { id: createId('e3'), from, to, color: '#c9c4b8', arrow: false, ...p };
}
export function newLayer3(name: string, y: number, i: number): Layer3D {
  return { id: createId('ly'), name, y, color: LAYER_COLORS[i % LAYER_COLORS.length], visible: true, plane: true };
}

export function emptySpace(lang: 'de' | 'en'): Space3D {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const l0 = newLayer3(L('Unten', 'Bottom'), -3, 0);
  const l1 = newLayer3(L('Mitte', 'Middle'), 0, 1);
  const l2 = newLayer3(L('Oben', 'Top'), 3, 2);
  const c = newNode3({ text: L('Mein Thema', 'My topic'), shape: 'sphere', color: COLORS3D[1], size: 3, y: 0, layerId: l1.id });
  const a = newNode3({ text: L('Idee', 'Idea'), shape: 'cube', color: COLORS3D[3], x: -4, y: 3, z: 1, layerId: l2.id });
  const b = newNode3({ text: L('Idee', 'Idea'), shape: 'cone', color: COLORS3D[5], x: 4, y: -3, z: -1, layerId: l0.id });
  return {
    nodes: [c, a, b],
    edges: [newEdge3(c.id, a.id), newEdge3(c.id, b.id)],
    layers: [l0, l1, l2],
    cam: { theta: 0.7, phi: 1.15, dist: 20, tx: 0, ty: 0, tz: 0 },
    bg: 'dark',
    grid: false,
  };
}

/** Rückfall, falls etwas an den Daten fehlt (ältere/kaputte Einträge) */
export function sanitizeSpace(s: Space3D | undefined, lang: 'de' | 'en'): Space3D {
  const base = emptySpace(lang);
  if (!s) return base;
  return {
    nodes: Array.isArray(s.nodes) ? s.nodes : [],
    edges: Array.isArray(s.edges) ? s.edges : [],
    layers: Array.isArray(s.layers) ? s.layers : [],
    cam: { ...base.cam, ...(s.cam ?? {}) },
    bg: s.bg ?? 'dark',
    grid: !!s.grid,
  };
}
