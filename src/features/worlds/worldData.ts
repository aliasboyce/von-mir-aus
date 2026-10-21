/**
 * "Ästhetik-Welten"-Auftrag — complete looks for the whole app (a quiet
 * landscape + gentle motion behind everything). Every colour in a world is
 * mixed into the page's own background (see `tint`), so the text colours the
 * palette and the contrast check pick stay readable on top, in light and dark.
 */
export type WorldId = 'wald' | 'meer' | 'wiese' | 'herbst' | 'winter' | 'berge' | 'nacht';

export interface WorldInfo {
  id: WorldId;
  /** palette that goes with the world; picked once when the world is chosen, free to change afterwards */
  palette: string;
  de: { name: string; sub: string };
  en: { name: string; sub: string };
  /** sky wash colour at the very top */
  wash: string;
}

export const WORLDS: WorldInfo[] = [
  { id: 'wald', palette: 'wald', wash: '#7fae8f', de: { name: 'Wald', sub: 'Tannen, Lichtstrahlen, Glühwürmchen.' }, en: { name: 'Forest', sub: 'Pines, rays of light, fireflies.' } },
  { id: 'meer', palette: 'meer', wash: '#7fb2d4', de: { name: 'Meer', sub: 'Sanfte Wellen und aufsteigende Blasen.' }, en: { name: 'Sea', sub: 'Soft waves and rising bubbles.' } },
  { id: 'wiese', palette: 'salbei', wash: '#bcd78a', de: { name: 'Wiese', sub: 'Blumen im Wind, Schmetterlinge.' }, en: { name: 'Meadow', sub: 'Flowers in the wind, butterflies.' } },
  { id: 'herbst', palette: 'sonnenaufgang', wash: '#e0a35f', de: { name: 'Herbst', sub: 'Warme Bäume, fallende Blätter.' }, en: { name: 'Autumn', sub: 'Warm trees, falling leaves.' } },
  { id: 'winter', palette: 'lavendel', wash: '#a9c2dc', de: { name: 'Winter', sub: 'Verschneite Hügel, leiser Schnee.' }, en: { name: 'Winter', sub: 'Snowy hills, quiet snowfall.' } },
  { id: 'berge', palette: 'neutral', wash: '#a7b4d6', de: { name: 'Berge', sub: 'Weite Gipfel, ziehende Wolken.' }, en: { name: 'Mountains', sub: 'Wide peaks, drifting clouds.' } },
  { id: 'nacht', palette: 'abend', wash: '#5f6fb0', de: { name: 'Sternennacht', sub: 'Funkelnde Sterne, eine Sternschnuppe.' }, en: { name: 'Starry night', sub: 'Twinkling stars, a shooting star.' } },
];

export const worldById = (id?: string): WorldInfo | undefined => WORLDS.find((w) => w.id === id);

/** a colour mixed into the page background: always calm, never above `pct` strength */
export const tint = (color: string, pct: number): string => `color-mix(in srgb, ${color} ${pct}%, var(--color-bg))`;
