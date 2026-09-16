import { createRepository } from '../../services/storage/repository';

/**
 * "Fenster-Fortschritt dokumentieren"-Auftrag — a simple, dated
 * snapshot of someone's calibrated window (start/end %) each time
 * they choose to save one, so growth over months becomes visible as
 * "schwarz auf weiß" evidence of therapy progress, without asking for
 * any table-filling — just one button press at the moment they
 * notice their own window has changed.
 */
export interface WindowProgressEntry {
  id: string;
  createdAt: string;
  windowStart: number;
  windowEnd: number;
}

export const windowProgressRepo = createRepository<WindowProgressEntry>('window-progress');
