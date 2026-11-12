import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createRepository, createId } from '../../services/storage/repository';
import { networkCategoriesStore } from '../safetyNet/networkCategories';
import { DEFAULT_PREFS, KIND_META, type CardCategory, type CardKind, type CardPrefs, type OwnCard, type Rarity, type ReflexionCard } from './cardTypes';

export const ownCardsRepo = createRepository<OwnCard>('own-cards');
export const cardCategoriesRepo = createRepository<CardCategory>('card-categories');
export const reflexionCardsRepo = createRepository<ReflexionCard>('reflexion-cards');
const prefsStore = createKeyValueStore<CardPrefs>('card-prefs', DEFAULT_PREFS);
const numbersStore = createKeyValueStore<{ next: number; map: Record<string, number> }>('card-numbers', { next: 1, map: {} });

export function getPrefs(): CardPrefs {
  return { ...DEFAULT_PREFS, ...(prefsStore.get() ?? {}) };
}
export function patchPrefs(patch: Partial<CardPrefs>): CardPrefs {
  const next = { ...getPrefs(), ...patch };
  prefsStore.set(next);
  return next;
}

/** Farbe einer Kartenart: eigene Wahl, sonst – wo es sie gibt – die Farbe aus dem Netzwerk, sonst Standard. */
export function colorForKind(kind: CardKind, prefs = getPrefs()): string {
  if (prefs.colors[kind]) return prefs.colors[kind]!;
  try {
    const net = networkCategoriesStore.get();
    const fromNet = (id: string) => net.find((c) => c.id === id)?.color;
    if (kind === 'person') return fromNet('person') ?? KIND_META.person.defaultColor;
    if (kind === 'ausruestung') return fromNet('hilfsmittel') ?? KIND_META.ausruestung.defaultColor;
    if (kind === 'ort') return fromNet('ort') ?? KIND_META.ort.defaultColor;
    if (kind === 'faehigkeit') return fromNet('ressource') ?? KIND_META.faehigkeit.defaultColor;
  } catch {
    // Netzwerk-Farben nicht lesbar – Standard
  }
  return KIND_META[kind].defaultColor;
}

/** Dauerhafte, fortlaufende Nummer: die erste Karte ist 1. Wer zuerst kommt (nach Anlegedatum), bekommt die kleinere Zahl. */
export function assignNumbers(keysWithDates: { key: string; createdAt: string }[]): Record<string, number> {
  const state = numbersStore.get() ?? { next: 1, map: {} };
  const map = { ...state.map };
  let next = state.next;
  let changed = false;
  [...keysWithDates]
    .filter((k) => map[k.key] === undefined)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.key.localeCompare(b.key))
    .forEach((k) => {
      map[k.key] = next++;
      changed = true;
    });
  if (changed) numbersStore.set({ next, map });
  return map;
}

export function setRarity(key: string, rarity: Rarity) {
  const p = getPrefs();
  patchPrefs({ rarity: { ...p.rarity, [key]: rarity } });
}
export function toggleFavorite(key: string): boolean {
  const p = getPrefs();
  const on = !p.favorites.includes(key);
  patchPrefs({ favorites: on ? [...p.favorites, key] : p.favorites.filter((k) => k !== key) });
  return on;
}

export function newOwnCardId() {
  return createId('card');
}

/** Die Nummer, die eine neue Karte bekäme (für die Vorschau). */
export function peekNextNumber(): number {
  return (numbersStore.get() ?? { next: 1 }).next;
}
export function numberFor(key: string): number | undefined {
  return (numbersStore.get() ?? { map: {} as Record<string, number> }).map[key];
}

/** Foto verkleinern und im Gerätespeicher ablegen (bleibt nur auf diesem Gerät). */
export async function savePhotoForCard(file: File): Promise<string | null> {
  const { saveOwnMedia } = await import('../../services/mediaStore');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('image'));
      i.src = url;
    });
    const k = Math.min(1, 1100 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    if (!blob) return null;
    const ref = await saveOwnMedia(blob, file.name || 'Foto');
    return ref?.id ?? null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
