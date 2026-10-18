import { createRepository, createId } from '../../services/storage/repository';
import { gardenRepo } from '../garden/gardenRepo';
import { logActivity } from '../../services/activityLog';
import { deleteOwnMedia, type OwnMediaRef } from '../../services/mediaStore';

/**
 * Routinen: eine feste Reihenfolge kleiner Karten, jede mit genau einem
 * Handlungsschritt. Beim Abspielen sieht man immer nur EINE Karte, die den
 * ganzen Bildschirm füllt. Alles optional außer dem Schritt-Text: Timer,
 * Garten-Verknüpfung, Ressource/Person.
 */
export type EnergyLevel = 1 | 2 | 3;

export interface RoutineCard {
  id: string;
  /** the one action of this step */
  text: string;
  emoji: string;
  color: string;
  /** own photo (data URL) – optional */
  image?: string;
  /** optional time limit; starts automatically when the card appears */
  timerSec?: number;
  /** optional: a garden item ('aufbau') that is ticked automatically when this card is done */
  gardenId?: string;
  /** optional: a song, video or podcast link that belongs to the step (played inside the app when possible) */
  media?: { url: string; autoNext?: boolean };
  /** optional: an own photo, video or audio file shown on the card (kept on this device only, in IndexedDB) */
  ownMedia?: OwnMediaRef;
  /** energy traffic light: from which energy level on this step belongs to the run – 1 = even on a hard day, 2 = from medium, 3 (default) = only with full energy */
  minEnergy?: EnergyLevel;
  /** optional: a resource or a person from the safety net attached to the step */
  linked?: { kind: 'resource' | 'person'; id: string };
}

export interface Routine {
  id: string;
  title: string;
  emoji: string;
  color: string;
  cards: RoutineCard[];
  createdAt: string;
  updatedAt: string;
  /** ready-made example: marked "Beispiel", editable and deletable */
  isExample?: boolean;
  /** which old protection strategy this routine is the new alternative to (optional) */
  alternativeFor?: string;
  /** set when it was created from an everyday template */
  templateKey?: string;
}

export interface RoutineRun {
  id: string;
  routineId: string;
  title: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  /** one entry per card: seconds spent and whether it was done or skipped ("gerade nicht") */
  cards: { cardId: string; text: string; sec: number; done: boolean }[];
  /** which energy version was chosen (only when the routine has more than one) */
  energy?: EnergyLevel;
}

export const routinesRepo = createRepository<Routine>('routines');
export const routineRunsRepo = createRepository<RoutineRun>('routine-runs');

export const ROUTINE_COLORS = ['#e8a83d', '#6fbf73', '#4a8f9e', '#9a7bc4', '#d9778a', '#c9522f', '#8fae3d', '#5b7fb5'];
export const ROUTINE_EMOJIS = ['💧', '🌤️', '🌬️', '🪥', '🍵', '🧘', '🚶', '🛏️', '📵', '🌱', '🧴', '🍎', '📓', '☀️', '🌙', '💊', '🧦', '🎧', '🕯️', '🫖'];

export const ENERGY_COLORS: Record<EnergyLevel, string> = { 1: '#d9774f', 2: '#e8a83d', 3: '#6fbf73' };

/** the steps that belong to a run at a given energy (unmarked steps = only with full energy) */
export const cardsForEnergy = (cards: RoutineCard[], level: EnergyLevel): RoutineCard[] => cards.filter((c) => (c.minEnergy ?? 3) <= level);

/** the energy versions a routine really offers (empty or identical ones are left out); fewer than 2 means: no choice needed */
export function energyOptions(cards: RoutineCard[]): { level: EnergyLevel; count: number }[] {
  const raw = ([1, 2, 3] as EnergyLevel[]).map((level) => ({ level, count: cardsForEnergy(cards, level).length })).filter((o) => o.count > 0);
  return raw.filter((o, i) => !raw[i + 1] || raw[i + 1].count !== o.count);
}

export function newCard(partial?: Partial<RoutineCard>): RoutineCard {
  return { id: createId('rcard'), text: '', emoji: '🌱', color: ROUTINE_COLORS[1], ...partial };
}

