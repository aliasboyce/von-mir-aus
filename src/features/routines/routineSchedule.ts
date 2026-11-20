import { createRepository } from '../../services/storage/repository';
import { routinesRepo } from './routinesRepo';

/**
 * Wiederkehrende Routinen im Kalender: Eine Routine bekommt einen Rhythmus (jeden Tag, jeden 2. Tag, bestimmte
 * Wochentage …) und eine Uhrzeit. Die einzelnen Tage werden NICHT als lauter Termine angelegt, sondern ergeben sich
 * aus der Regel – so bleibt der Kalender leer, wenn man pausiert oder löscht, und nichts staut sich an.
 */
export type SchedulePattern =
  | { kind: 'daily' }
  | { kind: 'everyN'; n: number }
  /** 0 = Montag … 6 = Sonntag */
  | { kind: 'weekdays'; days: number[] };

export interface RoutineSchedule {
  id: string;
  routineId: string;
  /** 'HH:MM' */
  time: string;
  pattern: SchedulePattern;
  /** erster Tag der Regel, 'YYYY-MM-DD' – bei „jeden n-ten Tag“ der Zähler-Anfang */
  startDate: string;
  /** auf der Startseite zur Uhrzeit sanft erinnern */
  remindHome: boolean;
  paused?: boolean;
  /** Tage, an denen die Routine gestartet oder für heute weggelegt wurde (damit die Erinnerung nicht wiederkommt) */
  handled: string[];
  createdAt: string;
}

export const routineSchedulesRepo = createRepository<RoutineSchedule>('routine-schedules');

export const WEEKDAY_SHORT = { de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
/** „n× pro Woche“ als Vorschlag (die Tage lassen sich danach einzeln ändern) */
export const PER_WEEK_PRESETS: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };

const dayNum = (key: string) => Math.round(new Date(`${key}T12:00:00`).getTime() / 86400000);
/** Mo = 0 … So = 6 */
const weekdayIdx = (key: string) => (new Date(`${key}T12:00:00`).getDay() + 6) % 7;

export function occursOn(s: RoutineSchedule, key: string): boolean {
  if (s.paused || key < s.startDate) return false;
  switch (s.pattern.kind) {
    case 'daily': return true;
    case 'everyN': return (dayNum(key) - dayNum(s.startDate)) % Math.max(1, s.pattern.n) === 0;
    case 'weekdays': return s.pattern.days.includes(weekdayIdx(key));
  }
}

/** Alle Routinen-Termine eines Tages (nur solche, deren Routine es noch gibt), nach Uhrzeit */
export function schedulesOnDay(key: string): RoutineSchedule[] {
  return routineSchedulesRepo
    .getAll()
    .filter((s) => occursOn(s, key) && routinesRepo.getById(s.routineId))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function describePattern(s: Pick<RoutineSchedule, 'pattern' | 'time'>, lang: 'de' | 'en'): string {
  const p = s.pattern;
  const evening = s.time >= '17:00';
  if (p.kind === 'daily') return lang === 'en' ? (evening ? 'every evening' : 'every day') : evening ? 'jeden Abend' : 'jeden Tag';
  if (p.kind === 'everyN') return lang === 'en' ? (p.n === 2 ? 'every second day' : `every ${p.n} days`) : p.n === 2 ? 'jeden zweiten Tag' : `alle ${p.n} Tage`;
  const names = [...p.days].sort().map((d) => WEEKDAY_SHORT[lang][d]).join(', ');
  const preset = PER_WEEK_PRESETS[p.days.length];
  const isPreset = preset && [...p.days].sort().join() === preset.join();
  if (isPreset) return lang === 'en' ? `${p.days.length}× a week (${names})` : `${p.days.length}× pro Woche (${names})`;
  return names || (lang === 'en' ? 'no day chosen' : 'kein Tag gewählt');
}

export function markHandled(id: string, key: string): void {
  const s = routineSchedulesRepo.getById(id);
  if (s && !s.handled.includes(key)) routineSchedulesRepo.save({ ...s, handled: [...s.handled.slice(-40), key] });
}

/** Die Routine, deren Zeit gerade ist (bis 2,5 Stunden danach – danach verschwindet die Erinnerung leise). */
export function dueSchedule(now: Date = new Date()): RoutineSchedule | null {
  const pad = (n: number) => String(n).padStart(2, '0');
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return (
    schedulesOnDay(key).find((s) => s.remindHome && !s.handled.includes(key) && toMin(s.time) <= mins && mins <= toMin(s.time) + 150) ?? null
  );
}
