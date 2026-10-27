import { approxTextWidth, wrapText } from '../../components/canvas/svgText';
import { createRepository, createId } from '../../services/storage/repository';
import { doodleIds, doodleOf } from './doodles';
import { BLOCK_SHAPES, SHAPE_FIT, boundaryOffset as boundaryOffsetShape, shapePath as shapePathShape, type ShapeId } from './mindmapShapes';
import { appCardLayout, prosConsLayout, tableLayout, todoLayout, type RefKind, type RefSnap, type TodoItem } from './mindmapBlocks';
import { HEADS, ROUTES, routeGeometry, type EdgeGeometry, type MMHead, type MMRoute } from './mindmapRoutes';

export type { MMHead, MMRoute, EdgeGeometry, RefKind, RefSnap, TodoItem };
export { BLOCK_SHAPES };

/* ------------------------------------------------------------------ types */

export type MMShape = ShapeId;
export type MMLook = 'solid' | 'soft' | 'outline';
export type MMDash = 'solid' | 'dashed' | 'dotted';
export type MMArrow = 'none' | 'end' | 'both';
export type MMBgKind = 'plain' | 'dots' | 'dotsL' | 'grid' | 'graph' | 'lines' | 'crosses' | 'tri' | 'stars' | 'waves' | 'checker';
export type MMBorder = 'solid' | 'dashed' | 'dotted' | 'double' | 'sketch' | 'thick' | 'none';
export type MMAnim = 'none' | 'spin' | 'spinback' | 'swing' | 'pulse' | 'bounce' | 'wiggle' | 'float' | 'blink' | 'orbit' | 'jelly' | 'shake';
export type MMPen = 'pen' | 'pencil' | 'marker' | 'water';
export type MMImgStyle = 'polaroid' | 'plain' | 'round' | 'rounded';
export type MMFont = 'sans' | 'serif' | 'hand' | 'marker' | 'mono' | 'round' | 'display' | 'script' | 'typewriter';

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
  /** photo nodes: the picture (small data URL, kept in the map) and its width/height ratio */
  img?: string;
  ar?: number;
  /** only for frames (cluster areas): free width/height */
  fw?: number;
  fh?: number;
  /** rotation in degrees */
  rot?: number;
  /** free scale factor (1 = as sized by `size`) */
  sc?: number;
  /** animation (loops); speed 1 slow … 3 fast; ganim = the whole group moves as one piece */
  anim?: MMAnim;
  animSpeed?: 1 | 2 | 3;
  ganim?: boolean;
  /** group id: grouped elements are selected and moved together */
  grp?: string;
  font?: MMFont;
  bold?: boolean;
  italic?: boolean;
  border?: MMBorder;
  /** outline thickness in px */
  sw?: number;
  /** layer: higher = further in front */
  z?: number;
  /** pen strokes: flat list x0,y0,x1,y1 … relative to the node centre */
  pts?: number[];
  pen?: MMPen;
  /** doodle: id from the catalogue */
  doodle?: string;
  imgStyle?: MMImgStyle;
  /** link to another mind map (shown as a small live preview) */
  mapId?: string;
  /** rounded corners: true = rounded, false = angular, unset = how the shape always looked */
  round?: boolean;
  /** own colours: fill, border and text (they win over `color` + `look`); nofill = no fill at all */
  fc?: string;
  bc?: string;
  tc?: string;
  nofill?: boolean;
  /** fill opacity 0.05–1, and opacity of the whole element */
  fop?: number;
  op?: number;
  /** kind of frame / note (see FRAME_VARIANTS, NOTE_VARIANTS) */
  variant?: string;
  /** locked: cannot be picked or moved on the map (handy for a painted background); still reachable in the layers list */
  lock?: boolean;
  /** side note: shown in the window on the right when the element is selected, not in the map */
  memo?: string;
  /** to-do list */
  items?: TodoItem[];
  /** colour of the tick (to-do) */
  ck?: string;
  /** table: rows × columns, first row = header */
  grid?: string[][];
  hdr?: boolean;
  /** pro & contra lists, their colours and headings */
  pros?: string[];
  cons?: string[];
  pc?: string;
  cc?: string;
  pl?: string;
  cl?: string;
  /** card from another place in the app (and a snapshot, in case the original is gone) */
  ref?: { kind: RefKind; id: string };
  snap?: RefSnap;
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
  /** free thickness in px (overrides `width`) */
  wpx?: number;
  arrow: MMArrow;
  /** sideways bend in world px (0 = straight) */
  bend: number;
  /** dashes keep flowing along the line */
  flow?: boolean;
  /** shape of the line (auto = straight, or an arc when bent) */
  route?: MMRoute;
  /** wave / zigzag height in px */
  amp?: number;
  /** heads at the start / end of the line (win over `arrow`), and their size factor */
  h0?: MMHead;
  h1?: MMHead;
  hs?: number;
  /** opacity of the line */
  op?: number;
}

export interface MindMap {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  bg: { kind: MMBgKind; tone: string; /** own photo behind the map (data URL, stays on this device) */ img?: string; /** how much of the page colour lies over the photo, 0–0.8 (higher = calmer photo) */ imgDim?: number };
  nodes: MMNode[];
  edges: MMEdge[];
  view?: { scale: number; tx: number; ty: number };
  /** this map is a sub map of another one */
  parentId?: string;
  /** name of the folder in the list */
  folder?: string;
  archived?: boolean;
  archivedAt?: string;
}

