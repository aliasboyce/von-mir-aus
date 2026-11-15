/**
 * Scrapbook: Bücher mit A4-Seiten.
 *
 * Eine Seite ist eine Mindmap-Leinwand (gleiche Fotos, Sticker, Stifte, Formen, Karten aus der App …), nur mit festem
 * A4-Blatt. Die Seiten liegen in einem EIGENEN Speicher ('scrapbook-pages'), damit sie nicht in der Mindmap-Liste,
 * Suche oder Verknüpfungen auftauchen. Ein Buch kennt nur die Reihenfolge seiner Seiten.
 */
import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { mindmapRepo, type MindMap, type MMNode } from '../mindmap/mindmapModel';

/** A4 bei 96 dpi – die Welt-Einheiten der Leinwand */
export const PAGE_W = 794;
export const PAGE_H = 1123;
export const PAGE_BOUNDS = { minX: -PAGE_W / 2, minY: -PAGE_H / 2, maxX: PAGE_W / 2, maxY: PAGE_H / 2 };

export type CoverStyle = 'leinen' | 'leder' | 'kraft' | 'blumen' | 'karo' | 'nacht' | 'marmor';
export interface ScrapBook {
  id: string;
  title: string;
  cover: { style: CoverStyle; color: string; emoji?: string };
  pageIds: string[];
  /** zuletzt angesehene Doppelseite */
  spread?: number;
  /** Papier, das neue Seiten bekommen */
  paper?: string;
  createdAt: string;
  updatedAt: string;
}

export const scrapBooksRepo = createRepository<ScrapBook>('scrapbooks');
export const scrapPagesRepo = createRepository<MindMap>('scrapbook-pages');

/** „Meine Sticker“ (gespeicherte Gruppen von Elementen) und „Meine Layouts“ (ganze Seiten als Vorlage) */
export interface SavedSticker { id: string; name: string; nodes: MMNode[]; w: number; h: number; createdAt: string }
export interface SavedLayout { id: string; name: string; nodes: MMNode[]; bg: MindMap['bg']; createdAt: string }
export const scrapStickersRepo = createRepository<SavedSticker>('scrapbook-stickers');
export const scrapLayoutsRepo = createRepository<SavedLayout>('scrapbook-layouts');

export const COVER_STYLES: { id: CoverStyle; de: string; en: string }[] = [
  { id: 'leinen', de: 'Leinen', en: 'Linen' },
  { id: 'leder', de: 'Leder mit Goldrand', en: 'Leather, gold edge' },
  { id: 'kraft', de: 'Kraftpapier', en: 'Kraft paper' },
  { id: 'blumen', de: 'Blümchen', en: 'Little flowers' },
  { id: 'karo', de: 'Vichy-Karo', en: 'Gingham' },
  { id: 'nacht', de: 'Sternennacht', en: 'Starry night' },
  { id: 'marmor', de: 'Marmor', en: 'Marble' },
];
export const COVER_COLORS = ['#7a8f78', '#a45d4f', '#8a6a4a', '#5f7f98', '#8a5f7d', '#c9a45c', '#4a5a50', '#b98a8a', '#3d4a63', '#d8cfc0'];

/** Papiere für Seiten: ein Fingertipp stellt Farbe, Muster und Vintage-Look ein */
export interface PaperPreset { id: string; de: string; en: string; tone: string; kind: MindMap['bg']['kind']; aged: boolean }
export const PAPERS: PaperPreset[] = [
  { id: 'creme', de: 'Cremepapier', en: 'Cream paper', tone: 'cream', kind: 'plain', aged: true },
  { id: 'liniert', de: 'Liniert', en: 'Lined', tone: 'paper', kind: 'lines', aged: false },
  { id: 'karo', de: 'Kariert', en: 'Squared', tone: 'paper', kind: 'grid', aged: false },
  { id: 'punkte', de: 'Punkte', en: 'Dotted', tone: 'sand', kind: 'dots', aged: true },
  { id: 'pergament', de: 'Pergament', en: 'Parchment', tone: '#efe0bd', kind: 'plain', aged: true },
  { id: 'kraft', de: 'Kraftpapier', en: 'Kraft paper', tone: '#c9a77c', kind: 'plain', aged: true },
  { id: 'blush', de: 'Rosé', en: 'Blush', tone: 'blush', kind: 'dotsL', aged: false },
  { id: 'salbei', de: 'Salbei', en: 'Sage', tone: 'sage', kind: 'plain', aged: true },
  { id: 'himmel', de: 'Himmel', en: 'Sky', tone: 'sky', kind: 'waves', aged: false },
  { id: 'schwarz', de: 'Fotoalbum schwarz', en: 'Black album', tone: '#1d1b19', kind: 'plain', aged: false },
  { id: 'nacht', de: 'Nacht mit Sternen', en: 'Starry night', tone: 'night', kind: 'stars', aged: false },
];
export const paperById = (id: string | undefined) => PAPERS.find((p) => p.id === id) ?? PAPERS[0];

