import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { zugangRepo } from '../zugang/zugangRepo';
import { CONNECTION_ITEMS_DE } from '../zugang/zugangContent';

/**
 * Priority 4/10/11 — the Wertekompass combines two layers:
 *   1. A manually curated set of currently-important values (this
 *      file's manualPriorities* functions) — available immediately,
 *      no Zugang history required at all, satisfying "von Anfang an
 *      zugänglich" and "sammeln, auswählen, filtern, priorisieren".
 *   2. A derived observation from actual Zugang passes
 *      (valueSnapshot/monthlyHistory below) — grows richer over time,
 *      never a forced check-in, nothing stored twice.
 * Both layers read/write the same underlying value vocabulary
 * (CONNECTION_ITEMS_DE / ZugangEntry.connection), never a parallel one.
 */

export interface ValueSnapshotEntry {
  value: string;
  count: number;
  /** 0–1, relative to the most frequent value in this snapshot — used
   * for the visual "how present is this right now" sizing. */
  weight: number;
}

const MIN_ENTRIES_FOR_SNAPSHOT = 3;

/** Builds a frequency snapshot from Zugang passes within the given
 * number of days (default: a rolling recent window), most-present
 * value first. Returns null if there isn't enough data yet — this is
 * the "kein Zwang, keine verfrühte Aussage" guard the brief asked for. */
export function valueSnapshot(withinDays = 90): ValueSnapshotEntry[] | null {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  const entries = zugangRepo.getAll().filter((e) => new Date(e.createdAt).getTime() >= cutoff);
  if (entries.length < MIN_ENTRIES_FOR_SNAPSHOT) return null;

  const counts = new Map<string, number>();
  entries.forEach((e) => e.connection?.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
  if (counts.size === 0) return null;

  const max = Math.max(...counts.values());
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count, weight: count / max }))
    .sort((a, b) => b.count - a.count);
}

/** Total number of saved Zugang passes with at least one recorded
 * value — used to decide whether to show the snapshot at all, and to
 * explain to the person how the snapshot came to be. */
export function totalPassesWithValues(): number {
  return zugangRepo.getAll().filter((e) => e.connection && e.connection.length > 0).length;
}

/** A simple "then vs. now" comparison: the top few values from an
 * earlier window vs. the current one, to answer "haben sich meine
 * Werte verändert?" without needing any separate stored history — both
 * snapshots are freshly computed from the same underlying data. */
export { CONNECTION_ITEMS_DE };

// ---------------------------------------------------------------------
// "Mein Kompass" personal value cards (Weiterarbeit brief, Sections
// 9/10) — a step further than just picking a value: writing down what
// it personally means, how you notice it, what makes it hard right
// now, and one small way to live it today. Deliberately its own small
// repo (not folded into manualPriorities) since a card is richer than
// a single chosen label, and a person may want a card for a value they
// haven't necessarily marked as an active priority.
// ---------------------------------------------------------------------
export interface ValueCard {
  id: string;
  value: string; // one of CONNECTION_ITEMS_DE, or a person's own addition
  personalMeaning?: string;
  noticedThrough?: string;
  obstacles?: string;
  smallPossibilities?: string;
  /** Point 7 of the "Weiterentwicklung" brief — shifts the card away
   * from an implicit ranking toward "how present is this value in my
   * actual daily life right now, and how does that feel" — explicitly
   * NOT a 1-10 rating, a reflective question in the same free-text
   * style as the card's other fields. */
  presenceInLife?: string;
  presenceSatisfaction?: string;
  /** "Gesamtpruefung"-Auftrag, Section 24 — the third of three
   * explicitly distinguished dimensions: Bedeutung (personalMeaning),
   * aktuelle gelebte Präsenz (presenceInLife/presenceSatisfaction),
   * and now gewünschter Raum — how much space someone wants to give
   * this value going forward, distinct from how present it is today. */
  desiredSpace?: string;
  /** "ChatGPT-Konzept" brief — observable, checkable everyday behavior
   * for this value (see valueIndicators.ts), distinct from the free-text
   * "noticedThrough" reflection above it. */
  livedIndicators?: string[];
  createdAt: string;
  updatedAt: string;
}

const valueCardStore = createKeyValueStore<ValueCard[]>('wertekompass-value-cards', []);

export function valueCards(): ValueCard[] {
  return valueCardStore.get() ?? [];
}

export function valueCardFor(value: string): ValueCard | undefined {
  return valueCards().find((c) => c.value === value);
}

export function saveValueCard(value: string, fields: Partial<Omit<ValueCard, 'id' | 'value' | 'createdAt' | 'updatedAt'>>): ValueCard {
  const existing = valueCardFor(value);
  const now = new Date().toISOString();
  const updated: ValueCard = existing
    ? { ...existing, ...fields, updatedAt: now }
    : { id: `valuecard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, value, ...fields, createdAt: now, updatedAt: now };
  const rest = valueCards().filter((c) => c.value !== value);
  valueCardStore.set([...rest, updated]);
  return updated;
}

// ---------------------------------------------------------------------
// Layer 1 — manual priorities, usable from the very first visit
// ---------------------------------------------------------------------
const priorityStore = createKeyValueStore<string[]>('wertekompass-priorities', []);

export function manualPriorities(): string[] {
  return priorityStore.get() ?? [];
}

export function togglePriority(value: string): void {
  const current = manualPriorities();
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  priorityStore.set(next);
}

// ---------------------------------------------------------------------
// Layer 2 — derived history, one snapshot per recent month, so change
// over time is genuinely visible rather than just a single "then vs
// now" pair. Purely computed from zugangRepo on each call — nothing
// extra stored.
// ---------------------------------------------------------------------
export interface MonthlySnapshot {
  monthLabel: string; // e.g. "2026-03"
  topValues: string[]; // up to 3, most frequent first
}

export function monthlyHistory(months = 6): MonthlySnapshot[] {
  const entries = zugangRepo.getAll().filter((e) => e.connection && e.connection.length > 0);

  // Same "group once instead of re-filtering per bucket" fix as
  // DailyReview.tsx — the previous version re-scanned the whole
  // (potentially years-long) entries array once per displayed month.
  // A single pass keyed by "YYYY-MM" turns this into one scan plus a
  // cheap lookup per month, regardless of how much Zugang history exists.
  const byMonthKey = new Map<string, typeof entries>();
  entries.forEach((e) => {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = byMonthKey.get(key);
    if (bucket) bucket.push(e);
    else byMonthKey.set(key, [e]);
  });

  const result: MonthlySnapshot[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = byMonthKey.get(monthLabel) ?? [];
    if (inMonth.length === 0) continue;
    const counts = new Map<string, number>();
    inMonth.forEach((e) => e.connection.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
    const topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([v]) => v);
    result.push({ monthLabel, topValues });
  }
  return result;
}

