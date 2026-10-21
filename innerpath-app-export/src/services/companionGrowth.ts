import { createKeyValueStore } from './storage/keyValueStore';

/**
 * Animal companions start as babies and grow up with the days the app is actually used.
 * Not a streak and nothing to "keep up": every distinct day on which anything was done in the app counts as one,
 * pauses do not matter and an animal never shrinks. 30 such days = fully grown.
 */
export const GROW_UP_DAYS = 30;

const store = createKeyValueStore<{ days: string[] }>('companion-growth', { days: [] });
const EVENT = 'companion-growth-change';

export const dayKey = (d: Date = new Date()): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

function readDays(): string[] {
  const v = store.get();
  return Array.isArray(v?.days) ? v.days.filter((x) => typeof x === 'string') : [];
}

let lastMarked = '';
/** Marks today as a day the app was used (once per day – cheap to call often). Returns true if it was new. */
export function markActiveToday(): boolean {
  const today = dayKey();
  if (today === lastMarked) return false;
  const days = readDays();
  if (days.includes(today)) {
    lastMarked = today;
    return false;
  }
  // keep the list short: only the last 400 days can ever matter
  store.set({ days: [...days, today].sort().slice(-400) });
  lastMarked = today;
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // no window (tests) – nothing to notify
  }
  return true;
}

/** number of active days since (and including) the day the animal moved in – at least 1 */
export function activeDaysSince(adoptedAt: string | undefined): number {
  const from = adoptedAt ? adoptedAt.slice(0, 10) : '';
  const days = readDays().filter((d) => !from || d >= from);
  return Math.max(1, days.length);
}

/** 0 = newborn (day 1) … 1 = fully grown (day 30) */
export function ageFromDays(days: number): number {
  return Math.max(0, Math.min(1, (days - 1) / (GROW_UP_DAYS - 1)));
}

export function onGrowthChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** a short human label for the current stage */
export function stageLabel(days: number): string {
  if (days >= GROW_UP_DAYS) return 'ausgewachsen';
  if (days >= 20) return 'fast erwachsen';
  if (days >= 10) return 'Jungtier';
  return 'Baby';
}

/** test support: forget the in-memory 'already marked today' shortcut */
export function resetGrowthMemo(): void {
  lastMarked = '';
}
