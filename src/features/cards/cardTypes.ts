/**
 * „Mein Sammelalbum“ – Datenmodell.
 * Das Album ist eine eigene, zusätzliche Ansicht: Es liest, was es in der App schon gibt,
 * und verändert dort nichts. Eigene Karten und Einstellungen liegen in eigenen Speichern.
 */
export type CardKind =
  | 'person'
  | 'faehigkeit'
  | 'aktion'
  | 'ausruestung'
  | 'ort'
  | 'training'
  | 'wissen'
  | 'ereignis'
  | 'begleiter'
  | 'notfall'
  | 'reflexion'
  | 'eigen';

export type Rarity = 'normal' | 'foil' | 'holo' | 'glitter';
export type FrameStyle = 'standard' | 'polaroid' | 'scrapbook' | 'sticker';
export type RatingKind = 'star' | 'bolt' | 'heart';

export const KIND_ORDER: CardKind[] = ['person', 'faehigkeit', 'aktion', 'ausruestung', 'ort', 'training', 'wissen', 'ereignis', 'begleiter', 'notfall', 'reflexion', 'eigen'];

export const KIND_META: Record<CardKind, { de: string; en: string; emoji: string; defaultColor: string }> = {
  person: { de: 'Held:in', en: 'Hero', emoji: '🦸', defaultColor: '#5E8A5A' },
  faehigkeit: { de: 'Fähigkeit (Skill)', en: 'Skill (ability)', emoji: '✨', defaultColor: '#D9926E' },
  aktion: { de: 'Aktion', en: 'Action', emoji: '🎯', defaultColor: '#C77D9B' },
  ausruestung: { de: 'Ausrüstung', en: 'Gear', emoji: '🧰', defaultColor: '#E8C27E' },
  ort: { de: 'Ort', en: 'Place', emoji: '🗺️', defaultColor: '#8FB6CE' },
  training: { de: 'Training', en: 'Training', emoji: '🌱', defaultColor: '#7E8FC4' },
  wissen: { de: 'Wissen', en: 'Knowledge', emoji: '📖', defaultColor: '#8E7CB8' },
  ereignis: { de: 'Ereignis', en: 'Event', emoji: '📅', defaultColor: '#D9826A' },
  begleiter: { de: 'Begleiter', en: 'Companion', emoji: '🌟', defaultColor: '#6BB5A8' },
  notfall: { de: 'Notfallkarte', en: 'Emergency card', emoji: '🛟', defaultColor: '#C96B6B' },
  reflexion: { de: 'Tageskarte', en: 'Day card', emoji: '🌙', defaultColor: '#D4A94F' },
  eigen: { de: 'Eigene Karte', en: 'Own card', emoji: '🃏', defaultColor: '#9A948A' },
};

/** Was ein Kartenbild/-text braucht – fertig zum Zeichnen. */
export interface CardModel {
  /** stabil, z. B. „person:abc“ – daran hängen Nummer, Seltenheit, Favorit */
  key: string;
  kind: CardKind;
  categoryId?: string;
  categoryLabel?: string;
  title: string;
  subtitle?: string;
  text?: string;
  lines?: string[];
  sections?: { label: string; text: string }[];
  stats?: { label: string; value: string }[];
  dateText?: string;
  /** data:-, blob:- oder https:-Adresse eines Fotos; sonst wird das Symbol gezeichnet */
  image?: string;
  /** id eines eigenen Fotos im Gerätespeicher (wird zu `image` aufgelöst) */
  mediaId?: string;
  emoji: string;
  color: string;
  number: number;
  rarity: Rarity;
  frame?: FrameStyle;
  font?: string;
  stickers?: string[];
  rating?: { kind: RatingKind; value: number };
  /** zweite Bewertung (z. B. Herzen neben Sternen) */
  rating2?: { kind: RatingKind; value: number };
  /** der aktive Begleiter als Sticker auf der Karte */
  companionSticker?: string;
  /** Begleiter-Karte: dessen Bild ins Kunstfenster */
  portraitOf?: string;
  /** Alle Infos aus der Quelle (Ressource, Person …): auf der Karte, so weit es passt; in der App komplett */
  details?: { label: string; text: string }[];
  /** Reflexionskarte: Hintergrundfarbe der Karte selbst */
  background?: string;
  createdAt: string;
  own?: boolean;
  /** wohin „Zur Quelle“ führt (nur automatische Karten) */
  route?: string;
}

export interface OwnCard {
  id: string;
  createdAt: string;
  kind: CardKind;
  /** eigene Kategorie, wenn kind === 'eigen' */
  categoryId?: string;
  title: string;
  text?: string;
  /** YYYY-MM-DD (z. B. für Ereigniskarten) */
  date?: string;
  emoji: string;
  mediaId?: string;
  color?: string;
  frame: FrameStyle;
  font?: string;
  stickers?: string[];
  rating?: { kind: RatingKind; value: number };
  rating2?: { kind: RatingKind; value: number };
  /** Begleiter-Sticker: id des Lichtwesens */
  companionSticker?: string;
  /** Datumsformat (siehe cardDate.ts) */
  dateFormat?: string;
  rarity: Rarity;
  /** Von jemandem geschenkt: Name */
  fromName?: string;
  externalId?: string;
}

export interface CardCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  createdAt: string;
}

export interface ReflexionCard {
  id: string;
  createdAt: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  usedResources: string[];
  gardenGrew: boolean;
  feelings: string[];
  needs: string[];
  values: string[];
  achieved: string[];
  grateful?: string;
  highlight?: string;
  learned?: string;
  saying?: string;
  energy?: number;
  comfort?: number;
  background: string;
  mediaId?: string;
  dateFormat?: string;
  companionSticker?: string;
  rarity: Rarity;
}

export interface CardPrefs {
  colors: Partial<Record<CardKind, string>>;
  rarity: Record<string, Rarity>;
  favorites: string[];
  hidden: string[];
  sound: boolean;
  /** beim Drucken auch die Rückseiten (zum doppelseitigen Drucken) */
  printBacks?: boolean;
}

export const DEFAULT_PREFS: CardPrefs = { colors: {}, rarity: {}, favorites: [], hidden: [], sound: true };
