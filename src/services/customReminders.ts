import { createRepository } from './storage/repository';

/**
 * "Mehr Erinnerungen einstellen"-Auftrag — the app only had one
 * hardcoded reminder (the daily check-in nudge). This adds an
 * open-ended list the person can build themselves: any label, any
 * time, each independently on/off. Stays as simple in-app nudges
 * (same mechanism as the existing one — no push notifications, no
 * service worker), just no longer limited to a single slot.
 */
export interface CustomReminder {
  id: string;
  label: string;
  time: string; // "HH:MM", 24h
  enabled: boolean;
  createdAt: string;
  /** Last date (YYYY-MM-DD) this reminder was dismissed for — a
   * dismissed reminder stays hidden for the rest of that day, then
   * reappears the next day it's due, same behavior as the existing
   * check-in reminder. */
  dismissedOn?: string;
}

export const customRemindersRepo = createRepository<CustomReminder>('custom-reminders');

export function reminderTimeIsDue(time: string): boolean {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return now >= target;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Enabled reminders whose time has passed today and that haven't
 * already been dismissed today. */
export function getDueCustomReminders(): CustomReminder[] {
  const today = todayKey();
  return customRemindersRepo
    .getAll()
    .filter((r) => r.enabled && reminderTimeIsDue(r.time) && r.dismissedOn !== today);
}

export function dismissCustomReminder(id: string): void {
  const r = customRemindersRepo.getById(id);
  if (!r) return;
  customRemindersRepo.save({ ...r, dismissedOn: todayKey() });
}
