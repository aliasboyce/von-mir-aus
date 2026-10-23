import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createId } from '../../services/storage/repository';
import type { CompanionCategory, CompanionLine, CompanionTrigger } from './companionRegistry';

export interface CustomCompanionLine extends CompanionLine {
  /** Every custom line the person adds needs an honest source: a real
   * citation for anything drawn from or based on external material, or
   * this exact marker for something they wrote themselves. Never left
   * blank, and never invented. */
  source: string;
  /** Point 6 — a simpler, human-facing time dimension layered on top of
   * the technical trigger system, since raw triggers ('checkin_zu_zugang'
   * etc.) aren't something a non-technical person should have to pick
   * from. 'any' (the default) behaves exactly like before. */
  timeOfDay?: 'morgens' | 'mittags' | 'abends' | 'nachts' | 'any';
  /** How often this line should turn up relative to the built-in lines
   * it's mixed in with — implemented as duplication weight in getLines()
   * rather than a separate probability system, so it composes cleanly
   * with the existing pick-avoiding-repeats logic instead of needing a
   * second selection algorithm. */
  frequency?: 'selten' | 'gelegentlich' | 'haeufig';
}

export const OWN_TEXT_SOURCE = 'Eigener App-Text';

interface ManagementState {
  deactivatedIds: string[];
  customLines: CustomCompanionLine[];
}

const store = createKeyValueStore<ManagementState>('companion-content-management', {
  deactivatedIds: [],
  customLines: [],
});

function read(): ManagementState {
  return store.get() ?? { deactivatedIds: [], customLines: [] };
}

export function getDeactivatedIds(): Set<string> {
  return new Set(read().deactivatedIds);
}

export function isDeactivated(id: string): boolean {
  return read().deactivatedIds.includes(id);
}

/** Toggling a built-in line off is the whole point of Point 10 — this
 * must actually stop the companion from ever picking it again, which is
 * why getLines() in companionRegistry.ts filters against this set
 * directly rather than the management UI just hiding the row visually. */
export function setLineActive(id: string, active: boolean): void {
  const state = read();
  const next = active ? state.deactivatedIds.filter((d) => d !== id) : [...new Set([...state.deactivatedIds, id])];
  store.set({ ...state, deactivatedIds: next });
}

export function getCustomLines(): CustomCompanionLine[] {
  return read().customLines;
}

export function addCustomLine(line: {
  text: string;
  textEn: string;
  category: CompanionCategory;
  page: string;
  trigger: CompanionTrigger;
  source: string;
  timeOfDay?: CustomCompanionLine['timeOfDay'];
  frequency?: CustomCompanionLine['frequency'];
}): void {
  const state = read();
  const newLine: CustomCompanionLine = { id: createId('custom-line'), ...line };
  store.set({ ...state, customLines: [...state.customLines, newLine] });
}

export function updateCustomLine(id: string, updates: Partial<Omit<CustomCompanionLine, 'id'>>): void {
  const state = read();
  store.set({ ...state, customLines: state.customLines.map((l) => (l.id === id ? { ...l, ...updates } : l)) });
}

export function removeCustomLine(id: string): void {
  const state = read();
  store.set({ ...state, customLines: state.customLines.filter((l) => l.id !== id) });
}

/** Plain local-clock buckets — no timezone cleverness needed since this
 * only ever reads the device's own current time. */
export function currentTimeOfDay(): 'morgens' | 'mittags' | 'abends' | 'nachts' {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morgens';
  if (h >= 11 && h < 17) return 'mittags';
  if (h >= 17 && h < 22) return 'abends';
  return 'nachts';
}

const FREQUENCY_WEIGHT: Record<NonNullable<CustomCompanionLine['frequency']>, number> = {
  selten: 1,
  gelegentlich: 2,
  haeufig: 4,
};

/** Expands a custom line into 1-4 copies based on its frequency setting
 * — see the field's own doc comment for why duplication rather than a
 * separate weighted-random system. */
export function expandByFrequency(lines: CustomCompanionLine[]): CustomCompanionLine[] {
  return lines.flatMap((l) => Array(FREQUENCY_WEIGHT[l.frequency ?? 'gelegentlich']).fill(l));
}
