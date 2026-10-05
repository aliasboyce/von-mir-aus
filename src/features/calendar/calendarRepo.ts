import { createRepository } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * "Neue Seite: Kalender"-Auftrag — data for the calendar: appointments,
 * the person-chosen appointment categories (with their own colors) and
 * the per-day "Ich muss gar nichts, aber ich will:" list.
 */
export interface CalendarCategory {
  id: string;
  label: string;
  color: string;
}

export interface Appointment {
  id: string;
  title: string;
  /** Local calendar day, 'YYYY-MM-DD'. */
  date: string;
  /** Local time, 'HH:MM'. */
  time: string;
  categoryId?: string;
  /** NetworkEntry.id of the person this appointment is with. */
  personId?: string;
  note?: string;
  /** Minutes before the start; 0 = at the time; null/undefined = no reminder. */
  reminderMinutes?: number | null;
  reminderDeliveredAt?: string;
  followUpDeliveredAt?: string;
  /** "Wie war dein Termin?" — written in the Postfach one hour after. */
  reflection?: string;
  reflectionAt?: string;
  /** Written in the second follow-up question: shown at the NEXT
   * appointment with the same person (or the explicitly linked one). */
  noteForNext?: string;
  /** Set when this appointment was created through the follow-up. */
  previousAppointmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wish {
  id: string;
  day: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export const appointmentsRepo = createRepository<Appointment>('calendar-appointments');
export const calendarCategoriesRepo = createRepository<CalendarCategory>('calendar-categories');
export const wishesRepo = createRepository<Wish>('calendar-wishes');
export const pushHintSeenStore = createKeyValueStore<boolean>('calendar-push-hint-seen', false);

/** Starting suggestions, fully editable/deletable by the person. */
const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: 'cal_privat', label: 'Privat', color: '#7d5a95' },
  { id: 'cal_aerztlich', label: 'Ärztlich', color: '#c9522f' },
  { id: 'cal_freunde', label: 'Freunde', color: '#3d8b52' },
];

export function seedCalendarCategoriesIfEmpty() {
  calendarCategoriesRepo.seedIfEmpty(DEFAULT_CATEGORIES);
}

export const CATEGORY_COLOR_CHOICES = ['#c9522f', '#e8a83d', '#8fae3d', '#3d8b52', '#4a6fa5', '#7d5a95', '#b4637a', '#5a6b5e'];

// ---------------------------------------------------------------- helpers

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDay(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

/** The appointment's start as a local Date. */
export function startOf(a: Pick<Appointment, 'date' | 'time'>): Date {
  return new Date(`${a.date}T${a.time || '00:00'}:00`);
}

/** Today plus the next six days — the ONLY range the main view shows. */
export function nextSevenDays(from: Date = new Date()): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function appointmentsOnDay(key: string): Appointment[] {
  return appointmentsRepo
    .getAll()
    .filter((a) => a.date === key)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function wishesOnDay(key: string): Wish[] {
  return wishesRepo
    .getAll()
    .filter((w) => w.day === key)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Notes written for "next time" that belong in front of this
 * appointment: the explicitly linked previous one, plus the latest
 * earlier appointment with the same person. Never the same text twice. */
export function carryNotesFor(a: Appointment): string[] {
  const all = appointmentsRepo.getAll();
  const notes: string[] = [];
  const linked = a.previousAppointmentId ? all.find((x) => x.id === a.previousAppointmentId) : undefined;
  if (linked?.noteForNext) notes.push(linked.noteForNext);
  if (a.personId) {
    const start = startOf(a).getTime();
    const earlier = all
      .filter((x) => x.id !== a.id && x.personId === a.personId && x.noteForNext && startOf(x).getTime() < start)
      .sort((x, y) => startOf(y).getTime() - startOf(x).getTime())[0];
    if (earlier?.noteForNext && !notes.includes(earlier.noteForNext)) notes.push(earlier.noteForNext);
  }
  return notes;
}
