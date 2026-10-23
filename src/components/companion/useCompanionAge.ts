import { useEffect, useState } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { activeDaysSince, ageFromDays, onGrowthChange } from '../../services/companionGrowth';

/** age 0…1 of an animal companion (respects the "Wachstum" setting) and how many active days it has lived */
export function useCompanionAge(adoptedAt: string | undefined): { age: number; days: number; mode: 'grow' | 'adult' | 'baby' } {
  const { settings } = useSettings();
  const mode = settings.companionAgeMode ?? 'grow';
  const [, bump] = useState(0);
  useEffect(() => onGrowthChange(() => bump((n) => n + 1)), []);
  // 'adult' = a preview figure that is always fully grown (intro background, setup preview)
  const fixedAdult = adoptedAt === 'adult';
  const days = fixedAdult ? 30 : activeDaysSince(adoptedAt);
  const age = fixedAdult ? 1 : mode === 'adult' ? 1 : mode === 'baby' ? 0 : ageFromDays(days);
  return { age, days, mode };
}
