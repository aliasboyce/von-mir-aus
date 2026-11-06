import type { EnergyLevel } from './energyLevels';
import type { AccessChannel } from '../data/types';

/**
 * "Was geht gerade?" — the ONE shared model behind filtering skills,
 * Skillketten, Hilfsmittel and Orte by what is actually possible right now.
 *
 * Five criteria. Energie lives where it always lived (Resource.energyLevel),
 * the Zugangskanäle are the ones every entry already carries
 * (Resource.accessChannels: "über welche Kanäle wirkt es"), and the
 * remaining two sit together in one optional `fit` profile:
 *
 *  - minutes  Mindestzeit, die der Eintrag braucht (nicht: wie lange er wirkt)
 *  - effort   wie viel Einsatz/Motivation er kostet (1 kaum … 3 darf richtig kosten)
 *
 * Matching semantics (see matchesFit):
 *  - Energie: "so viel oder weniger" — with more energy than something needs, it
 *    still shows (a warm blanket stays available on a good day). Entries without
 *    an energy marking count as unmarked.
 *  - Zugangskanäle: an entry fits when it works through at least ONE channel
 *    that is available right now (same idea as the channel switching in
 *    Zugang: it is enough that one door is open).
 *  - Zeit, Aufwand: "umsetzbar" — what the entry needs must not exceed what
 *    is available.
 * An entry that has no marking for an active criterion is "unmarked" and is
 * hidden unless the person chooses to include those.
 */
export type EffortLevel = 1 | 2 | 3;

export interface FitProfile {
  minutes?: number;
  effort?: EffortLevel;
}

/** 0 = nicht da, 1 = etwas, 2 = gut vorhanden */
export type ChannelLevel = 0 | 1 | 2;
export type ChannelLevels = Partial<Record<AccessChannel, ChannelLevel>>;

/** Channels that count as available: "etwas" is enough for small steps. */
export function availableChannels(levels: ChannelLevels | null): AccessChannel[] {
  if (!levels) return [];
  return (Object.keys(levels) as AccessChannel[]).filter((c) => (levels[c] ?? 0) >= 1);
}

/** Channels the person marked as "fehlt gerade" (level 0). */
export function missingChannels(levels: ChannelLevels | null): AccessChannel[] {
  if (!levels) return [];
  return (Object.keys(levels) as AccessChannel[]).filter((c) => (levels[c] ?? 0) === 0);
}

/**
 * "Lieber fragen, welcher Zugang gerade FEHLT"-Auftrag: tapping a channel marks
 * it as missing (level 0, greyed); everything not yet answered counts as there
 * (level 2), so the filter keeps computing correctly from what is left.
 * Tapping a missing channel brings it back.
 */
export function toggleMissingChannel(levels: ChannelLevels | null, c: AccessChannel, all: readonly AccessChannel[]): ChannelLevels {
  const next: ChannelLevels = { ...(levels ?? {}) };
  for (const ch of all) if (next[ch] === undefined) next[ch] = 2;
  next[c] = next[c] === 0 ? 2 : 0;
  return next;
}

export const TIME_STEPS = [1, 5, 10, 20, 30, 60] as const;

export const EFFORT_LEVELS: EffortLevel[] = [1, 2, 3];

export function timeLabel(minutes: number, lang: 'de' | 'en' = 'de'): string {
  if (minutes >= 60) return lang === 'en' ? '1 h +' : '1 Std +';
  return lang === 'en' ? `${minutes} min` : `${minutes} Min`;
}

/** The filter as the person sets it. `null` = this criterion is not used. */
export interface FitFilter {
  energy: EnergyLevel | null;
  /** how many minutes are available */
  minutes: number | null;
  /** how present each Zugangskanal is right now; null = channels not used as a filter */
  levels: ChannelLevels | null;
  /** how much effort I am willing to invest */
  effort: EffortLevel | null;
  /** also show entries that have no marking for an active criterion */
  includeUnmarked: boolean;
}

export const EMPTY_FIT_FILTER: FitFilter = { energy: null, minutes: null, levels: null, effort: null, includeUnmarked: false };

export function isFitFilterActive(f: FitFilter): boolean {
  return f.energy !== null || f.minutes !== null || f.levels !== null || f.effort !== null;
}

export function activeCriteriaCount(f: FitFilter): number {
  return [f.energy, f.minutes, f.levels, f.effort].filter((v) => v !== null).length;
}

/** What something asks for, in the shape the matcher needs. Energy is a range because a
 * Skillkette runs several skills. */
export interface FitSubject {
  energy?: [number, number];
  fit?: FitProfile;
  /** the Zugangskanäle it works through; empty/absent = not marked */
  channels?: AccessChannel[];
}

export function subjectOfResource(r: { energyLevel?: EnergyLevel; fit?: FitProfile; accessChannels?: AccessChannel[] }): FitSubject {
  return { energy: r.energyLevel ? [r.energyLevel, r.energyLevel] : undefined, fit: r.fit, channels: r.accessChannels };
}

/** What one Brücke step asks for. Channels fall back to the Brücke's own. */
export function subjectOfBridgeLevel(
  b: { accessChannels?: AccessChannel[] },
  l: { energyLevel?: EnergyLevel; fit?: FitProfile; accessChannels?: AccessChannel[] },
): FitSubject {
  const channels = l.accessChannels && l.accessChannels.length > 0 ? l.accessChannels : b.accessChannels;
  return { energy: l.energyLevel ? [l.energyLevel, l.energyLevel] : undefined, fit: l.fit, channels };
}

