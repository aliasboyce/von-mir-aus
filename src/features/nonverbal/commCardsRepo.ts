import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Kommunikationskarten: eine Karte = ein Satz + ein Symbol auf einer Farbfläche, die den
 * ganzen Bildschirm füllt – zum Zeigen, wenn Sprechen gerade nicht geht. So viele wie man mag.
 * Die Karten gehören automatisch zum Sicherheitsplan, zum Notfallrucksack und zum Krisenmodus.
 */
export interface CommCard {
  id: string;
  text: string;
  emoji: string;
  /** Hintergrundfarbe der Karte */
  color: string;
  createdAt: string;
  updatedAt: string;
  /** mitgelieferte Beispielkarte – bearbeitbar und löschbar */
  isExample?: boolean;
}

export const commCardsRepo = createRepository<CommCard>('comm-cards');
const seededStore = createKeyValueStore<boolean>('comm-cards-seeded', false);

export const COMM_COLORS = ['#F4E3A1', '#BFE3D0', '#BCD7EE', '#F2C6C2', '#D9CBEA', '#FFFFFF', '#2B2B2B', '#F5C99B'];

/** readable text colour for a background colour */
export function inkFor(bg: string): string {
  const h = bg.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#1d1d1d' : '#ffffff';
}

const EXAMPLES: { de: string; en: string; emoji: string; color: string }[] = [
  { de: 'Ich brauche bitte etwas zu trinken.', en: 'I would like something to drink, please.', emoji: '💧', color: '#BCD7EE' },
  { de: 'Ich kann gerade nicht sprechen. Bitte hab Geduld.', en: 'I cannot speak right now. Please be patient.', emoji: '🤐', color: '#F4E3A1' },
  { de: 'Bitte lass mich einen Moment in Ruhe.', en: 'Please give me a moment of quiet.', emoji: '🌿', color: '#BFE3D0' },
  { de: 'Mir ist alles zu viel. Bitte leiser und weniger Fragen.', en: 'It is all too much. Quieter and fewer questions, please.', emoji: '🔇', color: '#D9CBEA' },
  { de: 'Ich brauche frische Luft.', en: 'I need some fresh air.', emoji: '🪟', color: '#BFE3D0' },
  { de: 'Bitte bleib einfach bei mir.', en: 'Please just stay with me.', emoji: '🤝', color: '#F5C99B' },
];

/** plants the examples once; after that the person's own list rules */
export function ensureCommCards(lang: 'de' | 'en'): CommCard[] {
  if (!seededStore.get() && commCardsRepo.getAll().length === 0) {
    const now = new Date().toISOString();
    EXAMPLES.forEach((e, i) =>
      commCardsRepo.save({ id: createId('cc'), text: lang === 'en' ? e.en : e.de, emoji: e.emoji, color: e.color, createdAt: new Date(Date.now() + i).toISOString(), updatedAt: now, isExample: true }),
    );
  }
  seededStore.set(true);
  return commCardsRepo.getAll();
}

export function newCommCard(): CommCard {
  const now = new Date().toISOString();
  return { id: createId('cc'), text: '', emoji: '💬', color: COMM_COLORS[0], createdAt: now, updatedAt: now };
}