export const mindmapRepo = createRepository<MindMap>('mindmaps');

/* ------------------------------------------------------------- constants */

export const SHAPES: { id: MMShape; de: string; en: string }[] = [
  { id: 'plain', de: 'Ohne Form', en: 'No shape' },
  { id: 'rect', de: 'Rechteck', en: 'Rectangle' },
  { id: 'square', de: 'Quadrat', en: 'Square' },
  { id: 'pill', de: 'Kapsel', en: 'Pill' },
  { id: 'oval', de: 'Oval', en: 'Oval' },
  { id: 'circle', de: 'Kreis', en: 'Circle' },
  { id: 'triangle', de: 'Dreieck', en: 'Triangle' },
  { id: 'diamond', de: 'Raute', en: 'Diamond' },
  { id: 'pentagon', de: 'Fünfeck', en: 'Pentagon' },
  { id: 'hexagon', de: 'Sechseck', en: 'Hexagon' },
  { id: 'octagon', de: 'Achteck', en: 'Octagon' },
  { id: 'parallelogram', de: 'Parallelogramm', en: 'Parallelogram' },
  { id: 'trapezoid', de: 'Trapez', en: 'Trapezoid' },
  { id: 'star', de: 'Stern', en: 'Star' },
  { id: 'heart', de: 'Herz', en: 'Heart' },
  { id: 'arrow', de: 'Pfeil', en: 'Arrow' },
  { id: 'bubble', de: 'Sprechblase', en: 'Speech bubble' },
  { id: 'cross', de: 'Kreuz', en: 'Cross' },
  { id: 'banner', de: 'Banner', en: 'Banner' },
  { id: 'cloud', de: 'Wolke', en: 'Cloud' },
  { id: 'note', de: 'Notizzettel', en: 'Sticky note' },
  { id: 'frame', de: 'Rahmen', en: 'Frame' },
];

/** kinds of frames (the area that holds other things) */
export const FRAME_VARIANTS: { id: string; de: string; en: string }[] = [
  { id: 'classic', de: 'Gestrichelt', en: 'Dashed' },
  { id: 'header', de: 'Mit Titelleiste', en: 'Title bar' },
  { id: 'tab', de: 'Ordner-Reiter', en: 'Folder tab' },
  { id: 'card', de: 'Karte', en: 'Card' },
  { id: 'brackets', de: 'Ecken', en: 'Corners' },
  { id: 'ellipse', de: 'Rund', en: 'Round' },
  { id: 'blob', de: 'Wolkig', en: 'Blobby' },
  { id: 'underline', de: 'Nur Titel-Linie', en: 'Title line' },
];
/** kinds of notes */
export const NOTE_VARIANTS: { id: string; de: string; en: string }[] = [
  { id: 'sticky', de: 'Klebezettel', en: 'Sticky note' },
  { id: 'tape', de: 'Mit Tesa', en: 'Taped' },
  { id: 'pin', de: 'Mit Stecknadel', en: 'Pinned' },
  { id: 'index', de: 'Karteikarte', en: 'Index card' },
  { id: 'torn', de: 'Abgerissen', en: 'Torn edge' },
  { id: 'graph', de: 'Kariert', en: 'Squared' },
  { id: 'curl', de: 'Eselsohr', en: 'Dog-ear' },
  { id: 'plain', de: 'Schlicht', en: 'Plain' },
];

/** helper: is this node one of the content cards (to-do, table, pro/contra, app card)? */
export const isBlock = (n: Pick<MMNode, 'shape'>) => BLOCK_SHAPES.has(n.shape);

export const BG_TONES: { id: string; color: string; de: string; en: string; css?: string }[] = [
  { id: 'paper', color: '#fbf8f1', de: 'Papier', en: 'Paper' },
  { id: 'white', color: '#ffffff', de: 'Weiß', en: 'White' },
  { id: 'cream', color: '#fff6dc', de: 'Creme', en: 'Cream' },
  { id: 'butter', color: '#fbf0c4', de: 'Butter', en: 'Butter' },
  { id: 'peach', color: '#fde5d8', de: 'Pfirsich', en: 'Peach' },
  { id: 'blush', color: '#f7ebee', de: 'Rosé', en: 'Blush' },
  { id: 'lavender', color: '#efe9f6', de: 'Lavendel', en: 'Lavender' },
  { id: 'sky', color: '#e8f0f7', de: 'Himmel', en: 'Sky' },
  { id: 'ocean', color: '#d5e8f0', de: 'Meer', en: 'Ocean' },
  { id: 'mint', color: '#eaf3ee', de: 'Mint', en: 'Mint' },
  { id: 'sage', color: '#dfe8d8', de: 'Salbei', en: 'Sage' },
  { id: 'sand', color: '#f3ecdc', de: 'Sand', en: 'Sand' },
  { id: 'slate', color: '#d9dde2', de: 'Schiefer', en: 'Slate' },
  { id: 'sunrise', color: '#fbe6d4', de: 'Morgenrot', en: 'Sunrise', css: 'linear-gradient(160deg,#fde7d3,#f6dbe6)' },
  { id: 'dusk', color: '#e4dcef', de: 'Dämmerung', en: 'Dusk', css: 'linear-gradient(160deg,#dfe8f6,#eadcf0)' },
  { id: 'meadow', color: '#e3f0dd', de: 'Wiese', en: 'Meadow', css: 'linear-gradient(160deg,#eaf5e0,#dcecf3)' },
  { id: 'night', color: '#23282e', de: 'Nacht', en: 'Night' },
  { id: 'forest', color: '#22332b', de: 'Wald', en: 'Forest' },
  { id: 'plum', color: '#35283d', de: 'Pflaume', en: 'Plum' },
  { id: 'ink', color: '#1b2433', de: 'Tinte', en: 'Ink' },
];
export const HEX_TONE = /^#[0-9a-fA-F]{6}$/;
export const bgColor = (tone: string) => (HEX_TONE.test(tone) ? tone : BG_TONES.find((t) => t.id === tone)?.color ?? BG_TONES[0].color);
/** CSS background (colour or gradient) for the page behind a map */
export const bgCss = (tone: string) => (HEX_TONE.test(tone) ? tone : BG_TONES.find((t) => t.id === tone)?.css ?? bgColor(tone));
export const bgIsDark = (tone: string) => luminance(bgColor(tone)) < 0.25;
export const BG_KINDS: { id: MMBgKind; de: string; en: string }[] = [
  { id: 'dots', de: 'Punkte', en: 'Dots' },
  { id: 'dotsL', de: 'Große Punkte', en: 'Big dots' },
  { id: 'grid', de: 'Kästchen', en: 'Grid' },
  { id: 'graph', de: 'Millimeterpapier', en: 'Graph paper' },
  { id: 'lines', de: 'Linien', en: 'Lines' },
  { id: 'crosses', de: 'Kreuzchen', en: 'Crosses' },
  { id: 'tri', de: 'Dreiecke', en: 'Triangles' },
  { id: 'stars', de: 'Sternchen', en: 'Stars' },
  { id: 'waves', de: 'Wellen', en: 'Waves' },
  { id: 'checker', de: 'Schachbrett', en: 'Checkered' },
  { id: 'plain', de: 'Leer', en: 'Plain' },
];