/** A Brücke can be started when at least one of its steps fits right now. */
export function subjectsOfBridge(b: { accessChannels?: AccessChannel[]; levels: { energyLevel?: EnergyLevel; fit?: FitProfile; accessChannels?: AccessChannel[] }[] }): FitSubject[] {
  if (b.levels.length === 0) return [{ channels: b.accessChannels }];
  return b.levels.map((l) => subjectOfBridgeLevel(b, l));
}

export function bridgeMatchesFit(b: Parameters<typeof subjectsOfBridge>[0], f: FitFilter): boolean {
  return subjectsOfBridge(b).some((s) => matchesFit(s, f));
}

/** How a step relates to the channels that are there / missing right now. */
export function channelStatus(channels: AccessChannel[] | undefined, levels: ChannelLevels | null): { there: AccessChannel[]; missing: AccessChannel[] } {
  const list = channels ?? [];
  if (!levels) return { there: [], missing: [] };
  const open = availableChannels(levels);
  return { there: list.filter((c) => open.includes(c)), missing: list.filter((c) => !open.includes(c)) };
}

/** true when a step does NOT fit the current filter in a way that was actually answered (not merely unmarked). */
export function stepClashes(s: FitSubject, f: FitFilter): boolean {
  return evaluate(s, f).includes('no');
}

type CriterionResult = 'ok' | 'no' | 'unmarked';

function evaluate(s: FitSubject, f: FitFilter): CriterionResult[] {
  const out: CriterionResult[] = [];
  if (f.energy !== null) {
    // the lowest energy it needs must not exceed what is there (for a Skillkette: it can be started)
    out.push(!s.energy ? 'unmarked' : s.energy[0] <= f.energy ? 'ok' : 'no');
  }
  if (f.minutes !== null) {
    const m = s.fit?.minutes;
    out.push(m === undefined ? 'unmarked' : m <= f.minutes ? 'ok' : 'no');
  }
  if (f.levels !== null) {
    const tags = s.channels ?? [];
    const open = availableChannels(f.levels);
    out.push(tags.length === 0 ? 'unmarked' : tags.some((c) => open.includes(c)) ? 'ok' : 'no');
  }
  if (f.effort !== null) {
    const e = s.fit?.effort;
    out.push(e === undefined ? 'unmarked' : e <= f.effort ? 'ok' : 'no');
  }
  return out;
}

/** true if the subject is possible under the filter. A criterion that is not marked
 * hides the entry unless `includeUnmarked` is on. */
export function matchesFit(s: FitSubject, f: FitFilter): boolean {
  const results = evaluate(s, f);
  if (results.includes('no')) return false;
  if (results.includes('unmarked') && !f.includeUnmarked) return false;
  return true;
}

/** Entries that would match if unmarked ones were included, but are hidden right now. */
export function countHiddenUnmarked(subjects: FitSubject[], f: FitFilter): number {
  if (f.includeUnmarked || !isFitFilterActive(f)) return 0;
  return subjects.filter((s) => {
    const r = evaluate(s, f);
    return !r.includes('no') && r.includes('unmarked');
  }).length;
}

export function filterByFit<T>(items: T[], subjectOf: (item: T) => FitSubject, f: FitFilter): T[] {
  if (!isFitFilterActive(f)) return items;
  return items.filter((i) => matchesFit(subjectOf(i), f));
}

// ---------------------------------------------------------------------------
// Skillketten: the profile is computed from the steps, never typed in twice.
// ---------------------------------------------------------------------------

export interface ChainStepInput {
  energyLevel?: EnergyLevel;
  fit?: FitProfile;
  channels?: AccessChannel[];
  /** a helper (person) was added to this step: Beziehung is then one of its channels */
  hasHelper?: boolean;
}

/** A chain asks for the sum of its steps' time, the highest effort, the union of the
 * channels its steps work through, and its energy range. If any step lacks a value,
 * the chain is "unmarked" for that criterion — an honest "nicht vollständig angegeben"
 * instead of a guess. */
export function chainSubject(steps: ChainStepInput[]): FitSubject {
  if (steps.length === 0) return {};
  const energies = steps.map((s) => s.energyLevel);
  const energy: [number, number] | undefined = energies.every((e) => e !== undefined)
    ? [Math.min(...(energies as number[])), Math.max(...(energies as number[]))]
    : undefined;

  const mins = steps.map((s) => s.fit?.minutes);
  const efforts = steps.map((s) => s.fit?.effort);
  const fit: FitProfile = {};
  if (mins.every((m) => m !== undefined)) fit.minutes = (mins as number[]).reduce((a, b) => a + b, 0);
  if (efforts.every((e) => e !== undefined)) fit.effort = Math.max(...(efforts as number[])) as EffortLevel;

  const tagged = steps.every((s) => (s.channels?.length ?? 0) > 0);
  const channels = tagged ? Array.from(new Set(steps.flatMap((s) => [...(s.channels ?? []), ...(s.hasHelper ? (['beziehung'] as AccessChannel[]) : [])]))) : undefined;
  return { energy, fit, channels };
}
