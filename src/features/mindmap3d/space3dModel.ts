import { createId } from '../../services/storage/repository';

/**
 * 3D-Mindmap („Raum“): Dinge liegen im Raum, nicht auf einer Fläche. Es gibt benannte, sichtbare Ebenen
 * (waagrechte Scheiben in einer Höhe), Formen, Sprechblasen, Fotos, Verbindungen mit Beschriftung.
 * Drehen, Zoomen, Verschieben. Gespeichert wird im selben Mindmap-Eintrag (`kind: '3d'`, `space`),
 * damit Ordner, Archiv, Sicherung, Tagebuch- und Projekt-Verknüpfungen ohne Umweg funktionieren.
 * Alle neuen Felder sind optional – ältere Räume laden unverändert.
 */
export type Shape3D =
  | 'sphere' | 'cube' | 'cone' | 'cylinder' | 'pyramid' | 'ring' | 'diamond' | 'gem' | 'star' | 'heart' | 'plate'
  | 'tetra' | 'prism' | 'hex' | 'dome' | 'capsule' | 'stairs' | 'arrow'
  | 'text' | 'bubble' | 'thought' | 'shout' | 'note' | 'photo';

export type Font3D = 'sans' | 'serif' | 'hand' | 'marker' | 'script' | 'round' | 'mono' | 'display';
export type Tail3D = 'bl' | 'br' | 'tl' | 'tr';

export interface Node3D {
  id: string;
  text: string;
  shape: Shape3D;
  color: string;
  x: number;
  y: number;
  z: number;
  /** 0,5–6 (S=1 … XL=4) */
  size: number;
  layerId?: string;
  symbol?: string;
  /** Mindmap, die sich hinter diesem Ding verbirgt */
  link?: string;
  note?: string;
  /** Drehung um die senkrechte Achse (bei Blasen/Fotos: in der Bildebene), Grad */
  rot?: number;
  /** Kippen nach vorn/hinten (nur Körper), Grad */
  tilt?: number;
  /** Umrandung (Körper: Kontur, Blase/Foto: Rahmen, Text: heller/dunkler Saum) */
  outline?: boolean;
  outlineColor?: string;
  /** Durchsichtigkeit 0,15–1 */
  opacity?: number;
  font?: Font3D;
  /** Schriftgröße-Faktor 0,6–2,4 */
  fs?: number;
  bold?: boolean;
  italic?: boolean;
  textColor?: string;
  /** Foto (verkleinertes JPEG als Data-URL) und Seitenverhältnis Breite/Höhe */
  image?: string;
  ar?: number;
  /** Spitze der Sprechblase */
  tail?: Tail3D;
}
export interface Edge3D { id: string; from: string; to: string; color: string; label?: string; dashed?: boolean; arrow?: boolean }
export type LayerLook = 'plane' | 'disc' | 'grid' | 'frame' | 'slab' | 'none';
export interface Layer3D {
  id: string; name: string; y: number; color: string; visible: boolean; plane: boolean;
  /** Aussehen der Ebene (plane = Fläche) */
  look?: LayerLook;
  /** Deckkraft der Fläche 0,04–0,6 */
  opacity?: number;
  /** Halbe Kantenlänge (4–40); fehlt = automatisch */
  ext?: number;
}

export type BgId = 'dark' | 'light' | 'dusk' | 'night' | 'forest' | 'sea' | 'sunset' | 'sky' | 'meadow' | 'paper' | 'rose' | 'lavender' | 'graphite' | 'aurora' | 'photo';
export interface Shot3D {
  id: string;
  at: string;
  name: string;
  /** kleines JPEG der Ansicht */
  img: string;
  cam: Cam3D;
}
export interface Cam3D { theta: number; phi: number; dist: number; tx: number; ty: number; tz: number }
export interface Space3D {
  nodes: Node3D[];
  edges: Edge3D[];
  layers: Layer3D[];
  /** Kamera: Drehung (theta waagrecht, phi senkrecht), Abstand, Blickpunkt */
  cam: Cam3D;
  bg: BgId;
  grid: boolean;
  /** Eigenes Foto als Hintergrund (nur bei bg === 'photo') und ob es hell oder dunkel wirkt */
  bgImage?: string;
  bgTone?: 'dark' | 'light';
  /** Kamera-Fotos aus verschiedenen Blickwinkeln */
  shots?: Shot3D[];
}

/** Ein festgehaltener Stand (liegt in einem eigenen Speicher, damit die Karte selbst schlank bleibt) */
export interface Version3D {
  id: string;
  mapId: string;
  at: string;
  name: string;
  thumb?: string;
  space: Space3D;
}