/* ------------------------------------------------------------------ fonts */

export const FONTS: { id: MMFont; de: string; en: string; css: string; w: number }[] = [
  { id: 'sans', de: 'Klar', en: 'Clean', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', w: 1 },
  { id: 'serif', de: 'Buch', en: 'Book', css: 'Georgia, "Times New Roman", serif', w: 1 },
  { id: 'hand', de: 'Handschrift', en: 'Handwriting', css: 'var(--font-hand, "Segoe Print", "Bradley Hand", cursive)', w: 1.06 },
  { id: 'marker', de: 'Filzstift', en: 'Felt pen', css: '"Marker Felt", "Chalkboard SE", "Comic Sans MS", "Comic Neue", cursive', w: 1.12 },
  { id: 'script', de: 'Schönschrift', en: 'Script', css: '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive', w: 1.02 },
  { id: 'round', de: 'Rund', en: 'Rounded', css: '"Arial Rounded MT Bold", "Varela Round", Nunito, system-ui, sans-serif', w: 1.05 },
  { id: 'display', de: 'Schmuck', en: 'Display', css: 'var(--font-display, Fraunces), Georgia, serif', w: 1.05 },
  { id: 'mono', de: 'Schreibmaschine', en: 'Typewriter', css: '"American Typewriter", "Courier New", ui-monospace, monospace', w: 1.12 },
];
export const fontCss = (f: MMFont | undefined) => FONTS.find((x) => x.id === f)?.css;
export const fontW = (n: Pick<MMNode, 'font' | 'bold'>) => (FONTS.find((x) => x.id === n.font)?.w ?? 1) * (n.bold ? 1.07 : 1);

export const ANIMS: { id: MMAnim; de: string; en: string; icon: string }[] = [
  { id: 'none', de: 'Keine', en: 'None', icon: '⏸' },
  { id: 'spin', de: 'Drehen', en: 'Spin', icon: '🔄' },
  { id: 'spinback', de: 'Rückwärts drehen', en: 'Spin back', icon: '↺' },
  { id: 'swing', de: 'Pendeln', en: 'Swing', icon: '🎐' },
  { id: 'pulse', de: 'Pulsieren', en: 'Pulse', icon: '💗' },
  { id: 'bounce', de: 'Hüpfen', en: 'Bounce', icon: '⛹' },
  { id: 'wiggle', de: 'Wackeln', en: 'Wiggle', icon: '〰' },
  { id: 'float', de: 'Schweben', en: 'Float', icon: '🎈' },
  { id: 'blink', de: 'Blinken', en: 'Blink', icon: '✨' },
  { id: 'orbit', de: 'Kreisen', en: 'Orbit', icon: '🪐' },
  { id: 'jelly', de: 'Wackelpudding', en: 'Jelly', icon: '🍮' },
  { id: 'shake', de: 'Zittern', en: 'Shake', icon: '📳' },
];
/** these move the whole group around its centre when "as group" is on */
export const GROUP_ANIMS: MMAnim[] = ['spin', 'spinback', 'swing', 'orbit', 'pulse', 'float', 'bounce'];

export const BORDERS: { id: MMBorder; de: string; en: string }[] = [
  { id: 'solid', de: 'Durchgezogen', en: 'Solid' },
  { id: 'dashed', de: 'Gestrichelt', en: 'Dashed' },
  { id: 'dotted', de: 'Gepunktet', en: 'Dotted' },
  { id: 'double', de: 'Doppelt', en: 'Double' },
  { id: 'sketch', de: 'Handgezeichnet', en: 'Sketchy' },
  { id: 'thick', de: 'Dick', en: 'Bold' },
  { id: 'none', de: 'Ohne Rand', en: 'No border' },
];

export const PENS: { id: MMPen; de: string; en: string }[] = [
  { id: 'pen', de: 'Stift', en: 'Pen' },
  { id: 'pencil', de: 'Bleistift', en: 'Pencil' },
  { id: 'marker', de: 'Textmarker', en: 'Highlighter' },
  { id: 'water', de: 'Aquarell', en: 'Watercolour' },
];

const FONT: Record<number, number> = { 1: 13, 2: 16, 3: 20, 4: 27 };
export const PHOTO_W: Record<number, number> = { 1: 130, 2: 190, 3: 270, 4: 380 };
export const STICKER_S: Record<number, number> = { 1: 46, 2: 70, 3: 104, 4: 150 };
const BASIS: Record<number, number> = { 1: 120, 2: 168, 3: 224, 4: 300 };
export const STROKE: Record<number, number> = { 1: 2, 2: 3.5, 3: 6 };
export const edgeStroke = (e: Pick<MMEdge, 'width' | 'wpx'>) => (typeof e.wpx === 'number' ? Math.min(30, Math.max(1, e.wpx)) : STROKE[e.width]);

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
  const s = baseStyle(n, bg);
  if (n.shape === 'image' || n.shape === 'draw' || n.shape === 'sticker') return s;
  const dark = luminance(bg) < 0.25;
  let { fill, stroke, text } = s;
  if (n.shape !== 'plain') {
    if (n.nofill) {
      fill = 'none';
      text = dark ? '#f1ede4' : '#26231f';
    } else if (n.fc) {
      fill = n.fc;
      text = readableOn(n.fc);
    }
  }
  if (n.bc) stroke = n.bc;
  if (n.tc) text = n.tc;
  return { ...s, fill, stroke, text };
}
function baseStyle(n: MMNode, bg: string): NodeStyle {
  const dark = luminance(bg) < 0.25;
  if (BLOCK_SHAPES.has(n.shape)) return { fill: dark ? '#2b3138' : '#ffffff', stroke: n.color, text: dark ? '#f1ede4' : '#26231f', strokeWidth: n.sw ?? 2 };
  if (n.shape === 'image') return { fill: n.imgStyle && n.imgStyle !== 'polaroid' ? 'none' : '#ffffff', stroke: '#e6dfd0', text: n.imgStyle && n.imgStyle !== 'polaroid' ? (dark ? '#f1ede4' : '#26231f') : '#3a362d', strokeWidth: 1 };
  if (n.shape === 'draw') return { fill: 'none', stroke: n.color, text: n.color, strokeWidth: n.sw ?? 3 };
  if (n.shape === 'doodle') {
    const fill = n.look === 'solid' ? n.color : n.look === 'soft' ? mixHex(n.color, dark ? '#23282e' : '#ffffff', dark ? 0.6 : 0.8) : 'none';
    return { fill, stroke: n.color, text: n.look === 'solid' ? readableOn(n.color) : dark ? '#f1ede4' : '#26231f', strokeWidth: n.sw ?? 3 };
  }
  if (n.shape === 'maplink') return { fill: dark ? '#2b3138' : '#ffffff', stroke: n.color, text: dark ? '#f1ede4' : mixHex(n.color, '#000000', 0.45), strokeWidth: n.sw ?? 2.5 };
  if (n.shape === 'sticker') return { fill: 'none', stroke: 'none', text: dark ? '#f1ede4' : '#26231f', strokeWidth: 0 };
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
  /** sideways shift of the text block (arrows) */
  textDx?: number;
  /** scale factor that was applied (free scaling) */
  k: number;
}

