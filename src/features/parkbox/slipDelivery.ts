import { useEffect, useState } from 'react';
import { parkNotesRepo, type ParkNote } from './parkboxRepo';

/** lokale Zeit als 'YYYY-MM-DDTHH:MM' (lexikographisch vergleichbar) */
export function nowKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Zettel, die „losgeflogen“ sind und auf der Startseite auf eine Entscheidung warten */
export function dueSlips(): ParkNote[] {
  const now = nowKey();
  return parkNotesRepo.getAll().filter((n) => !n.archived && n.deliverAt && n.deliverAt <= now).sort((a, b) => (a.deliverAt as string).localeCompare(b.deliverAt as string));
}

export const SLIPS_CHANGED = 'vma-slips-changed';
export function notifySlipsChanged(): void {
  window.dispatchEvent(new Event(SLIPS_CHANGED));
}

export function useDueSlips(): ParkNote[] {
  const [list, setList] = useState<ParkNote[]>(() => dueSlips());
  useEffect(() => {
    const on = () => setList(dueSlips());
    const iv = window.setInterval(on, 20000);
    window.addEventListener('focus', on);
    window.addEventListener(SLIPS_CHANGED, on);
    document.addEventListener('visibilitychange', on);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('focus', on);
      window.removeEventListener(SLIPS_CHANGED, on);
      document.removeEventListener('visibilitychange', on);
    };
  }, []);
  return list;
}

export function setSlipDelivery(id: string, deliverAt: string | undefined): void {
  const n = parkNotesRepo.getById(id);
  if (!n) return;
  parkNotesRepo.save({ ...n, deliverAt, deliveredAt: undefined, updatedAt: new Date().toISOString() });
  notifySlipsChanged();
}

export function slipBackToBox(id: string): void { setSlipDelivery(id, undefined); }
export function slipDone(id: string): void {
  const n = parkNotesRepo.getById(id);
  if (!n) return;
  parkNotesRepo.save({ ...n, archived: true, deliverAt: undefined, deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  notifySlipsChanged();
}
export function slipDelete(id: string): void {
  parkNotesRepo.remove(id);
  notifySlipsChanged();
}

export function tomorrowDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
