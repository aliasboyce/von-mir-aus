import { createRepository } from '../../services/storage/repository';

interface DailyNote {
  id: string; // the date, "YYYY-MM-DD"
  note: string;
  updatedAt: string;
}

export const dailyNotesRepo = createRepository<DailyNote>('polyvagal-daily-notes');

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyNote(dateStr: string): string {
  return dailyNotesRepo.getById(dateStr)?.note ?? '';
}

export function saveDailyNote(dateStr: string, note: string): void {
  if (!note.trim()) {
    dailyNotesRepo.remove(dateStr);
    return;
  }
  dailyNotesRepo.save({ id: dateStr, note, updatedAt: new Date().toISOString() });
}
