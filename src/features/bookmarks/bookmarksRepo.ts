import { createRepository, createId } from '../../services/storage/repository';
import { createCustomCategoryStore } from '../../services/customCategories';
import type { Bookmark } from '../../data/types';

export const bookmarksRepo = createRepository<Bookmark>('bookmarks');

/** Bookmark categories are fully data-driven and editable from the start —
 * no fixed-enum-plus-custom split like Bridges/Resources, since this is a
 * fresh feature with no legacy constraint to work around. Seeded once with
 * a few sensible defaults; the person can rename, remove, or add their own
 * freely afterward. */
export const bookmarkCategoriesStore = createCustomCategoryStore('bookmark-categories', [
  'Inspiration',
  'Wissen & Verstehen',
  'Übungen',
  'Hilfsangebote',
  'Sonstiges',
]);

interface DefaultSource {
  title: string;
  url: string;
  note: string;
  category: string;
}

/**
 * A small set of pre-verified sources (checked against each organization's
 * own current page, not written from memory — see docs/open-issues.md for
 * the verification notes). Adds the two categories if they don't already
 * exist, and adds each source only if a bookmark with that exact URL isn't
 * already present — safe to call on every page load, never creates
 * duplicates even for people who already had bookmark data before this
 * feature existed.
 */
const DEFAULT_SOURCES: DefaultSource[] = [
  {
    title: 'Hilfetelefon Gewalt gegen Frauen',
    url: 'https://www.hilfetelefon.de',
    note: 'Kostenlose, anonyme Beratung rund um die Uhr für Frauen, die Gewalt erleben oder erlebt haben, sowie für Angehörige und Fachkräfte. Telefonisch unter 116 016 (auch 08000 116 016).',
    category: 'Anlaufstellen',
  },
  {
    title: 'LARA — Fachstelle gegen sexualisierte Gewalt',
    url: 'https://lara-berlin.de',
    note: 'Beratung für Frauen, trans*, inter* und nicht-binäre Personen ab 14 Jahren in Berlin. Telefon-Hotline Mo–Fr 9–18 Uhr: 030 216 88 88, E-Mail: beratung@lara-berlin.de.',
    category: 'Anlaufstellen',
  },
  {
    title: 'Krisendienste Bayern',
    url: 'https://krisendienste.bayern',
    note: 'Kostenlose Krisenberatung rund um die Uhr für Menschen in psychischen Notlagen in Bayern und deren Angehörige. Telefon: 0800 655 3000.',
    category: 'Anlaufstellen',
  },
  {
    title: 'KVB — Psychotherapeutische Versorgung',
    url: 'https://www.kvb.de/patienten/psychotherapeutische-versorgung',
    note: 'Infos zu Zugangswegen zur ambulanten Psychotherapie in Bayern, inklusive Terminservicestelle.',
    category: 'Anlaufstellen',
  },
  {
    title: '116117 — Termin für Psychotherapie',
    url: 'https://www.116117.de/de/psychotherapie.php',
    note: 'Bundesweite Terminservicestelle: wie man eine psychotherapeutische Sprechstunde oder Behandlung findet und vereinbart.',
    category: 'Anlaufstellen',
  },
  {
    title: 'psychenet — Netz psychische Gesundheit',
    url: 'https://www.psychenet.de',
    note: 'Wissenschaftlich fundierte, verständlich aufbereitete Informationen zu psychischen Erkrankungen und psychischer Gesundheit.',
    category: 'Fachliche Hintergründe',
  },
  {
    title: 'DeGPT — Deutschsprachige Gesellschaft für Psychotraumatologie',
    url: 'https://www.degpt.de',
    note: 'Wissenschaftliche Fachgesellschaft für Traumafolgestörungen — Hintergrundwissen und Forschung zu Psychotraumatologie.',
    category: 'Fachliche Hintergründe',
  },
  {
    title: 'DGKV — Was ist ACT?',
    url: 'https://dgkv.info/act-co/akzeptanz-und-commitment-therapie-act/',
    note: 'Verständliche Einführung in die Akzeptanz- und Commitment-Therapie (ACT), ein wissenschaftlich fundierter Ansatz aus der Verhaltenstherapie.',
    category: 'Fachliche Hintergründe',
  },
  {
    title: 'Dorsch — Lexikon der Psychologie',
    url: 'https://dorsch.hogrefe.com',
    note: 'Das deutschsprachige Standard-Nachschlagewerk der Psychologie mit rund 13.000 Fachbegriffen. Die Basisversion ist kostenlos, einzelne Inhalte sind kostenpflichtig.',
    category: 'Fachliche Hintergründe',
  },
];

export function seedDefaultSources(): void {
  const categories = bookmarkCategoriesStore.getAll();
  const categoryIdByLabel = new Map(categories.map((c) => [c.label, c.id]));

  function ensureCategory(label: string): string {
    const existing = categoryIdByLabel.get(label);
    if (existing) return existing;
    const created = bookmarkCategoriesStore.add(label);
    categoryIdByLabel.set(label, created.id);
    return created.id;
  }

  const existingUrls = new Set(bookmarksRepo.getAll().map((b) => b.url));
  const now = new Date().toISOString();

  DEFAULT_SOURCES.forEach((source) => {
    if (existingUrls.has(source.url)) return;
    bookmarksRepo.save({
      id: createId('bm'),
      url: source.url,
      title: source.title,
      note: source.note,
      categoryId: ensureCategory(source.category),
      createdAt: now,
      updatedAt: now,
    });
  });
}
