import type { PolyvagalCheckIn, PolyvagalZone } from '../../data/types';
import { POLYVAGAL_ZONE_META } from './polyvagalMeta';
import type { TranslationDictionary } from '../../i18n/de';

interface ZoneCounts {
  ventral: number;
  sympathetic: number;
  dorsal: number;
}

function countZones(checkIns: PolyvagalCheckIn[]): ZoneCounts {
  const counts: ZoneCounts = { ventral: 0, sympathetic: 0, dorsal: 0 };
  checkIns.forEach((c) => {
    counts[c.zone] += 1;
  });
  return counts;
}

function dominantZone(counts: ZoneCounts): PolyvagalZone | null {
  const entries = Object.entries(counts) as [PolyvagalZone, number][];
  const withData = entries.filter(([, n]) => n > 0);
  if (withData.length === 0) return null;
  return withData.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Deliberately frequency-based ("X mal"), never duration-based — we only
 * have point-in-time check-ins, not how long a state lasted, so the text
 * never claims something the data can't support. Loosely informed by
 * Polyvagal Theory's three broad states (Dana's "autonomic map"), framed
 * as self-observation rather than any clinical read.
 */
export function describeDay(checkIns: PolyvagalCheckIn[], t: TranslationDictionary): string {
  if (checkIns.length === 0) return t.polyvagal.describeEmpty;

  const counts = countZones(checkIns);
  const dominant = dominantZone(counts);
  const total = checkIns.length;

  const parts: string[] = [];
  (['ventral', 'sympathetic', 'dorsal'] as PolyvagalZone[]).forEach((zone) => {
    if (counts[zone] > 0) {
      parts.push(`${counts[zone]}× ${POLYVAGAL_ZONE_META[zone].label(t)}`);
    }
  });

  const frequencySentence = t.polyvagal.describeFrequency
    .replace('{total}', String(total))
    .replace('{breakdown}', parts.join(', '));

  const observation = dominant ? t.polyvagal.describeDominant[dominant] : '';

  return `${frequencySentence} ${observation}`.trim();
}
