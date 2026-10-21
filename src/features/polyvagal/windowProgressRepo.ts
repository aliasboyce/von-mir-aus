import { createRepository } from '../../services/storage/repository';

/**
 * "Fenster-Fortschritt dokumentieren"-Auftrag — a simple, dated
 * snapshot of someone's calibrated zone boundaries each time they
 * choose to save one, so growth over months becomes visible as
 * "schwarz auf weiß" evidence of therapy progress, without asking for
 * any table-filling — just one button press at the moment they
 * notice their own window has changed.
 *
 * "Zonen selbst kalibrieren"-Fund — was windowStart/windowEnd (a
 * single comfort-zone snapshot); now the five zone boundaries
 * themselves, matching what's actually calibrated. boundaries is
 * optional so OLD entries (still holding windowStart/windowEnd) keep
 * displaying in the chronicle rather than breaking — see
 * WindowProgressPrintView.tsx for how both shapes render.
 */
export interface WindowProgressEntry {
  id: string;
  createdAt: string;
  windowStart?: number;
  windowEnd?: number;
  boundaries?: [number, number, number, number, number];
}

export const windowProgressRepo = createRepository<WindowProgressEntry>('window-progress');
