import type { CSSProperties } from 'react';

/**
 * Jede Projekt-Seite sieht ein bisschen anders aus (Hintergrund-Muster, Form des Zeichens, Schrift, Kopf) –
 * damit das Gehirn sich besser merken kann, wo es gerade ist. Die Funktionen bleiben gleich.
 */
export type IconShape = 'circle' | 'squircle' | 'hex' | 'diamond' | 'ticket' | 'tab' | 'drop' | 'shield';
export type HeadStyle = 'band' | 'wave' | 'tab' | 'stamp' | 'bar' | 'dots' | 'plain';

export interface PageLook {
  shape: IconShape;
  head: HeadStyle;
  font: string;
  /** Hintergrund des Seiteninhalts (nutzt die Farbe der Seite) */
  bg: (c: string) => CSSProperties;
}

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
const ROUND = 'ui-rounded, "Nunito", "Trebuchet MS", system-ui, sans-serif';

const lined = (c: string): CSSProperties => ({ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, ${mix(c, 22)} 31px 32px)` });
const grid = (c: string): CSSProperties => ({ backgroundImage: `linear-gradient(${mix(c, 14)} 1px, transparent 1px), linear-gradient(90deg, ${mix(c, 14)} 1px, transparent 1px)`, backgroundSize: '22px 22px' });
const dots = (c: string): CSSProperties => ({ backgroundImage: `radial-gradient(${mix(c, 28)} 1.6px, transparent 1.7px)`, backgroundSize: '20px 20px' });

export const PAGE_LOOKS: Record<string, PageLook> = {
  steps: { shape: 'circle', head: 'band', font: ROUND, bg: (c) => ({ backgroundImage: `repeating-linear-gradient(135deg, transparent 0 26px, ${mix(c, 9)} 26px 52px)` }) },
  tasks: { shape: 'squircle', head: 'bar', font: ROUND, bg: lined },
  timeline: { shape: 'diamond', head: 'tab', font: SERIF, bg: (c) => ({ backgroundImage: `linear-gradient(to right, transparent 17px, ${mix(c, 35)} 17px 19px, transparent 19px)` }) },
  team: { shape: 'drop', head: 'dots', font: ROUND, bg: dots },
  budget: { shape: 'hex', head: 'stamp', font: MONO, bg: grid },
  checklist: { shape: 'squircle', head: 'plain', font: ROUND, bg: (c) => ({ ...lined(c), backgroundPosition: '0 8px' }) },
  risks: { shape: 'shield', head: 'band', font: ROUND, bg: (c) => ({ backgroundImage: `repeating-linear-gradient(45deg, ${mix(c, 11)} 0 10px, transparent 10px 24px)` }) },
  decisions: { shape: 'ticket', head: 'bar', font: SERIF, bg: (c) => ({ borderLeft: `5px solid ${mix(c, 55)}` }) },
  poll: { shape: 'circle', head: 'wave', font: ROUND, bg: (c) => ({ backgroundImage: `radial-gradient(circle at 12% 8%, ${mix(c, 16)}, transparent 40%), radial-gradient(circle at 90% 60%, ${mix(c, 14)}, transparent 38%)` }) },
  proscons: { shape: 'diamond', head: 'tab', font: SERIF, bg: (c) => ({ backgroundImage: `linear-gradient(90deg, rgba(95,174,107,0.10) 50%, ${mix(c, 10)} 50%)` }) },
  table: { shape: 'squircle', head: 'stamp', font: MONO, bg: grid },
  links: { shape: 'hex', head: 'dots', font: ROUND, bg: dots },
  reminders: { shape: 'drop', head: 'wave', font: ROUND, bg: (c) => ({ backgroundImage: `repeating-radial-gradient(circle at 100% 0, transparent 0 22px, ${mix(c, 10)} 22px 24px)` }) },
  images: { shape: 'tab', head: 'tab', font: HAND, bg: (c) => ({ backgroundImage: `conic-gradient(${mix(c, 8)} 25%, transparent 0 50%, ${mix(c, 8)} 0 75%, transparent 0)`, backgroundSize: '36px 36px' }) },
  text: { shape: 'tab', head: 'plain', font: HAND, bg: (c) => ({ ...lined(c), borderLeft: `3px solid ${mix('#d0603a', 40)}`, paddingLeft: 0 }) },
  log: { shape: 'squircle', head: 'stamp', font: SERIF, bg: (c) => ({ ...lined(c), borderLeft: `10px double ${mix(c, 45)}` }) },
  box: { shape: 'ticket', head: 'plain', font: 'inherit', bg: () => ({}) },
  all: { shape: 'circle', head: 'plain', font: ROUND, bg: () => ({}) },
};

const ALIAS: Record<string, string> = { schritte: 'steps', protokoll: 'log', zettel: 'box', alles: 'all' };
export const lookOf = (key: string): PageLook => PAGE_LOOKS[ALIAS[key] ?? key] ?? PAGE_LOOKS.all;

export function shapeStyle(shape: IconShape): CSSProperties {
  switch (shape) {
    case 'circle': return { borderRadius: '50%' };
    case 'squircle': return { borderRadius: '30%' };
    case 'hex': return { clipPath: 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)' };
    case 'diamond': return { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };
    case 'ticket': return { borderRadius: '10px', clipPath: 'polygon(0 12%, 8% 12%, 8% 0, 92% 0, 92% 12%, 100% 12%, 100% 88%, 92% 88%, 92% 100%, 8% 100%, 8% 88%, 0 88%)' };
    case 'tab': return { borderRadius: '14px 14px 4px 4px' };
    case 'drop': return { borderRadius: '50% 50% 50% 8%' };
    case 'shield': return { borderRadius: '12% 12% 50% 50%' };
  }
}
