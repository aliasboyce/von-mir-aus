import { BookOpen, Wrench, BookHeart, Users, MapPin, Zap, Compass } from 'lucide-react';
import type { AccessWheelDomain } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

export const ACCESS_WHEEL_DOMAIN_META: Record<
  AccessWheelDomain,
  { label: (t: TranslationDictionary) => string; icon: typeof BookOpen }
> = {
  wissen: { label: (t) => t.accessWheel.domains.wissen, icon: BookOpen },
  faehigkeiten: { label: (t) => t.accessWheel.domains.faehigkeiten, icon: Wrench },
  ressourcen: { label: (t) => t.accessWheel.domains.ressourcen, icon: BookHeart },
  menschen: { label: (t) => t.accessWheel.domains.menschen, icon: Users },
  orte: { label: (t) => t.accessWheel.domains.orte, icon: MapPin },
  handlung: { label: (t) => t.accessWheel.domains.handlung, icon: Zap },
  strategien: { label: (t) => t.accessWheel.domains.strategien, icon: Compass },
};
