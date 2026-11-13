import type { Resource } from '../../data/types';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';

/**
 * Feste Farben der fünf Arten – für Wiedererkennung, überall gleich:
 * im Netzwerk, auf den Ressourcen-Seiten und auf den Karten. Sie sind absichtlich NICHT einstellbar.
 * Nur wie sie sich mit dem gewählten App-Design mischen (hell/dunkel/Palette), passt sich automatisch an
 * (siehe KindScope).
 */
export type ResourceKind = 'person' | 'faehigkeiten' | 'hilfsmittel' | 'orte' | 'aktivitaeten';

export const KIND_ORDER_FIXED: ResourceKind[] = ['person', 'faehigkeiten', 'hilfsmittel', 'orte', 'aktivitaeten'];

export const KIND_COLOR: Record<ResourceKind, string> = {
  person: '#8FAF8A', // grün
  faehigkeiten: '#D9926E', // terrakotta / orange
  hilfsmittel: '#E8C27E', // gelb
  orte: '#8FB6CE', // blau
  aktivitaeten: '#C77D9B', // rosé
};

/** Netzwerk-Kategorie-ID → Art */
export const KIND_OF_NETWORK_ID: Record<string, ResourceKind> = {
  person: 'person',
  ressource: 'faehigkeiten',
  hilfsmittel: 'hilfsmittel',
  ort: 'orte',
  aktivitaet: 'aktivitaeten',
};

/** Karten-Art → Art (nur die Kartenarten, die zu einer der fünf gehören) */
export const KIND_OF_CARD: Record<string, ResourceKind> = {
  person: 'person',
  faehigkeit: 'faehigkeiten',
  ausruestung: 'hilfsmittel',
  ort: 'orte',
  aktion: 'aktivitaeten',
};

export function kindOfResource(resource: Pick<Resource, 'category'>): ResourceKind {
  const cat = resource.category as string;
  if (cat === 'menschen') return 'person';
  if (RESOURCE_CATEGORY_TO_GROUP[resource.category] === 'faehigkeiten') return 'faehigkeiten';
  if (cat === 'orte') return 'orte';
  if (cat === 'aktivitaeten') return 'aktivitaeten';
  return 'hilfsmittel';
}

/** Fixed colour for a built-in network category id, else undefined (custom categories stay free). */
export function fixedColorForNetworkId(id: string): string | undefined {
  const k = KIND_OF_NETWORK_ID[id];
  return k ? KIND_COLOR[k] : undefined;
}
