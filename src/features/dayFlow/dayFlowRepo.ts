import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { routineRunsRepo, localDayKey } from '../routines/routinesRepo';
import { parkNotesRepo, waitItemsRepo } from '../parkbox/parkboxRepo';
import { worriesRepo } from '../letGo/worriesRepo';
import type { UserSettings } from '../../data/types';

export type DayPhase = 'start' | 'end';
export type DayOptionId = 'skill' | 'medi' | 'diary' | 'routine' | 'park' | 'letgo';

interface PhaseState {
  /** the full-screen invitation was shown once today (dismissed or opened) – it never comes back the same day */
  shown?: boolean;
  /** first time the hub was opened today; things done after this moment count as "done" */
  openedAt?: string;
  /** ticked by hand */
  manual?: DayOptionId[];
}
type Store = Record<string, Partial<Record<DayPhase, PhaseState>>>;

const store = createKeyValueStore<Store>('day-flow', {});

function read(): Store {
  return store.get() ?? {};
}
export function phaseState(phase: DayPhase, day = localDayKey()): PhaseState {
  return read()[day]?.[phase] ?? {};
}
function write(phase: DayPhase, patch: Partial<PhaseState>, day = localDayKey()) {
  const all = read();
  const keep = Object.keys(all).sort().slice(-13); // only the last two weeks are kept
  const next: Store = {};
  keep.forEach((k) => (next[k] = all[k]));
  next[day] = { ...next[day], [phase]: { ...next[day]?.[phase], ...patch } };
  store.set(next);
}
export function markShown(phase: DayPhase) {
  write(phase, { shown: true });
}
export function markOpened(phase: DayPhase) {
  const s = phaseState(phase);
  write(phase, { shown: true, openedAt: s.openedAt ?? new Date().toISOString() });
}
export function toggleManual(phase: DayPhase, id: DayOptionId) {
  const m = new Set(phaseState(phase).manual ?? []);
  if (m.has(id)) m.delete(id);
  else m.add(id);
  write(phase, { manual: [...m] });
}

function minutesOf(hhmm: string | undefined, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback;
}

/**
 * Which invitation is due right now? Start: from the chosen time until the end time.
 * End: from the chosen time on. Each one comes only once a day, on the first opening in its window.
 */
export function dueGate(settings: Pick<UserSettings, 'dayStartEnabled' | 'dayStartTime' | 'dayEndEnabled' | 'dayEndTime'>, now = new Date()): DayPhase | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  const startAt = minutesOf(settings.dayStartTime, 5 * 60);
  const endAt = minutesOf(settings.dayEndTime, 19 * 60);
  const startOn = settings.dayStartEnabled !== false;
  const endOn = settings.dayEndEnabled !== false;
  if (endOn && mins >= endAt) return phaseState('end').shown ? null : 'end';
  if (startOn && mins >= startAt && mins < Math.max(endAt, startAt + 1)) return phaseState('start').shown ? null : 'start';
  return null;
}

/** Done = something was really saved since the hub was opened (or ticked by hand). */
export function doneOptions(phase: DayPhase): Set<DayOptionId> {
  const s = phaseState(phase);
  const done = new Set<DayOptionId>(s.manual ?? []);
  const since = s.openedAt;
  if (!since) return done;
  if (skillUsesRepo.getAll().some((x) => x.endedAt >= since)) done.add('skill');
  if (mediLogRepo.getAll().some((x) => x.createdAt >= since)) done.add('medi');
  if (diaryRepo.getAll().some((x) => x.createdAt >= since)) done.add('diary');
  if (routineRunsRepo.getAll().some((x) => x.endedAt >= since)) done.add('routine');
  if (parkNotesRepo.getAll().some((x) => x.createdAt >= since) || waitItemsRepo.getAll().some((x) => x.createdAt >= since)) done.add('park');
  if (worriesRepo.getAll().some((x) => x.createdAt >= since)) done.add('letgo');
  return done;
}
