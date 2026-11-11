import { createRepository } from '../../services/storage/repository';
import type { NetworkEntry } from '../../data/types';
import { DEMO_NETWORK } from '../../data/seed/network.seed';
import { getUiLanguage } from '../../services/uiLanguage';

const baseRepo = createRepository<NetworkEntry>('network-entries');

/**
 * Die Beispiel-Einträge liegen auf Deutsch gespeichert. In der englischen Ansicht werden unveränderte Beispieltexte
 * englisch ANGEZEIGT; was jemand selbst geändert hat, bleibt genau so; beim Speichern wird nie Englisch über das
 * deutsche Original geschrieben (unveränderte englische Texte werden zurückgetauscht).
 */
const NETWORK_EN: Record<string, { name: string; role: string }> = {
  net_aerztin: { name: 'Specialist doctor', role: 'Specialist medical help' },
  net_psychotherapeutin: { name: 'Psychotherapist', role: 'Therapeutic support' },
  net_hausaerztin: { name: 'GP practice', role: 'First point of contact' },
  net_freundin: { name: 'Trusted person', role: 'For talking and being there' },
  net_katze: { name: 'An animal that does me good', role: 'Closeness & comfort' },
  net_musik: { name: 'Music', role: 'Calming' },
  net_wald: { name: 'The forest', role: 'Being outside' },
  net_meer: { name: 'The sea', role: 'Space & calm' },
  net_lesen: { name: 'Reading something', role: 'Retreat' },
};
const NETWORK_DE = new Map(DEMO_NETWORK.map((e) => [e.id, { name: e.name, role: e.role }]));

function show(e: NetworkEntry): NetworkEntry {
  if (getUiLanguage() !== 'en') return e;
  const de = NETWORK_DE.get(e.id);
  const en = NETWORK_EN[e.id];
  if (!de || !en) return e;
  const name = e.name === de.name ? en.name : e.name;
  const role = e.role === de.role ? en.role : e.role;
  return name === e.name && role === e.role ? e : { ...e, name, role };
}
function store(e: NetworkEntry): NetworkEntry {
  const de = NETWORK_DE.get(e.id);
  const en = NETWORK_EN[e.id];
  if (!de || !en) return e;
  const name = e.name === en.name ? de.name : e.name;
  const role = e.role === en.role ? de.role : e.role;
  return name === e.name && role === e.role ? e : { ...e, name, role };
}

export const networkRepo = {
  ...baseRepo,
  getAll: () => baseRepo.getAll().map(show),
  getById: (id: string) => {
    const e = baseRepo.getById(id);
    return e ? show(e) : undefined;
  },
  save: (e: NetworkEntry) => show(baseRepo.save(store(e))),
  trySave: (e: NetworkEntry) => baseRepo.trySave(store(e)),
  replaceAll: (items: NetworkEntry[]) => baseRepo.replaceAll(items.map(store)),
};

export function seedNetworkIfEmpty() {
  networkRepo.seedIfEmpty(DEMO_NETWORK);
}
