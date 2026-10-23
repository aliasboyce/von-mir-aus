import type { PolyvagalZone } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

export const POLYVAGAL_ZONE_ORDER: PolyvagalZone[] = ['ventral', 'sympathetic', 'dorsal'];

export const POLYVAGAL_ZONE_META: Record<
  PolyvagalZone,
  { label: (t: TranslationDictionary) => string; hint: (t: TranslationDictionary) => string; color: string; y: number }
> = {
  ventral: {
    label: (t) => t.polyvagal.ventral.label,
    hint: (t) => t.polyvagal.ventral.hint,
    color: 'var(--color-primary)',
    y: 0,
  },
  sympathetic: {
    label: (t) => t.polyvagal.sympathetic.label,
    hint: (t) => t.polyvagal.sympathetic.hint,
    color: 'var(--color-accent-sun)',
    y: 1,
  },
  dorsal: {
    label: (t) => t.polyvagal.dorsal.label,
    hint: (t) => t.polyvagal.dorsal.hint,
    color: 'var(--color-accent-sky)',
    y: 2,
  },
};
