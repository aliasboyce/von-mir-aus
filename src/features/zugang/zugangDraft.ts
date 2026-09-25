import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { zugangRepo } from './zugangRepo';
import { createId } from '../../services/storage/repository';
import type { ZugangSurvivalState } from '../../data/types';

/**
 * Priority 8 of the "Verbinden, Glätten" brief — a running Zugang pass
 * must survive opening a connected page (Nervensystem, Körper,
 * Schutzstrategien, Brücken, Wertekompass, Glaubenssätze...) and coming
 * back. Rather than restructure ZugangPage's ~15 individual useState
 * fields into some new state-management system, this is a thin,
 * additive persistence layer: ZugangPage saves its current draft here
 * on every change and restores from it on mount — the existing
 * useState logic itself is completely unchanged.
 */
export interface ZugangDraft {
  step: number;
  ichJetzt: string;
  body: string[];
  survivalState: ZugangSurvivalState | null;
  tensionValue: number;
  feelings: string[];
  protectionStrategy: string[];
  careWish: string[];
  selfSufficient: 'ja' | 'nein' | null;
  need: string[];
  obstacle: string[];
  bridgeId: string | null;
  connection: string[];
  action: string;
  reflection: string;
  /** "Materialien"-Auftrag, Section 40 — lets ZugangPage tell apart
   * "I just stepped out to a connected page a moment ago" (silently
   * resume, no interruption) from "this draft is from a while back"
   * (still ask, since silently dropping someone back into a days-old
   * half-finished pass without warning would be confusing, not
   * helpful). */
  updatedAt: string;
}

/** Drafts touched this recently are resumed without asking — this is
 * specifically the "navigated to a connected page and pressed back"
 * case, not a general auto-resume. */
export const RECENT_DRAFT_THRESHOLD_MS = 15 * 60 * 1000;

const store = createKeyValueStore<ZugangDraft | null>('zugang-draft', null);

export function saveZugangDraft(draft: Omit<ZugangDraft, 'updatedAt'>): void {
  store.set({ ...draft, updatedAt: new Date().toISOString() });
}

export function loadZugangDraft(): ZugangDraft | null {
  return store.get() ?? null;
}

export function isDraftRecent(draft: ZugangDraft): boolean {
  const ts = Date.parse(draft.updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < RECENT_DRAFT_THRESHOLD_MS;
}

export function clearZugangDraft(): void {
  store.set(null);
}

/**
 * "Brücke: Beenden/Fortführen/Verwerfen" brief — a standalone way to
 * finalize the current draft as a completed ZugangEntry from OUTSIDE
 * ZugangPage itself (specifically: from BridgeDetailPage, once someone
 * who arrived there from a running Zugang pass decides they're done).
 * Mirrors ZugangPage's own saveEntry() field-for-field so the two
 * stay in sync, but doesn't require ZugangPage to be mounted at all.
 */
export function finalizeZugangDraft(
  endedVia: 'complete' | 'bridge' | 'safetynet' | 'abandoned',
  bridgeExtras?: { bridgeLevels?: number[]; bridgeTimerUsed?: boolean }
): boolean {
  const draft = loadZugangDraft();
  if (!draft) return false;
  zugangRepo.save({
    id: createId('zugang'),
    createdAt: new Date().toISOString(),
    ichJetzt: draft.ichJetzt.trim() || undefined,
    body: draft.body,
    survivalState: draft.survivalState ?? undefined,
    tensionValue: draft.tensionValue,
    feelings: draft.feelings,
    protectionStrategy: draft.protectionStrategy,
    careWish: draft.careWish,
    selfSufficient: draft.selfSufficient ?? undefined,
    need: draft.need,
    obstacle: draft.obstacle,
    bridgeId: draft.bridgeId ?? undefined,
    bridgeLevels: bridgeExtras?.bridgeLevels && bridgeExtras.bridgeLevels.length > 0 ? bridgeExtras.bridgeLevels : undefined,
    bridgeTimerUsed: bridgeExtras?.bridgeTimerUsed || undefined,
    connection: draft.connection,
    action: draft.action,
    reflection: draft.reflection.trim() || undefined,
    endedVia,
    stoppedAtStep: endedVia === 'abandoned' ? draft.step : undefined,
  });
  clearZugangDraft();
  return true;
}
