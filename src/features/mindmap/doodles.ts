/**
 * Kritzel („Doodles“): kleine, mit der Hand gezeichnet wirkende Formen, Pfeile, Sprechblasen und Zeichen.
 * Alle Pfade liegen in einer Box um (0,0); `w`/`h` ist die Größe dieser Box. Sie werden nur als Linie
 * gezeichnet (oder mit weicher Füllung bei `fill`), damit sie sich wie echte Kritzeleien anfühlen.
 */
export interface Doodle {
  id: string;
  de: string;
  en: string;
  group: 'shapes' | 'arrows' | 'bubbles' | 'marks' | 'nature' | 'icons' | 'people';
  d: string;
  /** only this part is filled (figures: the head, objects: the body) – the rest stays a line */
  fillD?: string;
  w: number;
  h: number;
  /** a closed shape that can get a soft fill */
  fill?: boolean;
  dash?: 'dashed' | 'dotted';
  /** text can be written inside (speech bubbles, banners …): centre and width of the text area */
  text?: { cy: number; w: number };
  /** drawn with rounded round-cap dots for dotted lines */
  round?: boolean;
}

const pt = (a: number, r: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
const poly = (pts: ReadonlyArray<readonly [number, number]>) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z';
function star(n: number, r1: number, r2: number): string {
  const pts: (readonly [number, number])[] = [];
  for (let i = 0; i < n * 2; i++) pts.push(pt((i * Math.PI) / n - Math.PI / 2, i % 2 ? r2 : r1));
  return poly(pts);
}
function spiral(): string {
  let d = '';
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 5;
    const r = 3 + t * 2.7;
    d += `${i ? ' L' : 'M'} ${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
  }
  return d;
}
function sun(): string {
  let d = 'M 14 0 A 14 14 0 1 0 -14 0 A 14 14 0 1 0 14 0 Z';
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    const [x1, y1] = pt(a, 24);
    const [x2, y2] = pt(a, i % 2 ? 36 : 44);
    d += ` M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}
function flower(): string {
  let d = 'M 9 0 A 9 9 0 1 0 -9 0 A 9 9 0 1 0 9 0 Z';
  for (let i = 0; i < 6; i++) {
    const [cx, cy] = pt((i * Math.PI) / 3, 26);
    d += ` M ${(cx + 14).toFixed(1)} ${cy.toFixed(1)} A 14 14 0 1 0 ${(cx - 14).toFixed(1)} ${cy.toFixed(1)} A 14 14 0 1 0 ${(cx + 14).toFixed(1)} ${cy.toFixed(1)} Z`;
  }
  return d;
}

function gearPath(): string {
  const teeth = 8;
  const r1 = 46;
  const r2 = 35;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i * 2 * Math.PI) / teeth;
    const step = (2 * Math.PI) / teeth;
    for (const [off, r] of [[-0.33, r2], [-0.2, r1], [0.2, r1], [0.33, r2]] as const) {
      const a = a0 + off * step * 1.5;
      pts.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
    }
  }
  return `M ${pts.join(' L ')} Z`;
}
const GEAR = gearPath();
const HEAD = 'M -11 -34 a 11 11 0 1 0 22 0 a 11 11 0 1 0 -22 0 Z';
const FIG = (body: string) => `${HEAD} ${body}`;
const BULB = 'M 0 -44 C -26 -44 -38 -24 -38 -8 C -38 8 -26 16 -22 28 L -22 34 H 22 L 22 28 C 26 16 38 8 38 -8 C 38 -24 26 -44 0 -44 Z';
const BOOK = 'M 0 -26 C -14 -34 -34 -34 -48 -28 V 30 C -34 24 -14 24 0 32 C 14 24 34 24 48 30 V -28 C 34 -34 14 -34 0 -26 Z';
const CUBE = 'M -40 -12 L 0 -32 L 40 -12 L 40 28 L 0 48 L -40 28 Z';

