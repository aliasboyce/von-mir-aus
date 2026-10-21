/**
 * "Ästhetik-Welten"-Auftrag — complete looks for the whole app (a quiet
 * landscape + gentle motion behind everything). Every colour in a world is
 * mixed into the page's own background (see `tint`), so the text colours the
 * palette and the contrast check pick stay readable on top, in light and dark.
 */
export type WorldId = 'wald' | 'meer' | 'wiese' | 'herbst' | 'winter' | 'berge' | 'nacht' | 'strand' | 'abendrot' | 'kirschbluete' | 'nebel' | 'regen' | 'polarlicht';

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
  { id: 'strand', palette: 'beige', wash: '#f0d9a8', de: { name: 'Strand', sub: 'Sanfte Dünen, leise Wellen, ziehende Möwen.' }, en: { name: 'Beach', sub: 'Soft dunes, quiet waves, drifting gulls.' } },
  { id: 'abendrot', palette: 'puder', wash: '#f2a07a', de: { name: 'Abendrot', sub: 'Eine tiefe Sonne, warme Hügel, Vögel auf dem Heimweg.' }, en: { name: 'Sunset', sub: 'A low sun, warm hills, birds on their way home.' } },
  { id: 'kirschbluete', palette: 'rose', wash: '#f4c3d2', de: { name: 'Kirschblüte', sub: 'Ein blühender Baum, Blütenblätter im Wind.' }, en: { name: 'Cherry blossom', sub: 'A blooming tree, petals in the breeze.' } },
  { id: 'nebel', palette: 'creme', wash: '#b9c4cc', de: { name: 'Morgennebel', sub: 'Stille Bäume, Nebel, der langsam zieht.' }, en: { name: 'Morning mist', sub: 'Quiet trees, slowly drifting mist.' } },
  { id: 'regen', palette: 'neutral', wash: '#9fb0c2', de: { name: 'Sanfter Regen', sub: 'Graue Hügel, leiser Regen – drinnen ist es gemütlich.' }, en: { name: 'Gentle rain', sub: 'Grey hills, soft rain – cosy inside.' } },
  { id: 'polarlicht', palette: 'abend', wash: '#4aa88f', de: { name: 'Polarlicht', sub: 'Ein stiller Winterhimmel mit sanft wehendem Licht.' }, en: { name: 'Northern lights', sub: 'A still winter sky with softly waving light.' } },
];

export const worldById = (id?: string): WorldInfo | undefined => WORLDS.find((w) => w.id === id);

/** a colour mixed into the page background: always calm, never above `pct` strength */
export const tint = (color: string, pct: number): string => `color-mix(in srgb, ${color} ${pct}%, var(--color-bg))`;