/** size steps of doodles (the catalogue sizes are ~100 units) */
export const DOODLE_K: Record<number, number> = { 1: 0.9, 2: 1.4, 3: 2, 4: 2.8 };
/** pen strokes: bounding box of the points */
export function strokeBox(pts: number[] | undefined): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const p = pts ?? [];
  for (let i = 0; i + 1 < p.length; i += 2) {
    minX = Math.min(minX, p[i]);
    maxX = Math.max(maxX, p[i]);
    minY = Math.min(minY, p[i + 1]);
    maxY = Math.max(maxY, p[i + 1]);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}
export const penWidth = (n: Pick<MMNode, 'sw' | 'pen'>) => (n.sw ?? 3) * (n.pen === 'marker' ? 3.2 : n.pen === 'water' ? 1.8 : 1);

/** white frame around a photo (only the polaroid style has one) */
export const imgBorder = (n: Pick<MMNode, 'imgStyle'>) => (!n.imgStyle || n.imgStyle === 'polaroid' ? 7 : 0);
export const imgRatio = (n: Pick<MMNode, 'ar' | 'imgStyle'>) => (n.imgStyle === 'round' ? 1 : Math.min(2.6, Math.max(0.4, n.ar ?? 1)));

export function layoutNode(n: MMNode): NodeLayout {
  const b = layoutBase(n);
  const k = n.shape === 'frame' || n.shape === 'maplink' || BLOCK_SHAPES.has(n.shape) ? 1 : Math.min(8, Math.max(0.2, n.sc ?? 1));
  if (k === 1) return { ...b, k: 1 };
  return { ...b, w: b.w * k, h: b.h * k, fs: b.fs * k, lh: b.lh * k, symbolSize: b.symbolSize * k, textTop: b.textTop * k, symbolY: b.symbolY * k, textDx: b.textDx ? b.textDx * k : undefined, k };
}

