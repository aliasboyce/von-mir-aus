import type { GardenEntry } from '../../data/types';

/** How many days a "veraenderung" entry has been running, live-computed. */
export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** The set of distinct calendar days an 'aufbau' entry has any check-in
 * on, from either storage form (plain date strings, or full timestamps
 * for entries tracking multiple times per day) — this is the one place
 * that translates "however many times you tapped today" into "did
 * today count, yes or no", which is what growth is actually based on.
 * Never the raw array length: an entry checked in 3 times in one day
 * must count as ONE day here, not three. */
export function distinctCheckInDays(entry: GardenEntry): Set<string> {
  const days = new Set<string>();
  (entry.checkIns ?? []).forEach((d) => days.add(d.slice(0, 10)));
  (entry.checkInTimestamps ?? []).forEach((ts) => days.add(ts.slice(0, 10)));
  return days;
}

/** A single progress number for any entry, regardless of kind — lets
 * both tracking styles drive the same growth-stage visuals. For
 * 'aufbau' entries this is always a count of distinct DAYS with at
 * least one check-in, deliberately never a raw check-in count — see
 * distinctCheckInDays. This is also what "Tage zählen" / "Stunden
 * zählen" / "Sonnenaufgänge zählen" all share underneath: the display
 * label changes (see gardenCounterLabel.ts), growth itself never does. */
export function progressFor(entry: GardenEntry): number {
  if (entry.kind === 'veraenderung') return entry.startedAt ? daysSince(entry.startedAt) : 0;
  return distinctCheckInDays(entry).size;
}

/**
 * Extended well beyond the original 6 stages so a plant tracked for
 * months — or over a year — keeps having somewhere to go instead of
 * hitting an artificial "finished" ceiling. Growth naturally slows
 * (each stage spans a wider range than the last) but never actually
 * stops: even 300+ days of engagement still moves the plant forward.
 * See gardenLushness.ts for how the garden as a whole also grows
 * richer (not just one plant taller) at very high combined engagement
 * across all entries.
 */
export function stageForProgress(progress: number): number {
  if (progress <= 0) return 0;
  if (progress < 3) return 1;
  if (progress < 7) return 2;
  if (progress < 14) return 3;
  if (progress < 30) return 4;
  if (progress < 60) return 5;
  if (progress < 120) return 6;
  if (progress < 200) return 7;
  if (progress < 300) return 8;
  if (progress < 450) return 9;
  return 10;
}

export const MILESTONE_PROGRESS = [1, 3, 7, 14, 30, 60, 90, 120, 180, 250, 350, 450];
