import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createRepository } from '../../services/storage/repository';
import type { ColorPalette, NetworkCategoryConfig } from '../../data/types';
import { KIND_COLOR, fixedColorForNetworkId } from '../resources/kindColors';

export const BUILT_IN_CATEGORY_IDS = ['person', 'ressource', 'hilfsmittel', 'ort', 'aktivitaet'] as const;

/** The default, built-in categories — labels come from i18n at render time,
 * these just carry stable ids/icons/isCustom + starting colors. */
export const DEFAULT_CATEGORIES: NetworkCategoryConfig[] = [
  { id: 'person', label: 'Person', color: KIND_COLOR.person, iconKey: 'user', isCustom: false },
  { id: 'ressource', label: 'Fähigkeit', color: KIND_COLOR.faehigkeiten, iconKey: 'bookHeart', isCustom: false },
  { id: 'hilfsmittel', label: 'Hilfsmittel', color: KIND_COLOR.hilfsmittel, iconKey: 'sparkles', isCustom: false },
  { id: 'ort', label: 'Ort', color: KIND_COLOR.orte, iconKey: 'mapPin', isCustom: false },
  { id: 'aktivitaet', label: 'Aktivität', color: KIND_COLOR.aktivitaeten, iconKey: 'bike', isCustom: false },
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
    ressource: '#D6A788',
    hilfsmittel: '#E8C27E',
  },
};

export const FOREST_PALETTE: ColorPalette = {
  id: 'wald-palette',
  name: 'Wald',
  isCustom: false,
  colors: {
    person: '#5C7A4E',
    ort: '#6C8C8A',
    ressource: '#A97155',
    hilfsmittel: '#C7A24A',
  },
};

export const EVENING_PALETTE: ColorPalette = {
  id: 'abend-palette',
  name: 'Abend',
  isCustom: false,
  colors: {
    person: '#8A7CA8',
    ort: '#7B93B0',
    ressource: '#B87A93',
    hilfsmittel: '#D69A6B',
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
    let list = stored && stored.length > 0 ? stored : DEFAULT_CATEGORIES;
    // „Aktivität“ is a built-in kind of its own again – add it for people whose list was saved earlier
    if (!list.some((c) => c.id === 'aktivitaet')) {
      const at = list.findIndex((c) => c.id === 'ort');
      const act = DEFAULT_CATEGORIES.find((c) => c.id === 'aktivitaet')!;
      list = at >= 0 ? [...list.slice(0, at + 1), act, ...list.slice(at + 1)] : [...list, act];
    }
    // the colours of the built-in kinds are fixed (recognition) – whatever was stored or chosen before
    return list.map((c) => {
      const fixed = c.isCustom ? undefined : fixedColorForNetworkId(c.id);
      return fixed ? { ...c, color: fixed } : c;
    });
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
