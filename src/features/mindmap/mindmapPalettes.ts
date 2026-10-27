import { useEffect, useState } from 'react';
import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/** Farbpaletten für Mindmaps: schöne Beispiele zum Loslegen und eigene, mit Namen gespeicherte. */
export interface MMPalette {
  id: string;
  name: string;
  colors: string[];
  /** ready-made example (cannot be edited, but can be copied) */
  builtin?: boolean;
  nameEn?: string;
}

export const BUILTIN_PALETTES: MMPalette[] = [
  { id: 'b-pastelblue', name: 'Pastellblau', nameEn: 'Pastel blue', builtin: true, colors: ['#eaf4fc', '#d3e8f8', '#bcdcf3', '#a4cfec', '#8dc1e4', '#76b2da', '#609fcc', '#4b8abb'] },
  { id: 'b-sky', name: 'Himmel & Meer', nameEn: 'Sky & sea', builtin: true, colors: ['#e0f3f8', '#c4e6ef', '#a8d9e6', '#8fcbdb', '#c9e3f6', '#aed0ee', '#94bde4', '#7aaad8'] },
  { id: 'b-bluehour', name: 'Blaue Stunde', nameEn: 'Blue hour', builtin: true, colors: ['#e6eefb', '#cfdcf5', '#b9caee', '#a3b8e6', '#c3bff0', '#b0a9e8', '#9c94df', '#8a82d4'] },
  { id: 'b-icy', name: 'Eisblau', nameEn: 'Icy blue', builtin: true, colors: ['#f2f9fd', '#e1f0fa', '#cfe7f6', '#bcdef2', '#a9d4ee', '#d9edf3', '#c1e2eb', '#a9d6e2'] },
  { id: 'b-rainbow', name: 'Pastell-Regenbogen', nameEn: 'Pastel rainbow', builtin: true, colors: ['#f7c6c7', '#f9d9b6', '#f8ecb0', '#cfe8b6', '#b5e3d0', '#b7daf2', '#cdc6f0', '#ecc4e3'] },
  { id: 'b-rose', name: 'Rosé & Pfirsich', nameEn: 'Rose & peach', builtin: true, colors: ['#fde8e8', '#fbd5d5', '#f8c2c8', '#f4aebb', '#fde3d1', '#fbd0b3', '#f7bd99', '#f1a984'] },
  { id: 'b-sage', name: 'Salbei & Mint', nameEn: 'Sage & mint', builtin: true, colors: ['#eef5ee', '#dbebdc', '#c8e0ca', '#b4d5b8', '#d7f0e6', '#bfe6d6', '#a7dcc6', '#8fd1b5'] },
  { id: 'b-lavender', name: 'Lavendel-Träume', nameEn: 'Lavender dreams', builtin: true, colors: ['#f3effa', '#e6dff5', '#d9cff0', '#cbbfea', '#bdaee4', '#e9d8f0', '#dcc2e8', '#cfaee0'] },
  { id: 'b-sunset', name: 'Abendrot', nameEn: 'Sunset', builtin: true, colors: ['#ffe3b3', '#ffcf99', '#ffb98a', '#f9a07f', '#f28b82', '#e57a8e', '#cf6fa0', '#a86bb0'] },
  { id: 'b-earth', name: 'Erde & Sand', nameEn: 'Earth & sand', builtin: true, colors: ['#f6efe0', '#ecdfc4', '#e0cba5', '#d1b88a', '#c3a272', '#a98a62', '#8d7352', '#6f5b43'] },
  { id: 'b-forest', name: 'Wald', nameEn: 'Forest', builtin: true, colors: ['#e1ecd5', '#c9dcb5', '#aecb94', '#8fb773', '#6fa05a', '#528849', '#3b6e3d', '#2b5232'] },
  { id: 'b-strong', name: 'Kräftig', nameEn: 'Strong', builtin: true, colors: ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#00acc1', '#1e88e5', '#5e35b1', '#d81b60'] },
  { id: 'b-greys', name: 'Grau & Schwarz', nameEn: 'Greys', builtin: true, colors: ['#ffffff', '#f0efec', '#d9d7d2', '#bdbab3', '#9a968e', '#6e6b64', '#45423d', '#26231f'] },
  { id: 'b-night', name: 'Nacht', nameEn: 'Night', builtin: true, colors: ['#1b2433', '#26334a', '#35465f', '#4a5d7a', '#6a7da0', '#8b9bbb', '#b3bfd6', '#dde3ee'] },
];

export const customPaletteRepo = createRepository<MMPalette>('mindmap-palettes');
const activeStore = createKeyValueStore<string>('mindmap-palette-active', 'b-pastelblue');
const EVT = 'mm-palettes-changed';
const fire = () => window.dispatchEvent(new Event(EVT));

export const allPalettes = (): MMPalette[] => [...BUILTIN_PALETTES, ...customPaletteRepo.getAll()];
export const activePaletteId = () => activeStore.get();
export function setActivePalette(id: string) {
  activeStore.set(id);
  fire();
}
export function savePalette(p: Pick<MMPalette, 'name' | 'colors'> & { id?: string }): MMPalette {
  const colors = p.colors.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 24);
  const out: MMPalette = { id: p.id ?? createId('mmpal'), name: p.name.trim().slice(0, 40) || 'Palette', colors };
  customPaletteRepo.save(out);
  fire();
  return out;
}
export function deletePalette(id: string) {
  customPaletteRepo.remove(id);
  if (activeStore.get() === id) activeStore.set(BUILTIN_PALETTES[0].id);
  fire();
}
export function paletteName(p: MMPalette, lang: 'de' | 'en') {
  return lang === 'en' && p.nameEn ? p.nameEn : p.name;
}

/** re-renders when palettes change (also in other pickers on the screen) */
export function usePalettes(): { palettes: MMPalette[]; active: MMPalette } {
  const [, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((v) => v + 1);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const palettes = allPalettes();
  const active = palettes.find((p) => p.id === activeStore.get()) ?? palettes[0];
  return { palettes, active };
}

/** the colours used in a map, most used first (a quick start for an own palette) */
export function colorsOfMap(nodes: { color: string; fc?: string; bc?: string; tc?: string }[], edges: { color: string }[]): string[] {
  const count = new Map<string, number>();
  const add = (c?: string) => {
    if (c && /^#[0-9a-fA-F]{6}$/.test(c)) count.set(c.toLowerCase(), (count.get(c.toLowerCase()) ?? 0) + 1);
  };
  nodes.forEach((n) => { add(n.color); add(n.fc); add(n.bc); add(n.tc); });
  edges.forEach((e) => add(e.color));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 16);
}
