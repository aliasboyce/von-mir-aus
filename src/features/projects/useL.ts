import { useSettings } from '../../state/SettingsContext';

/** kleine Zweisprachigkeit für die Projekte: L('deutsch', 'english') */
export function useL(): { L: (de: string, en: string) => string; lang: 'de' | 'en' } {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  return { L: (de, en) => (lang === 'en' ? en : de), lang };
}
