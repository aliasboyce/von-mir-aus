import { createKeyValueStore } from '../../services/storage/keyValueStore';

/** Das Cover des Sammelalbums: Farbe, Stil und Titel – frei einstellbar, jederzeit zurücksetzbar. */
export type CoverStyle = 'klassisch' | 'schlicht' | 'minimal';
export interface AlbumCover {
  color: string;
  style: CoverStyle;
  /** eigener Titel für „Alle“; leer = „Meine Sammlung“ */
  title: string;
  /** Symbol auf dem Cover zeigen */
  showSymbol: boolean;
}

export const DEFAULT_COVER: AlbumCover = { color: '#6b3a35', style: 'klassisch', title: '', showSymbol: true };
export const COVER_COLORS = ['#6b3a35', '#2f4a6b', '#2f5d4a', '#4a3a6b', '#8a5a2e', '#3b3b3b', '#a65a6e', '#5b8a9a', '#d8c9a8', '#f2efe9'];
export const COVER_STYLES: { id: CoverStyle; de: string; en: string; hintDe: string; hintEn: string }[] = [
  { id: 'klassisch', de: 'Klassisch', en: 'Classic', hintDe: 'Leder, Goldrahmen', hintEn: 'Leather, gold frame' },
  { id: 'schlicht', de: 'Schlicht', en: 'Simple', hintDe: 'Einfarbig, dünner Rahmen', hintEn: 'Plain, thin frame' },
  { id: 'minimal', de: 'Minimal', en: 'Minimal', hintDe: 'Nur Farbe und Titel', hintEn: 'Just colour and title' },
];

const store = createKeyValueStore<Partial<AlbumCover>>('album-cover', {});

export function getAlbumCover(): AlbumCover {
  const v = store.get();
  return { ...DEFAULT_COVER, ...(v && typeof v === 'object' ? v : {}) };
}
export function patchAlbumCover(patch: Partial<AlbumCover>): AlbumCover {
  const next = { ...getAlbumCover(), ...patch };
  store.set(next);
  return next;
}
export function resetAlbumCover(): AlbumCover {
  store.set({});
  return { ...DEFAULT_COVER };
}

/** Lesbare Textfarbe auf einer Hintergrundfarbe */
export function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#2a2623' : '#fbf8f2';
}