export interface ShapeInfo { id: Shape3D; de: string; en: string; icon: string; group: 'solid' | 'speech' | 'flat' }
export const SHAPES3D: ShapeInfo[] = [
  { id: 'sphere', de: 'Kugel', en: 'Sphere', icon: '⚪', group: 'solid' },
  { id: 'cube', de: 'Würfel', en: 'Cube', icon: '🟦', group: 'solid' },
  { id: 'cone', de: 'Kegel', en: 'Cone', icon: '🔺', group: 'solid' },
  { id: 'cylinder', de: 'Zylinder', en: 'Cylinder', icon: '🥫', group: 'solid' },
  { id: 'pyramid', de: 'Pyramide (eckig)', en: 'Pyramid (square)', icon: '🔻', group: 'solid' },
  { id: 'tetra', de: 'Dreieck-Pyramide', en: 'Triangle pyramid', icon: '△', group: 'solid' },
  { id: 'prism', de: 'Dreieck-Prisma', en: 'Triangle prism', icon: '◭', group: 'solid' },
  { id: 'hex', de: 'Sechskant', en: 'Hexagon block', icon: '⬢', group: 'solid' },
  { id: 'ring', de: 'Ring', en: 'Ring', icon: '⭕', group: 'solid' },
  { id: 'diamond', de: 'Doppelkegel', en: 'Diamond', icon: '🔶', group: 'solid' },
  { id: 'gem', de: 'Kristall', en: 'Crystal', icon: '💎', group: 'solid' },
  { id: 'dome', de: 'Kuppel', en: 'Dome', icon: '🌓', group: 'solid' },
  { id: 'capsule', de: 'Kapsel', en: 'Capsule', icon: '💊', group: 'solid' },
  { id: 'stairs', de: 'Treppe', en: 'Stairs', icon: '🪜', group: 'solid' },
  { id: 'arrow', de: 'Pfeil', en: 'Arrow', icon: '➡️', group: 'solid' },
  { id: 'star', de: 'Stern', en: 'Star', icon: '⭐', group: 'solid' },
  { id: 'heart', de: 'Herz', en: 'Heart', icon: '❤️', group: 'solid' },
  { id: 'plate', de: 'Tafel', en: 'Plate', icon: '▭', group: 'solid' },
  { id: 'bubble', de: 'Sprechblase', en: 'Speech bubble', icon: '💬', group: 'speech' },
  { id: 'thought', de: 'Gedankenblase', en: 'Thought bubble', icon: '💭', group: 'speech' },
  { id: 'shout', de: 'Ausruf', en: 'Shout', icon: '💥', group: 'speech' },
  { id: 'note', de: 'Notizzettel', en: 'Sticky note', icon: '🗒️', group: 'flat' },
  { id: 'text', de: 'Nur Text', en: 'Text only', icon: '🔤', group: 'flat' },
  { id: 'photo', de: 'Nur Foto', en: 'Photo only', icon: '🖼️', group: 'flat' },
];
export const FLAT_SHAPES: Shape3D[] = ['text', 'bubble', 'thought', 'shout', 'note', 'photo'];
export const isFlat = (s: Shape3D) => FLAT_SHAPES.includes(s);
export const shapeInfo = (s: Shape3D) => SHAPES3D.find((x) => x.id === s) ?? SHAPES3D[0];

