import { createKeyValueStore } from '../services/storage/keyValueStore';

/**
 * "Bei Hilfsmittel sollen nur noch die Kategorien stehen: Visuell,
 * Auditiv, Olfaktorisch, Gustatorisch, Haptisch, Kognitiv, Motorisch,
 * Komfort & Sicherheit, Strukturell & Organisatorisch — und Musik,
 * Wissen, Videos, Texte, Apps, Buecher jeweils der richtigen Kategorie
 * untergeordnet. Orte ('wo es mir hilft') bleibt, mit den
 * Unterkategorien Natur, Ort, besondere Umgebung, Platz + eigene."
 *
 * Placement of the media types (editorial decision, shown in the app as
 * sub-chips of their category): Videos -> Visuell, Musik -> Auditiv,
 * Wissen / Texte / Buecher / Apps -> Kognitiv (all of them are about
 * taking something in and thinking with it).
 */
export const HILFSMITTEL_MAIN = ['visuell', 'auditiv', 'olfaktorisch', 'gustatorisch', 'haptisch', 'kognitiv', 'motorisch', 'komfort', 'strukturell', 'orte'] as const;

export interface SubType {
  id: string;
  de: string;
  en: string;
}

export const HILFSMITTEL_SUBTYPES: Record<string, SubType[]> = {
  visuell: [{ id: 'videos', de: 'Videos', en: 'Videos' }],
  auditiv: [{ id: 'musik', de: 'Musik', en: 'Music' }],
  kognitiv: [
    { id: 'wissen', de: 'Wissen', en: 'Knowledge' },
    { id: 'texte', de: 'Texte', en: 'Texts' },
    { id: 'buecher', de: 'Bücher', en: 'Books' },
    { id: 'apps', de: 'Apps', en: 'Apps' },
  ],
  orte: [
    { id: 'natur', de: 'Natur', en: 'Nature' },
    { id: 'ort', de: 'Ort', en: 'Place' },
    { id: 'besondere_umgebung', de: 'Besondere Umgebung', en: 'Special surroundings' },
    { id: 'platz', de: 'Platz', en: 'Spot' },
  ],
};

/** Old standalone categories -> where they live now. */
export const LEGACY_HILFSMITTEL_CATEGORY: Record<string, { category: string; sub?: string }> = {
  musik: { category: 'auditiv', sub: 'musik' },
  videos: { category: 'visuell', sub: 'videos' },
  wissen: { category: 'kognitiv', sub: 'wissen' },
  texte: { category: 'kognitiv', sub: 'texte' },
  buecher: { category: 'kognitiv', sub: 'buecher' },
  apps: { category: 'kognitiv', sub: 'apps' },
  natur: { category: 'orte', sub: 'natur' },
  sonstiges: { category: 'komfort' },
};

/** The person's own extra sub-categories for Orte ("+ eigene Kategorien"). */
export const customOrteSubStore = createKeyValueStore<SubType[]>('hilfsmittel-orte-subcategories', []);

export function subtypesFor(category: string): SubType[] {
  const base = HILFSMITTEL_SUBTYPES[category] ?? [];
  return category === 'orte' ? [...base, ...customOrteSubStore.get()] : base;
}

export function subtypeLabel(id: string | undefined, lang: 'de' | 'en'): string | undefined {
  if (!id) return undefined;
  const all = [...Object.values(HILFSMITTEL_SUBTYPES).flat(), ...customOrteSubStore.get()];
  const hit = all.find((s) => s.id === id);
  return hit ? (lang === 'en' ? hit.en : hit.de) : id;
}
