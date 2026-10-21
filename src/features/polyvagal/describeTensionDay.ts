import type { TensionEntry } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

/**
 * Deliberately simple — an average and a count, nothing more elaborate.
 * Mirrors describeDay.ts's principle of never claiming more than the
 * data actually supports (point values only, no duration).
 */
export function describeTensionDay(entries: TensionEntry[], t: TranslationDictionary): string {
  if (entries.length === 0) return t.tension.emptyChart;
  const avg = Math.round(entries.reduce((sum, e) => sum + e.value, 0) / entries.length);
  return t.tension.describeDay.replace('{count}', String(entries.length)).replace('{avg}', String(avg));
}