function layoutBase(n: MMNode): Omit<NodeLayout, 'k'> {
  const fs = FONT[n.size] ?? 16;
  const lh = fs * 1.28;
  const basis = BASIS[n.size] ?? 168;
  const symbolSize = n.symbol ? fs * (n.text.trim() ? 1.9 : 3) : 0;
  const padX = fs * 0.95;
  const padY = fs * 0.72;

  if (n.shape === 'draw') {
    const bx = strokeBox(n.pts);
    const pw = penWidth(n);
    return { w: bx.maxX - bx.minX + pw, h: bx.maxY - bx.minY + pw, lines: [], fs, lh, symbolSize: 0, textTop: 0, symbolY: 0 };
  }
  if (n.shape === 'doodle') {
    const d = doodleOf(n.doodle);
    const kk = DOODLE_K[n.size] ?? 1.4;
    const w = n.fw ?? d.w * kk;
    const h = n.fh ?? d.h * kk;
    const dfs = fs * 0.95 * Math.min(1.6, Math.max(0.6, Math.sqrt((w / d.w) / kk)));
    const dlh = dfs * 1.25;
    const tw = d.text ? d.text.w * (w / d.w) : 0;
    const lines = d.text && n.text.trim() ? wrapText(n.text, tw, dfs * fontW(n)) : [];
    const cy = d.text ? d.text.cy * (h / d.h) : 0;
    return { w, h, lines, fs: dfs, lh: dlh, symbolSize: 0, textTop: cy - (lines.length * dlh) / 2 + dlh * 0.78, symbolY: 0 };
  }
  if (n.shape === 'maplink') {
    const w = n.fw ?? 320;
    const h = n.fh ?? 220;
    return { w, h, lines: n.text.trim() ? wrapText(n.text, w - 2 * padX, fs) : [], fs, lh, symbolSize: 0, textTop: -h / 2 + padY + fs * 0.9, symbolY: 0 };
  }
  if (n.shape === 'frame') {
    const w = n.fw ?? 380;
    const h = n.fh ?? 250;
    const lines = n.text.trim() ? wrapText(n.text, w - 2 * padX - 24, fs) : [];
    return { w, h, lines, fs, lh, symbolSize: 0, textTop: -h / 2 + padY + fs * 0.9, symbolY: 0 };
  }

  if (BLOCK_SHAPES.has(n.shape)) {
    const f = fontW(n);
    const blank = { lines: [] as string[], fs, lh, symbolSize: 0, textTop: 0, symbolY: 0 };
    if (n.shape === 'todo') {
      const t = todoLayout(n, fs, f);
      return { w: t.w, h: t.h, ...blank };
    }
    if (n.shape === 'table') {
      const t = tableLayout(n, fs, f);
      return { w: t.w, h: t.h, ...blank };
    }
    if (n.shape === 'proscons') {
      const t = prosConsLayout(n, fs, f);
      return { w: t.w, h: t.h, ...blank };
    }
    const t = appCardLayout(n, n.snap, fs, f);
    return { w: t.w, h: t.h, ...blank };
  }

  if (n.shape === 'image' || n.shape === 'sticker') {
    const cfs = fs * 0.9;
    const clh = cfs * 1.28;
    const capLines = n.text.trim() ? wrapText(n.text, (n.shape === 'image' ? PHOTO_W[n.size] : STICKER_S[n.size] * 1.6) - 14, cfs) : [];
    const capH = capLines.length ? capLines.length * clh + 10 : 0;
    if (n.shape === 'image') {
      const bd = imgBorder(n);
      const w = PHOTO_W[n.size] ?? 200;
      const ar = imgRatio(n);
      const ph = w / ar;
      const h = ph + bd * 2 + capH;
      // the caption sits below the picture (on the white border for photos)
      return { w: w + bd * 2, h, lines: capLines, fs: cfs, lh: clh, symbolSize: 0, textTop: -h / 2 + bd + ph + 7 + cfs * 0.95, symbolY: 0 };
    }
    const ss = STICKER_S[n.size] ?? 68;
    const w = Math.max(ss * 1.25, capLines.length ? STICKER_S[n.size] * 1.6 : 0);
    const h = ss * 1.25 + capH;
    return { w, h, lines: capLines, fs: cfs, lh: clh, symbolSize: ss, symbolY: -h / 2 + ss * 0.62, textTop: -h / 2 + ss * 1.25 + cfs * 0.9 };
  }

  const fit = SHAPE_FIT[n.shape];
  const textW =
    fit ? basis * 0.9 * fit.iw
    : n.shape === 'diamond' ? basis * 0.62
    : n.shape === 'circle' ? basis * 0.68
    : n.shape === 'oval' || n.shape === 'cloud' ? basis * 0.8
    : n.shape === 'hexagon' ? basis * 0.86
    : basis - 2 * padX;
  const fwf = fontW(n);
  const lines = n.text.trim() ? wrapText(n.text, textW / fwf, fs) : [];
  const widest = lines.reduce((m, l) => Math.max(m, approxTextWidth(l, fs) * fwf), 0);
  const symbolBlock = n.symbol ? symbolSize + (lines.length ? fs * 0.15 : 0) : 0;
  const contentH = symbolBlock + lines.length * lh || lh;
  const contentW = Math.max(widest, symbolSize);

  let w: number;
  let h: number;
  if (fit) {
    w = Math.max(basis * 0.6, contentW / fit.iw + padX);
    h = Math.max(contentH / fit.ih + padY, w * (fit.min ?? 0));
    if (fit.square) {
      const d = Math.max(w, h);
      w = d;
      h = d;
    }
  } else
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
  const top = -contentH / 2 + (fit?.dy ?? 0) * h;
  return {
    w,
    h,
    lines,
    fs,
    lh,
    symbolSize,
    symbolY: top + symbolSize * 0.5,
    textTop: top + symbolBlock + lh * 0.78,
    textDx: fit?.dx ? fit.dx * w : undefined,
  };
}

