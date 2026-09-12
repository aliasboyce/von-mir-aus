import { zugangRepo } from './zugangRepo';
import { SURVIVAL_STATE_META } from './zugangContent';
import type { ZugangEntry, ZugangSurvivalState } from '../../data/types';

const MIN_OCCURRENCES = 2;

export interface StateActionPattern {
  survivalState: ZugangSurvivalState;
  action: string;
  total: number;
  smoothCount: number; // completed without noted harderFactors
  harderCount: number; // completed with noted harderFactors
}

/**
 * "ChatGPT-Konzept" brief — "Nicht geschafft muss zu einer wertvollen
 * Datenquelle werden" + "Zustand × Handlung lernen". Groups actual
 * past actions by (survival state, action text) and reports how often
 * each combination went smoothly vs. was noted as harder — the same
 * underlying data (harderFactors from the "Was hat den Zugang gerade
 * erschwert?" step) already collected, just aggregated across passes
 * instead of looked at once each. Deliberately requires at least two
 * occurrences before saying anything — one data point is an anecdote,
 * not a pattern — and everything downstream must stay phrased as
 * observation, never as a rule ("Lesen hilft dir nie").
 */
export function stateActionPatterns(): StateActionPattern[] {
  const entries = zugangRepo.getAll().filter((e) => e.survivalState && e.action?.trim());
  const map = new Map<string, StateActionPattern>();

  for (const e of entries) {
    const state = e.survivalState!;
    const actionKey = e.action.trim().toLowerCase();
    const key = `${state}::${actionKey}`;
    const existing = map.get(key);
    const hadHarder = !!(e.harderFactors && e.harderFactors.length > 0);
    if (existing) {
      existing.total += 1;
      if (hadHarder) existing.harderCount += 1;
      else existing.smoothCount += 1;
    } else {
      map.set(key, {
        survivalState: state,
        action: e.action.trim(),
        total: 1,
        smoothCount: hadHarder ? 0 : 1,
        harderCount: hadHarder ? 1 : 0,
      });
    }
  }

  return Array.from(map.values())
    .filter((p) => p.total >= MIN_OCCURRENCES)
    .sort((a, b) => b.total - a.total);
}

/**
 * "Wiedererkennen" — finds a past pass with the same survival state and
 * at least one overlapping feeling, so the current moment can be
 * gently connected to what helped before. Only returns a match with a
 * genuine, usable outcome (an action was actually taken) — recognizing
 * a state without anything to offer from it isn't useful here.
 */
export function findSimilarPastEntry(
  survivalState: ZugangSurvivalState | null,
  feelings: string[],
): ZugangEntry | null {
  if (!survivalState) return null;
  const candidates = zugangRepo
    .getAll()
    .filter((e) => e.survivalState === survivalState && e.action?.trim())
    .filter((e) => feelings.length === 0 || e.feelings.some((f) => feelings.includes(f)))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return candidates[0] ?? null;
}

export function stateLabel(state: ZugangSurvivalState, isEn: boolean): string {
  const meta = SURVIVAL_STATE_META[state];
  return isEn ? meta.labelEn : meta.label;
}
