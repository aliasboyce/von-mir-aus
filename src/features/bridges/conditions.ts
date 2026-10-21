export interface Condition {
  id: string;
  label: string;
  labelEn: string;
  emoji: string;
}

/**
 * "ChatGPT-Konzept" brief — "Bedingungen": the missing link between
 * Bedürfnis → Brücke → Handlung. Sometimes it isn't the action itself
 * that decides whether it works, but the circumstances around it (the
 * brief's own example: reading works, but only in the morning, with
 * tea, in bed, without time pressure, after a walk). Deliberately a
 * fixed, recognizable vocabulary rather than free text for the common
 * ones — quick to tap, easy to notice a pattern across many bridges —
 * while BridgeFormModal still allows a free-text addition for anything
 * this list doesn't cover.
 */
export const CONDITIONS: Condition[] = [
  { id: 'draussen-gewesen', label: 'vorher draußen gewesen', labelEn: 'been outside first', emoji: '🌿' },
  { id: 'etwas-warmes', label: 'etwas Warmes (Tee, Dusche, Decke)', labelEn: 'something warm (tea, shower, blanket)', emoji: '☕' },
  { id: 'ruhiger-ort', label: 'ruhiger Ort', labelEn: 'a quiet place', emoji: '🕯️' },
  { id: 'kein-zeitdruck', label: 'kein Zeitdruck', labelEn: 'no time pressure', emoji: '⏰' },
  { id: 'nicht-allein', label: 'nicht allein', labelEn: 'not alone', emoji: '🤝' },
  { id: 'allein', label: 'allein sein', labelEn: 'being alone', emoji: '🚪' },
  { id: 'handy-weg', label: 'Handy weg', labelEn: 'phone put away', emoji: '🔕' },
  { id: 'vorher-orientierung', label: 'vorher Orientierung', labelEn: 'orientation first', emoji: '🧠' },
  { id: 'genug-energie', label: 'genug Energie', labelEn: 'enough energy', emoji: '🔋' },
  { id: 'morgens', label: 'eher morgens', labelEn: 'rather in the morning', emoji: '🌅' },
  { id: 'abends', label: 'eher abends', labelEn: 'rather in the evening', emoji: '🌙' },
  { id: 'vorher-bewegung', label: 'vorher etwas Bewegung', labelEn: 'some movement first', emoji: '🏃' },
];

// ---------------------------------------------------------------------
// "Umstände": one global, person-extendable list ("genügend Schlaf gehabt",
// "ruhiger Ort" …). No page of its own — the list is offered wherever
// something is created or edited (Skills, Hilfsmittel, Orte, Aktivitäten,
// Brücken): pick from it or type a new one, which is then saved here and
// always selectable afterwards. Seeded once from CONDITIONS above.
// ---------------------------------------------------------------------
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createId } from '../../services/storage/repository';

export interface UmstandOption {
  key: string;
  label: string;
  emoji: string;
}

const umstaendeStore = createKeyValueStore<UmstandOption[]>('umstaende-list', []);

/** What a bridge/resource stores for an Umstand: the old condition id for the seeded ones, else a generated key. */
export function loadUmstaende(): UmstandOption[] {
  return umstaendeStore.get();
}

/** Adds a typed Umstand (or returns the existing one with the same label). */
export function addUmstand(label: string): UmstandOption {
  const clean = label.trim();
  const all = umstaendeStore.get();
  const hit = all.find((u) => u.label.toLowerCase() === clean.toLowerCase());
  if (hit) return hit;
  const created: UmstandOption = { key: createId('umst'), label: clean, emoji: '🧩' };
  umstaendeStore.set([...all, created]);
  return created;
}

/** Seeds the list from the built-in conditions once; used by the startup migration. */
export function ensureUmstaendeSeeded(extra: UmstandOption[] = []) {
  const all = umstaendeStore.get();
  const have = new Set(all.map((u) => u.key));
  const add: UmstandOption[] = [];
  CONDITIONS.forEach((c) => {
    if (!have.has(c.id)) add.push({ key: c.id, label: c.label, emoji: c.emoji });
  });
  extra.forEach((u) => {
    if (!have.has(u.key) && !add.some((x) => x.key === u.key)) add.push(u);
  });
  if (add.length > 0) umstaendeStore.set([...all, ...add]);
}

/** Label for a stored key — also for old entries whose Umstand is no longer in the list. */
export function umstandLabel(key: string): UmstandOption | undefined {
  const hit = loadUmstaende().find((u) => u.key === key);
  if (hit) return hit;
  const c = CONDITIONS.find((x) => x.id === key);
  return c ? { key, label: c.label, emoji: c.emoji } : undefined;
}
