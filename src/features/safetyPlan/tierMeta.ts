import type { WarningTier } from '../../data/types';

export const TIER_LABELS: Record<WarningTier, string> = {
  gelb: 'Warnzeichen – Was kann ich tun?',
  orange: 'Verschlechterung – Möchte ich jemanden um Hilfe fragen?',
  rot: 'Außer Kontrolle – Ich brauche umgehend Hilfe.',
};

export const TIER_SHORT_LABELS: Record<WarningTier, string> = {
  gelb: 'Gelb',
  orange: 'Orange',
  rot: 'Rot',
};
