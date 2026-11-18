import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Status-Weitergabe: vorformulierte Nachrichten ("Status"), die man mit einem Tipp an Vertraute schicken kann –
 * zum Beispiel wenn Sprechen oder Schreiben nicht mehr geht. Nichts wird automatisch gesendet: Die App bereitet vor,
 * die Person tippt auf Senden (Teilen-Menü, WhatsApp oder SMS).
 */
export interface StatusCard {
  id: string;
  /** kurzer Name der Karte, z. B. „Erschöpft, kann nicht sprechen“ */
  title: string;
  emoji: string;
  color: string;
  /** der Nachrichtentext */
  message: string;
  isExample?: boolean;
  createdAt: string;
}

export const statusRepo = createRepository<StatusCard>('status-cards');
const seededStore = createKeyValueStore<boolean>('status-cards-seeded', false);
/** feste Empfänger: Ids aus dem Sicheren Netz (Personen) */
export const statusRecipientsStore = createKeyValueStore<string[]>('status-recipients', []);

const EXAMPLES: { titleDe: string; titleEn: string; emoji: string; color: string; de: string; en: string }[] = [
  {
    titleDe: 'Erschöpft, kann nicht sprechen', titleEn: 'Exhausted, cannot speak', emoji: '🪫', color: '#F4E3A1',
    de: 'Aktuell besteht starke Erschöpfung und eine Sprachblockade. Bitte ohne Fragen und ohne Erwartungen an mich. Ich melde mich, wenn es wieder geht.',
    en: 'I am very exhausted right now and cannot speak. Please no questions and no expectations. I will get in touch when I can.',
  },
  {
    titleDe: 'Überflutet – Ruhe bitte', titleEn: 'Overwhelmed – quiet please', emoji: '🌊', color: '#D9CBEA',
    de: 'Mir ist gerade alles zu viel (Reizüberflutung). Bitte schreib mir nur kurz, dass du da bist – ohne dass ich antworten muss.',
    en: 'It is all too much right now (overload). Please just write that you are there – I do not need to answer.',
  },
  {
    titleDe: 'Ich bin weit weg (Dissoziation)', titleEn: 'I am far away (dissociating)', emoji: '🫥', color: '#BCD7EE',
    de: 'Ich bin gerade dissoziiert und schwer erreichbar. Bitte keine Diskussion. Ein ruhiger, kurzer Satz hilft mir: „Du bist sicher, ich bin da.“',
    en: 'I am dissociating and hard to reach. No discussion please. One calm, short sentence helps: “You are safe, I am here.”',
  },
  {
    titleDe: 'Es geht mir schlecht – bitte melde dich', titleEn: 'I am doing badly – please check in', emoji: '🧡', color: '#F5C99B',
    de: 'Es geht mir gerade nicht gut. Kannst du dich bitte bei mir melden oder vorbeikommen? Ich kann gerade nicht viel erklären.',
    en: 'I am not doing well. Could you please get in touch or come by? I cannot explain much right now.',
  },
  {
    titleDe: 'Alles okay, nur ruhig', titleEn: 'All okay, just quiet', emoji: '🌿', color: '#BFE3D0',
    de: 'Mir geht es okay, ich brauche nur gerade Ruhe. Du musst nichts tun.',
    en: 'I am okay, I just need quiet right now. You do not need to do anything.',
  },
];

export function ensureStatusCards(lang: 'de' | 'en'): StatusCard[] {
  if (!seededStore.get() && statusRepo.getAll().length === 0) {
    EXAMPLES.forEach((e, i) =>
      statusRepo.save({ id: createId('st'), title: lang === 'en' ? e.titleEn : e.titleDe, emoji: e.emoji, color: e.color, message: lang === 'en' ? e.en : e.de, isExample: true, createdAt: new Date(Date.now() + i).toISOString() }),
    );
  }
  seededStore.set(true);
  return statusRepo.getAll();
}

export function newStatusCard(): StatusCard {
  return { id: createId('st'), title: '', emoji: '💬', color: '#F4E3A1', message: '', createdAt: new Date().toISOString() };
}

/** digits only, for wa.me */
export function phoneDigits(phone: string): string {
  let p = phone.trim().replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  else if (p.startsWith('00')) p = p.slice(2);
  else if (p.startsWith('0')) p = '49' + p.slice(1);
  return p;
}