export const FONTS3D: { id: Font3D; de: string; en: string; css: string }[] = [
  { id: 'sans', de: 'Klar', en: 'Clean', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: 'serif', de: 'Buch', en: 'Book', css: 'Georgia, "Times New Roman", serif' },
  { id: 'hand', de: 'Handschrift', en: 'Handwriting', css: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive' },
  { id: 'marker', de: 'Filzstift', en: 'Felt pen', css: '"Marker Felt", "Chalkboard SE", "Comic Sans MS", "Comic Neue", cursive' },
  { id: 'script', de: 'Schönschrift', en: 'Script', css: '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive' },
  { id: 'round', de: 'Rund', en: 'Rounded', css: '"Arial Rounded MT Bold", "Varela Round", Nunito, system-ui, sans-serif' },
  { id: 'display', de: 'Schmuck', en: 'Display', css: 'Fraunces, Georgia, serif' },
  { id: 'mono', de: 'Schreibmaschine', en: 'Typewriter', css: '"American Typewriter", "Courier New", ui-monospace, monospace' },
];

export const COLORS3D = ['#e07a5f', '#e8a83d', '#7a9e4a', '#4a8f9e', '#3e6bb0', '#9a7bc4', '#d9778a', '#f4f1ea', '#8a8f98'];
export const NODE_COLORS3D = [...COLORS3D, '#2b2a28', '#f2d16b', '#8fd1b0', '#7ec4e8', '#f0a3c0', '#b5651d'];
export const LAYER_COLORS = ['#4a8f9e', '#e8a83d', '#9a7bc4', '#7a9e4a', '#d9778a', '#3e6bb0', '#e07a5f', '#8fd1b0', '#7ec4e8', '#f2d16b', '#b5651d', '#8a8f98', '#f4f1ea', '#2b2a28'];
export const NODE_SIZE_UNIT = 0.9;

export const LAYER_LOOKS: { id: LayerLook; de: string; en: string; icon: string }[] = [
  { id: 'plane', de: 'Fläche', en: 'Plane', icon: '▭' },
  { id: 'disc', de: 'Scheibe', en: 'Disc', icon: '⬭' },
  { id: 'grid', de: 'Raster', en: 'Grid', icon: '▦' },
  { id: 'frame', de: 'Rahmen', en: 'Frame', icon: '▢' },
  { id: 'slab', de: 'Platte', en: 'Slab', icon: '▬' },
  { id: 'none', de: 'Nur Name', en: 'Name only', icon: 'Ａ' },
];
export const layerLook = (l: Layer3D): LayerLook => l.look ?? (l.plane ? 'plane' : 'none');

export interface BgInfo { id: BgId; de: string; en: string; a: string; b: string; dark: boolean; flat?: boolean }
export const BGS3D: BgInfo[] = [
  { id: 'dark', de: 'Nacht', en: 'Night', a: '#161a22', b: '#161a22', dark: true, flat: true },
  { id: 'dusk', de: 'Dämmerung', en: 'Dusk', a: '#2a2540', b: '#2a2540', dark: true, flat: true },
  { id: 'light', de: 'Hell', en: 'Light', a: '#f3efe6', b: '#f3efe6', dark: false, flat: true },
  { id: 'paper', de: 'Papier', en: 'Paper', a: '#fbf8f1', b: '#efe7d6', dark: false },
  { id: 'sky', de: 'Himmel', en: 'Sky', a: '#bfe0f5', b: '#f4f8fb', dark: false },
  { id: 'sunset', de: 'Abendrot', en: 'Sunset', a: '#3b3a73', b: '#f2a07b', dark: true },
  { id: 'sea', de: 'Meer', en: 'Sea', a: '#0e3a4d', b: '#4fa3b5', dark: true },
  { id: 'forest', de: 'Wald', en: 'Forest', a: '#16261d', b: '#3f6b4f', dark: true },
  { id: 'meadow', de: 'Wiese', en: 'Meadow', a: '#d6ecf6', b: '#cfe6b8', dark: false },
  { id: 'rose', de: 'Rosé', en: 'Blush', a: '#fbe9ee', b: '#f4c9d6', dark: false },
  { id: 'lavender', de: 'Lavendel', en: 'Lavender', a: '#efe9f6', b: '#cdbfe6', dark: false },
  { id: 'graphite', de: 'Graphit', en: 'Graphite', a: '#2c2f34', b: '#505560', dark: true },
  { id: 'aurora', de: 'Polarlicht', en: 'Aurora', a: '#0b1e2d', b: '#2c6e63', dark: true },
  { id: 'night', de: 'Tiefschwarz', en: 'Black', a: '#06070a', b: '#06070a', dark: true, flat: true },
];
export const bgInfo = (s: Pick<Space3D, 'bg' | 'bgImage' | 'bgTone'>): BgInfo => {
  if (s.bg === 'photo' && s.bgImage) {
    const dark = (s.bgTone ?? 'dark') === 'dark';
    return { id: 'photo', de: 'Foto', en: 'Photo', a: dark ? '#161a22' : '#f3efe6', b: dark ? '#161a22' : '#f3efe6', dark };
  }
  return BGS3D.find((b) => b.id === s.bg) ?? BGS3D[0];
};

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
  const bg: BgId = BGS3D.some((b) => b.id === s.bg) || (s.bg === 'photo' && !!s.bgImage) ? s.bg : 'dark';
  return {
    nodes: Array.isArray(s.nodes) ? s.nodes : [],
    edges: Array.isArray(s.edges) ? s.edges : [],
    layers: Array.isArray(s.layers) ? s.layers : [],
    cam: { ...base.cam, ...(s.cam ?? {}) },
    bg,
    grid: !!s.grid,
    bgImage: s.bgImage,
    bgTone: s.bgTone,
    shots: Array.isArray(s.shots) ? s.shots : undefined,
  };
}

/** Eine Kopie ohne die schweren Zusatzdaten (für festgehaltene Stände) */
export function slimSpace(s: Space3D): Space3D {
  const { shots: _shots, ...rest } = s;
  void _shots;
  return JSON.parse(JSON.stringify(rest)) as Space3D;
}
