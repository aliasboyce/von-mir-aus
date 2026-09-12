import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createRepository } from '../../services/storage/repository';
import type { ColorPalette, NetworkCategoryConfig } from '../../data/types';

export const BUILT_IN_CATEGORY_IDS = ['person', 'ort', 'aktivitaet', 'ressource'] as const;

/** The default, built-in categories — labels come from i18n at render time,
 * these just carry stable ids/icons/isCustom + starting colors. */
export const DEFAULT_CATEGORIES: NetworkCategoryConfig[] = [
  { id: 'person', label: 'Person', color: '#8FAF8A', iconKey: 'user', isCustom: false },
  { id: 'ort', label: 'Ort', color: '#8FB6CE', iconKey: 'mapPin', isCustom: false },
  { id: 'aktivitaet', label: 'Aktivität', color: '#E8C27E', iconKey: 'sparkles', isCustom: false },
  { id: 'ressource', label: 'Ressource', color: '#D6A788', iconKey: 'bookHeart', isCustom: false },
];

/** A soft pastel palette, proposed as the default — gentle enough not to
 * feel clinical or alarming, distinct enough to tell categories apart. */
export const PASTEL_PALETTE: ColorPalette = {
  id: 'pastell',
  name: 'Pastell (Vorschlag)',
  isCustom: false,
  colors: {
    person: '#8FAF8A',
    ort: '#8FB6CE',
    aktivitaet: '#E8C27E',
    ressource: '#D6A788',
  },
};

export const FOREST_PALETTE: ColorPalette = {
  id: 'wald-palette',
  name: 'Wald',
  isCustom: false,
  colors: {
    person: '#5C7A4E',
    ort: '#6C8C8A',
    aktivitaet: '#C7A24A',
    ressource: '#A97155',
  },
};

export const EVENING_PALETTE: ColorPalette = {
  id: 'abend-palette',
  name: 'Abend',
  isCustom: false,
  colors: {
    person: '#8A7CA8',
    ort: '#7B93B0',
    aktivitaet: '#D69A6B',
    ressource: '#B87A93',
  },
};

export const BUILT_IN_PALETTES: ColorPalette[] = [PASTEL_PALETTE, FOREST_PALETTE, EVENING_PALETTE];

const categoriesStore = createKeyValueStore<NetworkCategoryConfig[]>(
  'network-categories',
  DEFAULT_CATEGORIES,
);

const activePaletteStore = createKeyValueStore<string>('network-active-palette', PASTEL_PALETTE.id);

export interface CenterNodeConfig {
  label: string;
  color: string;
  iconKey?: string;
  photoDataUrl?: string;
  photoScale?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
}

export const DEFAULT_CENTER_NODE: CenterNodeConfig = {
  label: 'ICH',
  color: '#33502E',
};

export const centerNodeStore = createKeyValueStore<CenterNodeConfig>('network-center-node', DEFAULT_CENTER_NODE);


export const customPalettesRepo = createRepository<ColorPalette>('network-custom-palettes');

export const networkCategoriesStore = {
  get(): NetworkCategoryConfig[] {
    const stored = categoriesStore.get();
    return stored && stored.length > 0 ? stored : DEFAULT_CATEGORIES;
  },
  set(categories: NetworkCategoryConfig[]): void {
    categoriesStore.set(categories);
  },
};

export const networkPaletteStore = {
  getAllPalettes(): ColorPalette[] {
    return [...BUILT_IN_PALETTES, ...customPalettesRepo.getAll()];
  },
  getActivePaletteId(): string {
    return activePaletteStore.get();
  },
  setActivePaletteId(id: string): void {
    activePaletteStore.set(id);
  },
  /** Applies a palette's colors onto the current category list (matched by id). */
  applyPalette(palette: ColorPalette, categories: NetworkCategoryConfig[]): NetworkCategoryConfig[] {
    return categories.map((c) => (palette.colors[c.id] ? { ...c, color: palette.colors[c.id] } : c));
  },
};
