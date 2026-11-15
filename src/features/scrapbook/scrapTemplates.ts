import { layoutNode, newNode, type MMNode } from '../mindmap/mindmapModel';

/** Seiten-Vorlagen: Texte, Zettel, Tesa und Foto-Plätze. Fotos werden – wenn gewählt – in die Plätze gesetzt. */
export interface PhotoSlot { x: number; y: number; w: number; rot: number; style: 'polaroid' | 'plain' | 'rounded' | 'round' }
export interface PageTemplate {
  id: string;
  emoji: string;
  de: string;
  en: string;
  /** Platzhalter-Elemente (Überschrift, Zettel …) – Texte in der Sprache der Person */
  decor: (lang: 'de' | 'en', date: Date) => MMNode[];
  slots: PhotoSlot[];
}

const INK = '#3a2f22';
const txt = (x: number, y: number, text: string, o: Partial<MMNode> = {}) =>
  newNode({ x, y, shape: 'plain', text, font: 'hand', size: 3, color: INK, tc: INK, nofill: true, ...o });
const note = (x: number, y: number, text: string, color: string, variant: string, rot: number, o: Partial<MMNode> = {}) =>
  newNode({ x, y, shape: 'note', text, color, variant, rot, size: 2, look: 'soft', ...o });

const dateLong = (lang: 'de' | 'en', d: Date) =>
  d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const PAGE_TEMPLATES: PageTemplate[] = [
  { id: 'leer', emoji: '▫️', de: 'Leer', en: 'Blank', decor: () => [], slots: [] },
  {
    id: 'foto',
    emoji: '🖼️',
    de: 'Ein großes Foto',
    en: 'One big photo',
    decor: (lang, d) => [txt(0, 470, lang === 'en' ? 'a moment I want to keep' : 'ein Moment, den ich behalten will', { size: 3 }), txt(0, -500, dateLong(lang, d).toUpperCase(), { font: 'typewriter', size: 2 })],
    slots: [{ x: 0, y: -40, w: 600, rot: -1.5, style: 'polaroid' }],
  },
  {
    id: 'collage4',
    emoji: '🔲',
    de: 'Collage mit vier Fotos',
    en: 'Four-photo collage',
    decor: (lang) => [txt(0, -500, lang === 'en' ? 'This week' : 'Diese Woche', { size: 4, font: 'script' }), note(260, 470, lang === 'en' ? 'best bit:' : 'das Beste:', '#f2d27a', 'tape', 4)],
    slots: [
      { x: -170, y: -230, w: 300, rot: -4, style: 'polaroid' },
      { x: 175, y: -190, w: 300, rot: 3, style: 'polaroid' },
      { x: -170, y: 140, w: 300, rot: 2.5, style: 'polaroid' },
      { x: 175, y: 190, w: 300, rot: -3, style: 'polaroid' },
    ],
  },
  {
    id: 'collage3',
    emoji: '🧩',
    de: 'Ein großes + zwei kleine',
    en: 'One big + two small',
    decor: (lang, d) => [txt(0, -510, dateLong(lang, d), { font: 'typewriter', size: 2 }), txt(0, 470, lang === 'en' ? 'little things that made me smile' : 'kleine Dinge, die mich froh gemacht haben', { size: 2 })],
    slots: [
      { x: 0, y: -210, w: 560, rot: -1, style: 'plain' },
      { x: -170, y: 190, w: 290, rot: 3, style: 'polaroid' },
      { x: 170, y: 220, w: 290, rot: -3, style: 'polaroid' },
    ],
  },
  {
    id: 'tag',
    emoji: '📝',
    de: 'Tagebuchseite',
    en: 'Diary page',
    decor: (lang, d) => [
      txt(-30, -490, dateLong(lang, d).toUpperCase(), { font: 'typewriter', size: 2, tsz: 1 }),
      note(0, 150, lang === 'en' ? 'Today…\n\n' : 'Heute …\n\n', '#fff6dc', 'index', -0.8, { size: 3, sx: 2.5, sy: 3.4 }),
      note(250, 430, lang === 'en' ? 'mood ☁️' : 'Stimmung ☁️', '#cfe3d3', 'tape', 3),
    ],
    slots: [{ x: 120, y: -290, w: 360, rot: 2, style: 'polaroid' }],
  },
  {
    id: 'reihe',
    emoji: '🎞️',
    de: 'Drei Polaroids',
    en: 'Three polaroids',
    decor: (lang) => [txt(0, -500, lang === 'en' ? 'snapshots' : 'Schnappschüsse', { size: 4, font: 'script' })],
    slots: [
      { x: -130, y: -250, w: 330, rot: -5, style: 'polaroid' },
      { x: 120, y: 50, w: 330, rot: 4, style: 'polaroid' },
      { x: -110, y: 330, w: 330, rot: -2.5, style: 'polaroid' },
    ],
  },
  {
    id: 'titel',
    emoji: '🏷️',
    de: 'Titelseite',
    en: 'Title page',
    decor: (lang) => [
      newNode({ x: 0, y: 0, shape: 'frame', fw: 600, fh: 800, variant: 'classic', text: '', color: INK, look: 'outline' }),
      txt(0, -40, lang === 'en' ? 'My story' : 'Meine Geschichte', { size: 4, font: 'script', sc: 2 }),
      txt(0, 90, lang === 'en' ? 'a little book of moments' : 'ein kleines Buch voller Momente', { size: 2 }),
    ],
    slots: [],
  },
];

/** Foto in einen Platz setzen: gleich breit, mit Drehung und Rahmen */
export function photoNodeFor(slot: PhotoSlot, img: { dataUrl: string; ar: number }): MMNode {
  const probe = newNode({ x: 0, y: 0, shape: 'image', img: img.dataUrl, ar: img.ar, size: 2 });
  const base = layoutNode(probe).w || 200;
  return { ...probe, x: slot.x, y: slot.y, sc: Math.min(8, Math.max(0.2, slot.w / base)), rot: slot.rot, imgStyle: slot.style, color: '#ffffff' };
}
