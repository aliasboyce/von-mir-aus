import { createKeyValueStore } from '../../services/storage/keyValueStore';
import type { DistractionItem } from './distractionContent';

/**
 * "Verbinden, glätten" regression round, Section 5 — the previous
 * selection was pure Math.random() with no memory at all beyond
 * excluding the single immediately-previous item, so the same riddle
 * could reasonably reappear within a few taps. This tracks which item
 * texts have already been shown, per category, and always prefers
 * not-yet-shown ones; only once a category's pool is (nearly)
 * exhausted does it reset and allow repeats again — a classic
 * "shuffle bag" rather than pure independent randomness.
 */
const store = createKeyValueStore<Record<string, string[]>>('distraction-seen-per-category', {});

export function pickUnseenFirst(pool: DistractionItem[], categoryKey: string, exclude: DistractionItem | null): DistractionItem {
  const filtered = exclude ? pool.filter((i) => i !== exclude) : pool;
  const source = filtered.length > 0 ? filtered : pool;
  if (source.length === 0) return pool[0];

  const seenMap = store.get() ?? {};
  const seenTexts = new Set(seenMap[categoryKey] ?? []);

  let candidates = source.filter((i) => !seenTexts.has(i.text));
  // Pool (nearly) exhausted for this category — reset and start a fresh
  // round rather than leaving the person with just one or two options.
  if (candidates.length === 0) {
    seenTexts.clear();
    candidates = source;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  seenTexts.add(picked.text);
  store.set({ ...seenMap, [categoryKey]: Array.from(seenTexts) });
  return picked;
}

/** Same shuffle-bag principle for custom category items, which are
 * identified by id rather than by DistractionItem's text field. */
export function pickUnseenFirstById<T extends { id: string }>(pool: T[], categoryKey: string, excludeId: string | null): T | null {
  if (pool.length === 0) return null;
  const filtered = excludeId ? pool.filter((i) => i.id !== excludeId) : pool;
  const source = filtered.length > 0 ? filtered : pool;

  const seenMap = store.get() ?? {};
  const seenIds = new Set(seenMap[`custom:${categoryKey}`] ?? []);

  let candidates = source.filter((i) => !seenIds.has(i.id));
  if (candidates.length === 0) {
    seenIds.clear();
    candidates = source;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  seenIds.add(picked.id);
  store.set({ ...seenMap, [`custom:${categoryKey}`]: Array.from(seenIds) });
  return picked;
}
