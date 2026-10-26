import { getUiLanguage } from '../../services/uiLanguage';
import type { WarningTier } from '../../data/types';

const en = () => getUiLanguage() === 'en';

export const TIER_LABELS: Record<WarningTier, string> = {
  get gelb() { return en() ? 'Warning signs – What can I do?' : 'Warnzeichen – Was kann ich tun?'; },
  get orange() { return en() ? 'Getting worse – Do I want to ask someone for help?' : 'Verschlechterung – Möchte ich jemanden um Hilfe fragen?'; },
  get rot() { return en() ? 'Out of control – I need help right away.' : 'Außer Kontrolle – Ich brauche umgehend Hilfe.'; },
};

export const TIER_SHORT_LABELS: Record<WarningTier, string> = {
  get gelb() { return en() ? 'Yellow' : 'Gelb'; },
  get orange() { return en() ? 'Orange' : 'Orange'; },
  get rot() { return en() ? 'Red' : 'Rot'; },
};
