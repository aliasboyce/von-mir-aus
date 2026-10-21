import type { TranslationDictionary } from '../../i18n/de';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import type { RoutineRun } from './routinesRepo';

/**
 * One line for the look-back (day, week, PDF): "Routine X gemacht (3 von 4 Schritten) · danach Anspannung 42,
 * Nervensystem: …". Shared so every place words it the same way.
 */
export function routineRunLine(run: RoutineRun, t: TranslationDictionary, lang: 'de' | 'en'): string {
  const done = run.cards.filter((c) => c.done).length;
  const total = run.cards.length;
  const en = lang === 'en';
  let line = en ? `Routine "${run.title}" done (${done} of ${total} steps)` : `Routine „${run.title}“ gemacht (${done} von ${total} Schritten)`;
  if (run.tensionAfter != null) {
    const band = AROUSAL_BANDS.find((b) => b.id === run.stateAfter) ?? AROUSAL_BANDS.find((b) => run.tensionAfter! >= b.min && run.tensionAfter! <= b.max);
    const label = band ? t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones]?.label : '';
    line += en ? ` · afterwards tension ${run.tensionAfter}${label ? `, nervous system: ${label}` : ''}` : ` · danach Anspannung ${run.tensionAfter}${label ? `, Nervensystem: ${label}` : ''}`;
  }
  if (run.took?.length) line += en ? ` · medication entered: ${run.took.join(', ')}` : ` · Medikament eingetragen: ${run.took.join(', ')}`;
  const used = [...(run.skillsDone ?? []), ...(run.usedResources ?? [])];
  if (used.length) line += en ? ` · used: ${used.join(', ')}` : ` · genutzt: ${used.join(', ')}`;
  return line;
}

export const routineRunTime = (run: RoutineRun, locale: string) => new Date(run.endedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