const CLOUD = 'M -30 22 C -50 22 -52 -2 -34 -4 C -36 -26 -6 -34 6 -18 C 18 -34 46 -22 40 -2 C 56 0 54 22 36 22 Z';
const CIRCLE = 'M 0 -46 C 26 -48 48 -26 46 2 C 44 28 24 48 -2 47 C -28 46 -48 26 -46 -2 C -44 -28 -24 -47 4 -47';
const SQUARE = 'M -44 -42 L 43 -44 L 45 41 L -43 44 L -45 -40';
const SMILE = 'M 40 0 A 40 40 0 1 0 -40 0 A 40 40 0 1 0 40 0 Z M -14 -10 V -4 M 14 -10 V -4 M -22 12 C -10 28 10 28 22 12';

export const DOODLES: Doodle[] = [
  // shapes
  { id: 'circle', de: 'Kreis', en: 'Circle', group: 'shapes', d: CIRCLE, w: 100, h: 100, fill: true },
  { id: 'circle-dashed', de: 'Kreis gestrichelt', en: 'Dashed circle', group: 'shapes', d: CIRCLE, w: 100, h: 100, dash: 'dashed' },
  { id: 'circle-dotted', de: 'Kreis gepunktet', en: 'Dotted circle', group: 'shapes', d: CIRCLE, w: 100, h: 100, dash: 'dotted', round: true },
  { id: 'square', de: 'Quadrat', en: 'Square', group: 'shapes', d: SQUARE, w: 100, h: 100, fill: true },
  { id: 'square-dashed', de: 'Quadrat gestrichelt', en: 'Dashed square', group: 'shapes', d: SQUARE, w: 100, h: 100, dash: 'dashed' },
  { id: 'triangle', de: 'Dreieck', en: 'Triangle', group: 'shapes', d: 'M 0 -44 L 46 40 L -46 42 Z', w: 100, h: 100, fill: true },
  { id: 'star', de: 'Stern', en: 'Star', group: 'shapes', d: star(5, 48, 20), w: 100, h: 100, fill: true },
  { id: 'heart', de: 'Herz', en: 'Heart', group: 'shapes', d: 'M 0 40 C -50 6 -46 -38 -22 -38 C -8 -38 0 -28 0 -22 C 0 -28 8 -38 22 -38 C 46 -38 50 6 0 40 Z', w: 100, h: 90, fill: true },
  { id: 'spiral', de: 'Spirale', en: 'Spiral', group: 'shapes', d: spiral(), w: 100, h: 100 },
  { id: 'corners', de: 'Fokus-Ecken', en: 'Focus corners', group: 'shapes', d: 'M -44 -20 V -44 H -20 M 20 -44 H 44 V -20 M 44 20 V 44 H 20 M -20 44 H -44 V 20', w: 100, h: 100 },
  { id: 'highlight', de: 'Marker-Fleck', en: 'Highlighter blob', group: 'shapes', d: 'M -46 -10 C -40 -22 40 -24 46 -12 C 50 4 44 18 36 20 C 10 24 -30 22 -44 14 C -50 8 -48 -4 -46 -10 Z', w: 100, h: 50, fill: true, text: { cy: 0, w: 84 } },
  { id: 'cloud', de: 'Wolke', en: 'Cloud', group: 'shapes', d: CLOUD, w: 100, h: 70, fill: true, text: { cy: 0, w: 70 } },
  // arrows
  { id: 'arrow', de: 'Pfeil', en: 'Arrow', group: 'arrows', d: 'M -44 0 H 42 M 22 -18 L 43 0 L 22 18', w: 100, h: 50 },
  { id: 'arrow-double', de: 'Doppelpfeil', en: 'Double arrow', group: 'arrows', d: 'M -42 0 H 42 M 22 -16 L 43 0 L 22 16 M -22 -16 L -43 0 L -22 16', w: 100, h: 50 },
  { id: 'arrow-curved', de: 'Bogenpfeil', en: 'Curved arrow', group: 'arrows', d: 'M -42 22 C -34 -28 8 -40 38 -14 M 18 -22 L 40 -12 L 30 10', w: 100, h: 70 },
  { id: 'arrow-bent', de: 'Knickpfeil', en: 'Bent arrow', group: 'arrows', d: 'M -40 36 V -8 Q -40 -22 -26 -22 H 34 M 18 -38 L 38 -22 L 18 -6', w: 100, h: 80 },
  { id: 'arrow-circle', de: 'Kreispfeil', en: 'Circular arrow', group: 'arrows', d: 'M 34 -22 A 40 40 0 1 0 40 10 M 38 -40 L 36 -20 L 16 -26', w: 100, h: 100 },
  { id: 'arrow-zigzag', de: 'Zickzack-Pfeil', en: 'Zigzag arrow', group: 'arrows', d: 'M -44 14 L -26 -14 L -10 14 L 8 -14 L 26 14 M 12 22 L 28 16 L 24 0', w: 100, h: 60 },
  { id: 'arrow-block', de: 'Dicker Pfeil', en: 'Block arrow', group: 'arrows', d: 'M -44 -14 H 8 V -32 L 46 0 L 8 32 V 14 H -44 Z', w: 100, h: 70, fill: true },
  { id: 'arrow-loop', de: 'Schleifenpfeil', en: 'Loop arrow', group: 'arrows', d: 'M -44 22 C -20 22 -10 -4 4 -4 C 20 -4 20 22 4 22 C -10 22 -2 -22 20 -26 C 30 -28 38 -22 42 -14 M 26 -14 L 43 -14 L 40 -31', w: 100, h: 70 },
  { id: 'brace', de: 'Klammer', en: 'Curly brace', group: 'arrows', d: 'M 14 -46 C -2 -46 0 -30 0 -22 C 0 -10 -10 0 -18 0 C -10 0 0 10 0 22 C 0 30 -2 46 14 46', w: 40, h: 100 },
  // bubbles
  { id: 'speech', de: 'Sprechblase', en: 'Speech bubble', group: 'bubbles', d: 'M -34 -36 H 34 Q 46 -36 46 -24 V 8 Q 46 20 34 20 H 2 L -20 42 L -18 20 H -34 Q -46 20 -46 8 V -24 Q -46 -36 -34 -36 Z', w: 100, h: 84, fill: true, text: { cy: -8, w: 76 } },
  { id: 'speech-oval', de: 'Runde Sprechblase', en: 'Round speech bubble', group: 'bubbles', d: 'M 0 -38 C 34 -38 50 -22 50 -6 C 50 12 30 24 4 24 C -2 24 -8 24 -12 22 L -34 40 L -28 18 C -44 12 -50 2 -50 -6 C -50 -22 -34 -38 0 -38 Z', w: 100, h: 80, fill: true, text: { cy: -8, w: 70 } },
  { id: 'thought', de: 'Gedankenblase', en: 'Thought bubble', group: 'bubbles', d: `${CLOUD.replace(/ L |Z/g, (m) => m)} M -26 36 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 M -38 46 m -3.5 0 a 3.5 3.5 0 1 0 7 0 a 3.5 3.5 0 1 0 -7 0`, w: 100, h: 100, fill: true, text: { cy: -4, w: 66 } },
  { id: 'burst', de: 'Ausruf-Zacken', en: 'Burst', group: 'bubbles', d: star(12, 48, 34), w: 100, h: 100, fill: true, text: { cy: 0, w: 60 } },
  { id: 'banner', de: 'Banner', en: 'Banner', group: 'bubbles', d: 'M -48 -16 H 48 L 38 0 L 48 16 H -48 L -38 0 Z', w: 100, h: 40, fill: true, text: { cy: 0, w: 70 } },
  { id: 'label', de: 'Etikett', en: 'Label', group: 'bubbles', d: 'M -46 -18 H 24 L 46 0 L 24 18 H -46 Z M -34 -3 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0', w: 100, h: 40, fill: true, text: { cy: 0, w: 56 } },
  // marks
  { id: 'check', de: 'Haken', en: 'Check mark', group: 'marks', d: 'M -34 4 L -12 28 L 36 -30', w: 80, h: 70 },
  { id: 'cross', de: 'Kreuz', en: 'Cross', group: 'marks', d: 'M -30 -30 L 30 30 M 30 -30 L -30 30', w: 70, h: 70 },
  { id: 'exclaim', de: 'Ausrufezeichen', en: 'Exclamation mark', group: 'marks', d: 'M 0 -42 V 12 M 0 31 V 33', w: 30, h: 90 },
  { id: 'question', de: 'Fragezeichen', en: 'Question mark', group: 'marks', d: 'M -20 -24 C -20 -48 24 -48 24 -22 C 24 -4 0 -6 0 14 M 0 32 V 34', w: 60, h: 90 },
  { id: 'bolt', de: 'Blitz', en: 'Lightning', group: 'marks', d: 'M 10 -46 L -24 4 H -2 L -10 46 L 28 -6 H 6 Z', w: 60, h: 100, fill: true },
  { id: 'wave', de: 'Wellenlinie', en: 'Squiggle', group: 'marks', d: 'M -46 0 q 8 -16 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0', w: 100, h: 30 },
  { id: 'zigzag', de: 'Zickzack', en: 'Zigzag', group: 'marks', d: 'M -46 10 L -32 -10 L -18 10 L -4 -10 L 10 10 L 24 -10 L 38 10 L 46 -4', w: 100, h: 30 },
  { id: 'underline', de: 'Unterstreichen', en: 'Underline', group: 'marks', d: 'M -46 8 C -20 -2 20 14 46 0', w: 100, h: 24 },
  { id: 'underline2', de: 'Doppelt unterstreichen', en: 'Double underline', group: 'marks', d: 'M -46 -6 C -20 -14 20 0 46 -10 M -42 10 C -16 2 20 14 44 6', w: 100, h: 34 },
  { id: 'line-dashed', de: 'Gestrichelte Linie', en: 'Dashed line', group: 'marks', d: 'M -46 0 H 46', w: 100, h: 10, dash: 'dashed' },
  { id: 'line-dotted', de: 'Gepunktete Linie', en: 'Dotted line', group: 'marks', d: 'M -46 0 H 46', w: 100, h: 10, dash: 'dotted', round: true },
  { id: 'sparkle', de: 'Funkeln', en: 'Sparkle', group: 'marks', d: 'M 0 -44 Q 4 -4 44 0 Q 4 4 0 44 Q -4 4 -44 0 Q -4 -4 0 -44 Z', w: 90, h: 90, fill: true },
  // things
  { id: 'lightbulb', de: 'Glühbirne', en: 'Light bulb', group: 'icons', d: `${BULB} M -14 42 H 14 M -9 50 H 9 M -10 28 V 8 L 0 -4 L 10 8 V 28 M 0 -62 V -54 M -44 -50 L -38 -44 M 44 -50 L 38 -44 M -58 -14 H -50 M 58 -14 H 50`, fillD: BULB, w: 124, h: 120 },
  { id: 'pencil', de: 'Stift', en: 'Pencil', group: 'icons', d: 'M -36 38 L -14 28.8 L 22.8 -8 L 31.3 -16.5 L 18.5 -29.3 L 10 -20.8 L -26.8 16 Z M -26.8 16 L -14 28.8 M 10 -20.8 L 22.8 -8 M -36 38 L -31 27', fillD: 'M -26.8 16 L -14 28.8 L 22.8 -8 L 10 -20.8 Z', w: 80, h: 80 },
  { id: 'box', de: 'Karton', en: 'Box', group: 'icons', d: `${CUBE} M -40 -12 L 0 8 L 40 -12 M 0 8 V 48 M -22 -22 L 18 -2 V 12`, fillD: CUBE, w: 90, h: 90 },
  { id: 'gear', de: 'Zahnrad', en: 'Gear', group: 'icons', d: `${GEAR} M 14 0 A 14 14 0 1 0 -14 0 A 14 14 0 1 0 14 0 Z`, fillD: GEAR, w: 100, h: 100 },
  { id: 'book', de: 'Buch', en: 'Book', group: 'icons', d: `${BOOK} M 0 -26 V 32 M -38 -14 C -28 -18 -16 -18 -8 -14 M -38 -2 C -28 -6 -16 -6 -8 -2 M -38 10 C -28 6 -16 6 -8 10 M 8 -14 C 16 -18 28 -18 38 -14 M 8 -2 C 16 -6 28 -6 38 -2`, fillD: BOOK, w: 100, h: 70 },
  { id: 'books', de: 'Bücher', en: 'Books', group: 'icons', d: 'M -44 44 V -26 H -24 V 44 Z M -24 44 V -40 H -2 V 44 Z M -2 44 V -18 H 16 V 44 Z M 20 44 L 32 -36 L 50 -32 L 38 46 Z M -44 44 H 50 M -44 -10 H -24 M -24 -26 H -2 M -2 4 H 16 M 24 10 L 42 14', fillD: 'M -44 44 V -26 H -24 V 44 Z M -24 44 V -40 H -2 V 44 Z M -2 44 V -18 H 16 V 44 Z M 20 44 L 32 -36 L 50 -32 L 38 46 Z', w: 100, h: 90 },
  { id: 'key', de: 'Schlüssel', en: 'Key', group: 'icons', d: 'M -22 -10 a 16 16 0 1 0 0.1 0 Z M -10 2 L 40 40 M 28 30 L 36 22 M 38 38 L 46 30', fillD: 'M -22 -10 a 16 16 0 1 0 0.1 0 Z', w: 100, h: 90 },
  { id: 'target', de: 'Zielscheibe', en: 'Target', group: 'icons', d: 'M 44 0 A 44 44 0 1 0 -44 0 A 44 44 0 1 0 44 0 Z M 28 0 A 28 28 0 1 0 -28 0 A 28 28 0 1 0 28 0 Z M 12 0 A 12 12 0 1 0 -12 0 A 12 12 0 1 0 12 0 Z', w: 100, h: 100 },
  { id: 'flag', de: 'Fahne', en: 'Flag', group: 'icons', d: 'M -30 -46 V 48 M -30 -42 C -10 -52 10 -32 40 -42 V 6 C 10 16 -10 -4 -30 6', fillD: 'M -30 -42 C -10 -52 10 -32 40 -42 V 6 C 10 16 -10 -4 -30 6 Z', w: 80, h: 100 },
  { id: 'house', de: 'Haus', en: 'House', group: 'icons', d: 'M -44 2 L 0 -38 L 44 2 M -34 -6 V 42 H 34 V -6 M -10 42 V 16 H 10 V 42', fillD: 'M -34 -6 L 0 -36 L 34 -6 V 42 H -34 Z', w: 100, h: 90 },
  { id: 'clock', de: 'Uhr', en: 'Clock', group: 'icons', d: 'M 44 0 A 44 44 0 1 0 -44 0 A 44 44 0 1 0 44 0 Z M 0 -26 V 0 L 18 12 M 0 -38 V -34 M 38 0 H 34 M 0 38 V 34 M -38 0 H -34', fillD: 'M 44 0 A 44 44 0 1 0 -44 0 A 44 44 0 1 0 44 0 Z', w: 100, h: 100 },
  { id: 'magnifier', de: 'Lupe', en: 'Magnifier', group: 'icons', d: 'M 10 -10 A 30 30 0 1 0 -50 -10 A 30 30 0 1 0 10 -10 Z M 10 12 L 44 46 M -36 -26 A 18 18 0 0 1 -18 -34', w: 100, h: 100 },
  { id: 'calendar', de: 'Kalender', en: 'Calendar', group: 'icons', d: 'M -40 -30 H 40 V 42 H -40 Z M -40 -12 H 40 M -22 -40 V -24 M 22 -40 V -24 M -24 4 H -14 M -5 4 H 5 M 14 4 H 24 M -24 22 H -14 M -5 22 H 5', fillD: 'M -40 -30 H 40 V 42 H -40 Z', w: 90, h: 90 },
  { id: 'lock', de: 'Schloss', en: 'Lock', group: 'icons', d: 'M -32 -4 H 32 V 42 H -32 Z M -20 -4 V -20 A 20 20 0 0 1 20 -20 V -4 M 0 14 V 26', fillD: 'M -32 -4 H 32 V 42 H -32 Z', w: 90, h: 100 },
  { id: 'mail', de: 'Brief', en: 'Letter', group: 'icons', d: 'M -44 -26 H 44 V 28 H -44 Z M -44 -26 L 0 8 L 44 -26', fillD: 'M -44 -26 H 44 V 28 H -44 Z', w: 100, h: 70 },
  { id: 'cup', de: 'Tasse', en: 'Cup', group: 'icons', d: 'M -34 -18 H 24 V 24 C 24 38 14 44 -5 44 C -24 44 -34 38 -34 24 Z M 24 -8 H 34 C 44 -8 44 16 32 16 H 24 M -22 -34 C -26 -42 -16 -42 -20 -50 M -6 -34 C -10 -42 0 -42 -4 -50 M 10 -34 C 6 -42 16 -42 12 -50', fillD: 'M -34 -18 H 24 V 24 C 24 38 14 44 -5 44 C -24 44 -34 38 -34 24 Z', w: 90, h: 100 },
  // little people (stick figures)
  { id: 'fig-stand', de: 'Männchen stehend', en: 'Figure standing', group: 'people', d: FIG('M 0 -23 V 12 M 0 -14 L -20 4 M 0 -14 L 20 4 M 0 12 L -14 44 M 0 12 L 14 44'), fillD: HEAD, w: 70, h: 100 },
  { id: 'fig-wave', de: 'Männchen winkt', en: 'Figure waving', group: 'people', d: FIG('M 0 -23 V 12 M 0 -14 L -20 4 M 0 -14 L 22 -32 M 0 12 L -14 44 M 0 12 L 14 44'), fillD: HEAD, w: 80, h: 100 },
  { id: 'fig-jump', de: 'Männchen springt', en: 'Figure jumping', group: 'people', d: FIG('M 0 -23 V 10 M 0 -14 L -24 -34 M 0 -14 L 24 -34 M 0 10 L -22 38 M 0 10 L 22 38'), fillD: HEAD, w: 80, h: 100 },
  { id: 'fig-walk', de: 'Männchen geht', en: 'Figure walking', group: 'people', d: FIG('M 0 -23 V 10 M 0 -14 L -16 6 M 0 -14 L 14 2 M 0 10 L -18 42 M 0 10 L 16 40'), fillD: HEAD, w: 70, h: 100 },
  { id: 'fig-run', de: 'Männchen rennt', en: 'Figure running', group: 'people', d: 'M 6 -34 a 11 11 0 1 0 22 0 a 11 11 0 1 0 -22 0 Z M 14 -22 L 4 10 M 10 -12 L -12 -2 L -22 -16 M 10 -12 L 28 2 M 4 10 L -14 30 L -34 28 M 4 10 L 24 28 L 22 46', fillD: 'M 6 -34 a 11 11 0 1 0 22 0 a 11 11 0 1 0 -22 0 Z', w: 90, h: 100 },
  { id: 'fig-sit', de: 'Männchen sitzt', en: 'Figure sitting', group: 'people', d: FIG('M 0 -23 V 14 H 30 V 42 M 0 -12 L 20 -2 L 30 14 M -26 42 H 44'), fillD: HEAD, w: 90, h: 100 },
  { id: 'fig-meditate', de: 'Männchen meditiert', en: 'Figure meditating', group: 'people', d: FIG('M 0 -23 V 8 M 0 -12 L -20 8 L -26 22 M 0 -12 L 20 8 L 26 22 M -36 32 Q 0 12 36 32 Q 0 44 -36 32'), fillD: HEAD, w: 90, h: 90 },
  { id: 'fig-heart', de: 'Männchen mit Herz', en: 'Figure with heart', group: 'people', d: `${FIG('M 0 -23 V 12 M 0 -14 L -18 4 M 0 -14 L 20 -10 M 0 12 L -14 44 M 0 12 L 14 44')} M 36 -6 C 20 -18 28 -34 36 -26 C 44 -34 52 -18 36 -6 Z`, fillD: `${HEAD} M 36 -6 C 20 -18 28 -34 36 -26 C 44 -34 52 -18 36 -6 Z`, w: 100, h: 100 },
  { id: 'fig-two', de: 'Zu zweit', en: 'Two together', group: 'people', d: 'M -29 -26 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M 11 -26 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M -20 -17 V 12 M 20 -17 V 12 M -20 -8 L 0 2 M 20 -8 L 0 2 M -20 -8 L -34 6 M 20 -8 L 34 6 M -20 12 L -28 40 M -20 12 L -12 40 M 20 12 L 12 40 M 20 12 L 28 40', fillD: 'M -29 -26 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M 11 -26 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z', w: 100, h: 90 },
  { id: 'fig-group', de: 'Gruppe', en: 'Group', group: 'people', d: 'M -4 -34 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M 5 -25 V 4 M 5 -16 L -8 -2 M 5 -16 L 18 -2 M 5 4 L -2 30 M 5 4 L 12 30 M -36 -14 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0 Z M -28 -6 V 16 M -28 -1 L -38 10 M -28 -1 L -18 10 M -28 16 L -34 36 M -28 16 L -22 36 M 20 -14 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0 Z M 28 -6 V 16 M 28 -1 L 18 10 M 28 -1 L 38 10 M 28 16 L 22 36 M 28 16 L 34 36', fillD: 'M -4 -34 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M -36 -14 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0 Z M 20 -14 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0 Z', w: 100, h: 90 },
  { id: 'fig-think', de: 'Männchen denkt', en: 'Figure thinking', group: 'people', d: FIG('M 0 -23 V 12 M 0 -14 L -18 4 M 0 -14 L 10 -4 L 6 -22 M 0 12 L -14 44 M 0 12 L 14 44'), fillD: HEAD, w: 70, h: 100 },
  { id: 'fig-sleep', de: 'Männchen schläft', en: 'Figure sleeping', group: 'people', d: 'M -40 6 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z M -22 8 H 34 M -4 8 L 8 -4 M 34 8 L 44 20 M -48 18 H 50 M 18 -22 H 30 L 18 -10 H 30 M 36 -34 H 44 L 36 -26 H 44', fillD: 'M -40 6 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 Z', w: 110, h: 80 },
  // nature / fun
  { id: 'sun', de: 'Sonne', en: 'Sun', group: 'nature', d: sun(), w: 100, h: 100 },
  { id: 'flower', de: 'Blume', en: 'Flower', group: 'nature', d: flower(), w: 100, h: 100, fill: true },
  { id: 'smile', de: 'Lächeln', en: 'Smiley', group: 'nature', d: SMILE, w: 90, h: 90, fill: true },
  { id: 'pin', de: 'Markierung', en: 'Pin', group: 'nature', d: 'M 0 44 C -30 8 -34 -4 -34 -14 C -34 -34 -18 -46 0 -46 C 18 -46 34 -34 34 -14 C 34 -4 30 8 0 44 Z M -10 -14 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0', w: 70, h: 92, fill: true },
];

export const DOODLE_GROUPS: { id: Doodle['group']; de: string; en: string }[] = [
  { id: 'icons', de: 'Dinge', en: 'Things' },
  { id: 'people', de: 'Männchen', en: 'People' },
  { id: 'shapes', de: 'Formen', en: 'Shapes' },
  { id: 'arrows', de: 'Pfeile', en: 'Arrows' },
  { id: 'bubbles', de: 'Sprechblasen', en: 'Bubbles' },
  { id: 'marks', de: 'Zeichen & Linien', en: 'Marks & lines' },
  { id: 'nature', de: 'Mehr', en: 'More' },
];

const byId = new Map(DOODLES.map((d) => [d.id, d]));
export const doodleOf = (id: string | undefined): Doodle => (id && byId.get(id)) || DOODLES[0];
export const doodleIds = new Set(DOODLES.map((d) => d.id));
