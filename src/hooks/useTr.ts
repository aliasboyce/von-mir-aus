import { useSettings } from '../state/SettingsContext';

/** tr('deutsch', 'english') – picks the text for the current app language (for small texts that are not in the big dictionaries) */
export function useTr() {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  return (de: string, e: string) => (en ? e : de);
}