export function newRoutine(partial?: Partial<Routine>): Routine {
  const now = new Date().toISOString();
  return { id: createId('routine'), title: '', emoji: '🔁', color: ROUTINE_COLORS[0], cards: [newCard()], createdAt: now, updatedAt: now, ...partial };
}

/** A card was really done: tick the linked garden item for today (once per day, or one more time-stamp for "mehrmals am Tag"). */
export function tickGardenForCard(gardenId: string | undefined): void {
  if (!gardenId) return;
  const e = gardenRepo.getById(gardenId);
  if (!e || e.kind !== 'aufbau' || e.status === 'ended') return;
  const today = new Date().toISOString().slice(0, 10);
  if (e.multipleTimesPerDay) {
    gardenRepo.save({ ...e, checkInTimestamps: [...(e.checkInTimestamps ?? []), new Date().toISOString()] });
  } else if (!(e.checkIns ?? []).includes(today)) {
    gardenRepo.save({ ...e, checkIns: [...(e.checkIns ?? []), today] });
  }
}

export function localDayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function saveRun(routine: Routine, run: Omit<RoutineRun, 'id' | 'routineId' | 'title'>): RoutineRun {
  const full: RoutineRun = { id: createId('rrun'), routineId: routine.id, title: routine.title, ...run };
  routineRunsRepo.save(full);
  const min = Math.max(1, Math.round(run.durationSec / 60));
  logActivity('routine', `${routine.emoji} ${routine.title} · ${min} Min.`, routine.id);
  return full;
}

export function runsFor(routineId: string): RoutineRun[] {
  return routineRunsRepo.getAll().filter((r) => r.routineId === routineId).sort((a, b) => b.endedAt.localeCompare(a.endedAt));
}

export function ranToday(): boolean {
  const today = localDayKey();
  return routineRunsRepo.getAll().some((r) => localDayKey(new Date(r.endedAt)) === today);
}

export function formatDuration(sec: number, lang: 'de' | 'en'): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return lang === 'en' ? `${s} sec` : `${s} Sek.`;
  return s === 0 ? `${m} Min.` : `${m} Min. ${s} ${lang === 'en' ? 's' : 'Sek.'}`;
}

/** Two ready-made examples so the page is not empty on first look (marked "Beispiel", deletable). */
export function exampleRoutines(): Routine[] {
  const now = new Date().toISOString();
  const mk = (id: string, title: string, emoji: string, color: string, cards: Partial<RoutineCard>[]): Routine => ({
    id, title, emoji, color, createdAt: now, updatedAt: now, isExample: true,
    cards: cards.map((c, i) => newCard({ id: `${id}_c${i}`, color, ...c })),
  });
  return [
    mk('routine_ex_morgen', 'Sanft in den Tag', '🌤️', '#e8a83d', [
      { text: 'Ein Glas Wasser trinken', emoji: '💧', color: '#4a8f9e', minEnergy: 1 },
      { text: 'Fenster öffnen oder ans Licht gehen', emoji: '🌤️', color: '#e8a83d', minEnergy: 2 },
      { text: 'Drei ruhige Atemzüge nehmen', emoji: '🌬️', color: '#6fbf73', timerSec: 30, minEnergy: 1 },
    ]),
    mk('routine_ex_abend', 'Sanft in die Nacht', '🌙', '#5b7fb5', [
      { text: 'Handy zur Seite legen', emoji: '📵', color: '#5b7fb5', minEnergy: 1 },
      { text: 'Zähne putzen', emoji: '🪥', color: '#4a8f9e', timerSec: 120, minEnergy: 2 },
      { text: 'Es dir im Bett warm und weich machen', emoji: '🛏️', color: '#9a7bc4', minEnergy: 1 },
    ]),
  ];
}

/** Frees the files of cards that are no longer part of a routine (best effort). */
export function releaseRoutineFiles(cards: RoutineCard[]): void {
  cards.forEach((c) => {
    if (c.ownMedia) void deleteOwnMedia(c.ownMedia.id);
  });
}