/* --------------------------------------------------------------- outlines */

/** the outline path of a shape; `round` = rounded corners (unset = how the shape always looked) */
export const shapePath = shapePathShape;
/** where a ray from the node centre towards (dx,dy) leaves the node outline */
export const boundaryOffset = boundaryOffsetShape;

export function edgeGeometry(e: MMEdge, from: MMNode, to: MMNode, lf: NodeLayout, lt: NodeLayout, bend = e.bend): EdgeGeometry {
  return routeGeometry(e, from, to, lf, lt, bend);
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
    const r = ((n.rot ?? 0) * Math.PI) / 180;
    const hw = (Math.abs(Math.cos(r)) * l.w + Math.abs(Math.sin(r)) * l.h) / 2;
    const hh = (Math.abs(Math.sin(r)) * l.w + Math.abs(Math.cos(r)) * l.h) / 2;
    minX = Math.min(minX, n.x - hw);
    maxX = Math.max(maxX, n.x + hw);
    minY = Math.min(minY, n.y - hh);
    maxY = Math.max(maxY, n.y + hh);
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

/* ------------------------------------------------------------ pen strokes */

/** smooth path through the points (quadratic curves through the midpoints) */
export function strokePath(pts: number[] | undefined): string {
  const p = pts ?? [];
  const n = Math.floor(p.length / 2);
  if (n === 0) return '';
  if (n === 1) return `M ${p[0]} ${p[1]} l 0.01 0`;
  if (n === 2) return `M ${p[0]} ${p[1]} L ${p[2]} ${p[3]}`;
  let d = `M ${p[0]} ${p[1]}`;
  for (let i = 1; i < n - 1; i++) {
    const mx = (p[i * 2] + p[i * 2 + 2]) / 2;
    const my = (p[i * 2 + 1] + p[i * 2 + 3]) / 2;
    d += ` Q ${p[i * 2]} ${p[i * 2 + 1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += ` L ${p[(n - 1) * 2]} ${p[(n - 1) * 2 + 1]}`;
  return d;
}

/** Ramer–Douglas–Peucker on a flat point list (keeps strokes small) */
export function simplifyPts(pts: number[], eps: number): number[] {
  const n = pts.length / 2;
  if (n < 3) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let best = -1;
    let bi = -1;
    const ax = pts[a * 2];
    const ay = pts[a * 2 + 1];
    const bx = pts[b * 2];
    const by = pts[b * 2 + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs(dy * pts[i * 2] - dx * pts[i * 2 + 1] + bx * ay - by * ax) / len;
      if (dist > best) {
        best = dist;
        bi = i;
      }
    }
    if (best > eps && bi > 0) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
  return out;
}

/** a pen stroke from absolute world points: the node sits at the middle of the box, points are relative to it */
export function strokeNode(abs: number[], opts: { color: string; sw: number; pen: MMPen }): MMNode | null {
  if (abs.length < 2) return null;
  const bx = strokeBox(abs);
  const cx = Math.round((bx.minX + bx.maxX) / 2);
  const cy = Math.round((bx.minY + bx.maxY) / 2);
  const pts = abs.map((v, i) => Math.round((v - (i % 2 ? cy : cx)) * 10) / 10);
  return newNode({ x: cx, y: cy, shape: 'draw', color: opts.color, sw: opts.sw, pen: opts.pen, pts, look: 'outline' });
}

/** the stroke's points in world coordinates (honours scale and rotation) */
export function strokeWorld(n: MMNode): number[] {
  const p = n.pts ?? [];
  const k = n.sc ?? 1;
  const r = ((n.rot ?? 0) * Math.PI) / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  const out: number[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) {
    const x = p[i] * k;
    const y = p[i + 1] * k;
    out.push(n.x + x * c - y * sn, n.y + x * sn + y * c);
  }
  return out;
}

/** erase with a round eraser: returns the pieces that remain (possibly none, possibly several) */
export function eraseStroke(n: MMNode, cx: number, cy: number, r: number): MMNode[] | null {
  const w = strokeWorld(n);
  const pen = penWidth(n) * (n.sc ?? 1);
  const rr = r + pen / 2;
  // densify so a fast swipe cannot jump over the eraser
  const dense: number[] = [];
  for (let i = 0; i + 1 < w.length; i += 2) {
    if (i >= 2) {
      const px = w[i - 2];
      const py = w[i - 1];
      const steps = Math.min(40, Math.floor(Math.hypot(w[i] - px, w[i + 1] - py) / Math.max(2, r * 0.5)));
      for (let s = 1; s <= steps; s++) dense.push(px + ((w[i] - px) * s) / (steps + 1), py + ((w[i + 1] - py) * s) / (steps + 1));
    }
    dense.push(w[i], w[i + 1]);
  }
  const pieces: number[][] = [];
  let cur: number[] = [];
  let hit = false;
  for (let i = 0; i + 1 < dense.length; i += 2) {
    if (Math.hypot(dense[i] - cx, dense[i + 1] - cy) <= rr) {
      hit = true;
      if (cur.length) pieces.push(cur);
      cur = [];
    } else cur.push(dense[i], dense[i + 1]);
  }
  if (cur.length) pieces.push(cur);
  if (!hit) return null;
  const opts = { color: n.color, sw: (n.sw ?? 3) * (n.sc ?? 1), pen: n.pen ?? 'pen' };
  const out: MMNode[] = [];
  pieces.forEach((pc, i) => {
    const simple = simplifyPts(pc, 0.6);
    const nn = strokeNode(simple.length >= 4 || pc.length < 4 ? simple : pc, opts);
    if (!nn) return;
    // keep layer, group and animation of the original on the first piece, copies get fresh ids
    out.push({ ...nn, id: i === 0 ? n.id : nn.id, z: n.z, grp: n.grp, anim: n.anim, animSpeed: n.animSpeed, ganim: n.ganim });
  });
  return out;
}

/** centre of every group that moves as one piece (needs at least two members with the same movement) */
export function groupCentres(nodes: MMNode[]): Map<string, { x: number; y: number; anim: MMAnim }> {
  const groups = new Map<string, MMNode[]>();
  for (const n of nodes) {
    if (!n.grp || !n.ganim || !n.anim || !GROUP_ANIMS.includes(n.anim)) continue;
    const key = `${n.grp}|${n.anim}`;
    const list = groups.get(key) ?? [];
    list.push(n);
    groups.set(key, list);
  }
  const out = new Map<string, { x: number; y: number; anim: MMAnim }>();
  groups.forEach((list, key) => {
    if (list.length < 2) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of list) {
      const l = layoutNode(n);
      minX = Math.min(minX, n.x - l.w / 2);
      maxX = Math.max(maxX, n.x + l.w / 2);
      minY = Math.min(minY, n.y - l.h / 2);
      maxY = Math.max(maxY, n.y + l.h / 2);
    }
    const c = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, anim: list[0].anim as MMAnim };
    for (const n of list) out.set(n.id, c);
    void key;
  });
  return out;
}

/* ------------------------------------------------------------------ layers */

/** drawing order value: frames sit behind everything unless a layer was set on purpose */
export const zOf = (n: MMNode, i: number) => n.z ?? (n.shape === 'frame' ? -1e6 + i : i);

/** nodes in drawing order (back → front) */
export function nodesByZ(nodes: MMNode[]): MMNode[] {
  return nodes
    .map((n, i) => ({ n, z: zOf(n, i), i }))
    .sort((a, b) => a.z - b.z || a.i - b.i)
    .map((x) => x.n);
}

/** once any layer was set on purpose, new elements without one go to the front (frames to the back) */
export function ensureZ(nodes: MMNode[]): MMNode[] {
  if (!nodes.some((n) => n.z !== undefined) || nodes.every((n) => n.z !== undefined)) return nodes;
  let hi = -Infinity;
  let lo = Infinity;
  nodes.forEach((n) => {
    if (n.z !== undefined) {
      hi = Math.max(hi, n.z);
      lo = Math.min(lo, n.z);
    }
  });
  return nodes.map((n) => {
    if (n.z !== undefined) return n;
    if (n.shape === 'frame') return { ...n, z: --lo };
    return { ...n, z: ++hi };
  });
}

export type LayerMove = 'front' | 'forward' | 'backward' | 'back';
/** move the given nodes in the drawing order; returns the nodes with fresh, even layer numbers */
export function moveLayers(nodes: MMNode[], ids: Set<string>, how: LayerMove): MMNode[] {
  const order = nodesByZ(nodes);
  const picked = order.filter((n) => ids.has(n.id));
  let rest = order.filter((n) => !ids.has(n.id));
  let next: MMNode[];
  if (how === 'front') next = [...rest, ...picked];
  else if (how === 'back') next = [...picked, ...rest];
  else {
    next = [...order];
    const idx = (id: string) => next.findIndex((n) => n.id === id);
    if (how === 'forward') {
      for (const n of [...picked].reverse()) {
        const i = idx(n.id);
        if (i < next.length - 1 && !ids.has(next[i + 1].id)) [next[i], next[i + 1]] = [next[i + 1], next[i]];
      }
    } else {
      for (const n of picked) {
        const i = idx(n.id);
        if (i > 0 && !ids.has(next[i - 1].id)) [next[i], next[i - 1]] = [next[i - 1], next[i]];
      }
    }
    rest = [];
  }
  const z = new Map(next.map((n, i) => [n.id, i]));
  return nodes.map((n) => ({ ...n, z: z.get(n.id) ?? n.z }));
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
  // links to other maps only work on this device – in a shared file they become a plain note
  const nodes = map.nodes.map((raw) => {
    // side notes stay with the person; cards from the app keep their picture but lose the link to this device
    const n: MMNode = { ...raw, memo: undefined, ref: undefined };
    return n.shape === 'maplink' ? { ...n, shape: 'note' as const, text: `↗ ${n.text}`.trim(), mapId: undefined, fw: undefined, fh: undefined, rot: n.rot } : n;
  });
  // an own photo background stays on this device (links and files would become huge)
  return { v: 1, title: map.title, bg: { kind: map.bg.kind, tone: map.bg.tone }, nodes, edges: map.edges, from: from?.trim() || undefined };
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

const SHAPE_IDS = [...SHAPES.map((s) => s.id), 'rounded', 'image', 'sticker', 'draw', 'doodle', 'todo', 'table', 'proscons', 'appcard'] as string[];
const colorOpt = (x: unknown) => (typeof x === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(x) ? x : undefined);
const strList = (x: unknown, n: number, max: number) => (Array.isArray(x) ? x.slice(0, n).map((v) => str(v, max)) : undefined);
const oneOf = <T extends string>(x: unknown, list: readonly T[]): T | undefined => (list.includes(x as T) ? (x as T) : undefined);
const clampN = (x: unknown, lo: number, hi: number): number | undefined => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : undefined);
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
      img: typeof r.img === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(r.img) && r.img.length < 500_000 ? r.img : undefined,
      ar: typeof r.ar === 'number' ? Math.min(3, Math.max(0.3, r.ar)) : undefined,
      fw: typeof r.fw === 'number' ? Math.min(3000, Math.max(80, r.fw)) : undefined,
      fh: typeof r.fh === 'number' ? Math.min(3000, Math.max(60, r.fh)) : undefined,
      rot: clampN(r.rot, -3600, 3600),
      sc: clampN(r.sc, 0.2, 8),
      anim: oneOf(r.anim, ANIMS.map((a) => a.id)),
      animSpeed: r.animSpeed === 1 || r.animSpeed === 3 ? r.animSpeed : r.animSpeed === 2 ? 2 : undefined,
      ganim: r.ganim === true ? true : undefined,
      grp: typeof r.grp === 'string' && r.grp ? str(r.grp, 60) : undefined,
      font: oneOf(r.font, FONTS.map((f) => f.id)),
      bold: r.bold === true ? true : undefined,
      italic: r.italic === true ? true : undefined,
      border: oneOf(r.border, BORDERS.map((b) => b.id)),
      sw: clampN(r.sw, 0, 40),
      z: clampN(r.z, -1e7, 1e7),
      pts: Array.isArray(r.pts) && r.pts.length <= 4000 && r.pts.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e5) ? (r.pts as number[]).map((v) => Math.round(v * 10) / 10) : undefined,
      pen: oneOf(r.pen, PENS.map((x) => x.id)),
      doodle: typeof r.doodle === 'string' && doodleIds.has(r.doodle) ? r.doodle : undefined,
      imgStyle: oneOf(r.imgStyle, ['polaroid', 'plain', 'round', 'rounded'] as const),
      round: typeof r.round === 'boolean' ? r.round : undefined,
      fc: colorOpt(r.fc),
      bc: colorOpt(r.bc),
      tc: colorOpt(r.tc),
      nofill: r.nofill === true ? true : undefined,
      fop: clampN(r.fop, 0.02, 1),
      op: clampN(r.op, 0.02, 1),
      variant: typeof r.variant === 'string' && r.variant ? str(r.variant, 20) : undefined,
      lock: r.lock === true ? true : undefined,
      items: Array.isArray(r.items)
        ? r.items.slice(0, 80).map((it, i) => {
            const o2 = (it ?? {}) as Record<string, unknown>;
            return { id: str(o2.id, 40) || `it${i}`, t: str(o2.t, 300), done: o2.done === true ? true : undefined };
          })
        : undefined,
      ck: colorOpt(r.ck),
      grid: Array.isArray(r.grid) ? r.grid.slice(0, 40).map((row) => (Array.isArray(row) ? row.slice(0, 12).map((c) => str(c, 240)) : [])) : undefined,
      hdr: typeof r.hdr === 'boolean' ? r.hdr : undefined,
      pros: strList(r.pros, 60, 300),
      cons: strList(r.cons, 60, 300),
      pc: colorOpt(r.pc),
      cc: colorOpt(r.cc),
      pl: typeof r.pl === 'string' && r.pl ? str(r.pl, 30) : undefined,
      cl: typeof r.cl === 'string' && r.cl ? str(r.cl, 30) : undefined,
      snap:
        r.snap && typeof r.snap === 'object'
          ? ((sn) => ({ title: str(sn.title, 240), sub: typeof sn.sub === 'string' && sn.sub ? str(sn.sub, 400) : undefined, emoji: str(sn.emoji, 12), color: colorOk(sn.color, '#6aa08a'), label: str(sn.label, 40) }))(r.snap as Record<string, unknown>)
          : undefined,
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
      wpx: clampN(r.wpx, 1, 30),
      arrow: r.arrow === 'end' || r.arrow === 'both' ? r.arrow : 'none',
      bend: Math.min(400, Math.max(-400, num(r.bend))),
      flow: r.flow === true ? true : undefined,
      route: oneOf(r.route, ROUTES.map((x) => x.id)),
      amp: clampN(r.amp, 2, 60),
      h0: oneOf(r.h0, HEADS.map((x) => x.id)),
      h1: oneOf(r.h1, HEADS.map((x) => x.id)),
      hs: clampN(r.hs, 0.4, 3),
      op: clampN(r.op, 0.02, 1),
    });
  }
  const bgr = (o.bg ?? {}) as Record<string, unknown>;
  const kind = oneOf(bgr.kind, BG_KINDS.map((k) => k.id)) ?? 'dots';
  return {
    v: 1,
    title: str(o.title, 120) || 'Mindmap',
    bg: { kind, tone: BG_TONES.some((t) => t.id === bgr.tone) || (typeof bgr.tone === 'string' && HEX_TONE.test(bgr.tone)) ? (bgr.tone as string) : 'paper' },
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
