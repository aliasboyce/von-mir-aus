import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { routineRunsRepo, localDayKey } from '../routines/routinesRepo';
import { parkNotesRepo, waitItemsRepo } from '../parkbox/parkboxRepo';
import { worriesRepo } from '../letGo/worriesRepo';
import type { UserSettings } from '../../data/types';

export type DayPhase = 'start' | 'end';
export type BuiltInDoor = 'skill' | 'medi' | 'diary' | 'routine' | 'park' | 'letgo' | 'wetter' | 'atmen' | 'zugang' | 'garten' | 'kalender' | 'brief' | 'tageskarte';
/** built-in door, or an own one (`custom:<id>`) */
export type DayOptionId = BuiltInDoor | (string & {});

interface PhaseState {
  /** the full-screen invitation was shown once today (dismissed or opened) – it never comes back the same day */
  shown?: boolean;
  /** first time the hub was opened today; things done after this moment count as "done" */
  openedAt?: string;
  /** ticked by hand */
  manual?: DayOptionId[];
  /** doors that were opened (played) – only then the tick button appears */
  went?: DayOptionId[];
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

export function markWent(phase: DayPhase, id: DayOptionId) {
  const w = new Set(phaseState(phase).went ?? []);
  if (w.has(id)) return;
  w.add(id);
  write(phase, { went: [...w] });
}
export function wentOptions(phase: DayPhase): Set<DayOptionId> {
  return new Set(phaseState(phase).went ?? []);
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

export const ALL_DAY_OPTIONS: BuiltInDoor[] = ['skill', 'medi', 'diary', 'routine', 'park', 'letgo', 'wetter', 'atmen', 'zugang', 'garten', 'kalender', 'brief', 'tageskarte'];

/** The doors beyond the first six (those have their texts in dayFlowTexts). */
export const EXTRA_DOORS: Record<string, { emoji: string; de: [string, string]; en: [string, string]; to: string; phase?: DayPhase }> = {
  wetter: { emoji: '⛅', de: ['Check-in: Wie geht’s gerade?', 'Kurz hinschauen, was da ist'], en: ['Check-in: how are you right now?', 'A quick look at what is there'], to: '/inneres-wetter' },
  atmen: { emoji: '🌬️', de: ['Gemeinsam atmen', 'Eine ruhige Atemübung'], en: ['Breathe together', 'A calm breathing exercise'], to: '/entdecken/ressourcen/skills/atmen' },
  zugang: { emoji: '🔑', de: ['Zugang: Was geht gerade?', 'Passende Vorschläge für jetzt'], en: ['Access: what works right now?', 'Fitting suggestions for now'], to: '/zugang' },
  garten: { emoji: '🌱', de: ['Garten & Routinen', 'Nach dem Garten schauen'], en: ['Garden & routines', 'Look after the garden'], to: '/entdecken/garten' },
  kalender: { emoji: '📅', de: ['Kalender ansehen', 'Was steht heute an?'], en: ['Look at the calendar', 'What is on today?'], to: '/kalender' },
  brief: { emoji: '💌', de: ['Brief an mich', 'Ein paar Zeilen an dich selbst'], en: ['Letter to myself', 'A few lines to yourself'], to: '/entdecken/brief-an-mich' },
  tageskarte: { emoji: '🃏', de: ['Tageskarte machen', 'Dein Tag als Sammelkarte'], en: ['Make a day card', 'Your day as a collection card'], to: '/sammelalbum/tageskarte', phase: 'end' },
};

/** Pages an own door can lead to. */
export const DOOR_TARGETS: { to: string; de: string; en: string }[] = [
  { to: '', de: 'Nirgends hin (nur abhaken)', en: 'Nowhere (just tick off)' },
  { to: '/entdecken/ressourcen', de: 'Ressourcen', en: 'Resources' },
  { to: '/bruecken', de: 'Brücken', en: 'Bridges' },
  { to: '/sicherheit/tagebuch', de: 'Tagebuch', en: 'Diary' },
  { to: '/kalender', de: 'Kalender', en: 'Calendar' },
  { to: '/listen', de: 'Listen', en: 'Lists' },
  { to: '/entdecken/timer', de: 'Timer', en: 'Timer' },
  { to: '/parkbox', de: 'Parkbox', en: 'Parking box' },
  { to: '/entdecken/mindmap', de: 'Mindmap', en: 'Mind map' },
  { to: '/entdecken/wertekompass', de: 'Wertekompass', en: 'Values compass' },
  { to: '/entdecken/beduerfnis-kompass', de: 'Bedürfniskompass', en: 'Needs compass' },
  { to: '/sammelalbum', de: 'Sammelalbum', en: 'Collection album' },
];
/** what each phase offers unless the person changed it in the settings */
export const DEFAULT_DAY_OPTIONS: Record<DayPhase, DayOptionId[]> = {
  start: ['skill', 'medi', 'diary', 'routine'],
  end: ['skill', 'diary', 'park', 'letgo', 'routine'],
};
/** The doors of a phase in the order the person chose (built-in ones and their own). */
export function dayOptionsFor(settings: Pick<UserSettings, 'dayStartOptions' | 'dayEndOptions' | 'dayCustomDoors'>, phase: DayPhase): DayOptionId[] {
  const chosen = phase === 'start' ? settings.dayStartOptions : settings.dayEndOptions;
  if (!chosen) return DEFAULT_DAY_OPTIONS[phase];
  const customIds = new Set((settings.dayCustomDoors ?? []).map((d) => `custom:${d.id}`));
  const seen = new Set<string>();
  return chosen.filter((o) => {
    if (seen.has(o)) return false;
    seen.add(o);
    return (ALL_DAY_OPTIONS as string[]).includes(o) || customIds.has(o);
  });
}