export function bookById(id: string | undefined): ScrapBook | undefined {
  return id ? scrapBooksRepo.getById(id) : undefined;
}
export function pagesOf(book: ScrapBook): (MindMap | undefined)[] {
  return book.pageIds.map((pid) => scrapPagesRepo.getById(pid));
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function newBook(title: string, cover: ScrapBook['cover']): ScrapBook {
  const now = new Date().toISOString();
  const b: ScrapBook = { id: createId('scb'), title, cover, pageIds: [], paper: 'creme', createdAt: now, updatedAt: now };
  scrapBooksRepo.save(b);
  return b;
}

/** neue Seite ans Ende (oder an `at`) – nimmt Papier des Buchs oder eines Layouts */
export function addPage(book: ScrapBook, opts: { at?: number; layout?: SavedLayout; paper?: string; day?: string; nodes?: MMNode[]; title?: string } = {}): MindMap {
  const now = new Date().toISOString();
  const pp = paperById(opts.paper ?? book.paper);
  const page: MindMap = {
    id: createId('scp'),
    title: opts.title ?? '',
    createdAt: now,
    updatedAt: now,
    bg: opts.layout ? { ...opts.layout.bg } : { kind: pp.kind, tone: pp.tone, aged: pp.aged },
    nodes: (opts.layout?.nodes ?? opts.nodes ?? []).map((n) => ({ ...n, id: createId('mmn') })),
    edges: [],
    bookId: book.id,
    day: opts.day ?? dayKey(),
    view: undefined,
  };
  scrapPagesRepo.save(page);
  const ids = [...book.pageIds];
  ids.splice(opts.at ?? ids.length, 0, page.id);
  scrapBooksRepo.save({ ...book, pageIds: ids, updatedAt: now });
  return page;
}

export function removePage(book: ScrapBook, pageId: string) {
  scrapPagesRepo.remove(pageId);
  scrapBooksRepo.save({ ...book, pageIds: book.pageIds.filter((x) => x !== pageId), updatedAt: new Date().toISOString() });
}

export function removeBook(book: ScrapBook) {
  book.pageIds.forEach((pid) => scrapPagesRepo.remove(pid));
  scrapBooksRepo.remove(book.id);
}

/** Doppelseiten: 0 = (Vorsatz | Seite 1), 1 = (Seite 2 | Seite 3) … */
export const spreadCount = (pages: number) => Math.max(1, Math.ceil((pages + 1) / 2));
export const spreadOfPage = (index: number) => Math.floor((index + 1) / 2);
export const spreadPages = (s: number) => ({ left: 2 * s - 1, right: 2 * s }); // Indizes in pageIds (−1 = Vorsatz)

/** welches Foto steht auf einer Seite (erstes Foto-Element) – für die Monatsübersicht */
export function firstPhoto(page: MindMap): string | undefined {
  return page.nodes.find((n) => n.img)?.img;
}

export const lastBookStore = createKeyValueStore<string>('scrapbook-last', '');

// Seiten-Papier benutzt dieselben Mindmap-Hintergründe → für Sicherungs-/Reset-Listen
export const SCRAP_STORAGE_KEYS = ['scrapbooks', 'scrapbook-pages', 'scrapbook-stickers', 'scrapbook-layouts', 'scrapbook-last'];
// (mindmapRepo wird hier nur für Typen gebraucht)
void mindmapRepo;
