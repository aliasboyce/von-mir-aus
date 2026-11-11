import type { NetworkEntry } from '../types';

const now = new Date().toISOString();

/**
 * "Sicherheitsnetz-Beispiele muessen sinn ergeben"-Auftrag — the
 * previous set (a doctor and a friend cross-linked to each other,
 * "Krisen-Chat", "Notfall-Arzt") read as specific, slightly odd
 * scenarios rather than genuine starting points. Replaced with
 * deliberately generic examples that could plausibly apply to almost
 * anyone, purely as inspiration for the shape of an entry — a mix of
 * people, an animal, activities, and places, matching the user's own
 * suggested list exactly. No connections between them (a real
 * person's own network is theirs to draw, not inherited from a demo).
 */
const RAW_DEMO_NETWORK: NetworkEntry[] = [
  {
    id: 'net_aerztin',
    name: 'Fachärzt:in',
    category: 'person',
    role: 'Fachärztliche Hilfe',
    helpsWith: ['krise', 'vorbeugung'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_psychotherapeutin',
    name: 'Psychotherapeut:in',
    category: 'person',
    role: 'Therapeutische Begleitung',
    helpsWith: ['krise', 'vorbeugung'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_hausaerztin',
    name: 'Hausarztpraxis',
    category: 'person',
    role: 'Erste Anlaufstelle',
    helpsWith: ['vorbeugung', 'entscheidung'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_freundin',
    name: 'Vertraute Person',
    category: 'person',
    role: 'Zum Reden und Dasein',
    helpsWith: ['alltag', 'krise'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_katze',
    name: 'Ein Tier, das mir guttut',
    category: 'ressource',
    role: 'Nähe & Trost',
    helpsWith: ['alltag'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_musik',
    name: 'Musik',
    category: 'ressource',
    role: 'Beruhigung',
    helpsWith: ['alltag', 'krise'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_wald',
    name: 'Der Wald',
    category: 'ort',
    role: 'Draußen sein',
    helpsWith: ['alltag', 'vorbeugung'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_meer',
    name: 'Das Meer',
    category: 'ort',
    role: 'Weite & Ruhe',
    helpsWith: ['alltag', 'vorbeugung'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'net_lesen',
    name: 'Etwas lesen',
    category: 'ressource',
    role: 'Rückzug',
    helpsWith: ['alltag'],
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_NETWORK: NetworkEntry[] = RAW_DEMO_NETWORK.map((e) => ({ ...e, isExample: true }));
