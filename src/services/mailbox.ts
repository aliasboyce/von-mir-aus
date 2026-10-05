import { useCallback, useEffect, useState } from 'react';
import { createRepository } from './storage/repository';

/**
 * "Postfach"-Auftrag — one place on the Home screen where everything
 * new lands: app updates, reminders, letters to self, appointment
 * follow-ups, gentle inward-check nudges. Time-driven things that
 * already compute their own "is it due right now" state (letters,
 * the daily check-in reminder, custom reminders) stay where they are
 * and are fed into the panel as live entries by HomePage; everything
 * that has to PERSIST until the person reads it (an update notice, a
 * "how was your appointment?" prompt one hour later, ...) is stored
 * here as a MailItem.
 *
 * addMail() is idempotent by id: dismissing a message never makes it
 * come back, and a deploy that is detected twice never produces two
 * notices.
 */
export type MailKind = 'update' | 'reminder' | 'letter' | 'followup' | 'checkin' | 'energy' | 'info';

export interface MailItem {
  id: string;
  kind: MailKind;
  title: string;
  text: string;
  createdAt: string;
  readAt?: string;
  /** Shown as a pulsing card at the top of Home until read (updates,
   * reminders, follow-ups) instead of only inside the Postfach list. */
  prominent?: boolean;
  actionKind?: 'reload' | 'link';
  actionLabel?: string;
  actionTo?: string;
  /** Free-form extra data, e.g. which appointment a follow-up is for. */
  payload?: Record<string, string>;
}

export const mailboxRepo = createRepository<MailItem>('mailbox');

const CHANGE_EVENT = 'innerpath:mailbox-changed';

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addMail(item: Omit<MailItem, 'createdAt'> & { createdAt?: string }): boolean {
  if (mailboxRepo.getById(item.id)) return false;
  mailboxRepo.save({ ...item, createdAt: item.createdAt ?? new Date().toISOString() });
  notify();
  return true;
}

export function markMailRead(id: string): void {
  const m = mailboxRepo.getById(id);
  if (!m || m.readAt) return;
  mailboxRepo.save({ ...m, readAt: new Date().toISOString() });
  notify();
}

export function markAllMailRead(): void {
  const now = new Date().toISOString();
  mailboxRepo.getAll().forEach((m) => {
    if (!m.readAt) mailboxRepo.save({ ...m, readAt: now });
  });
  notify();
}

export function removeMail(id: string): void {
  mailboxRepo.remove(id);
  notify();
}

/** Newest first. */
export function allMail(): MailItem[] {
  return mailboxRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Re-renders the caller whenever the mailbox changes (in this tab). */
export function useMailbox(): { items: MailItem[]; unread: MailItem[]; prominent: MailItem[] } {
  const [items, setItems] = useState<MailItem[]>(() => allMail());
  const refresh = useCallback(() => setItems(allMail()), []);
  useEffect(() => {
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, [refresh]);
  const unread = items.filter((m) => !m.readAt);
  return { items, unread, prominent: unread.filter((m) => m.prominent) };
}
