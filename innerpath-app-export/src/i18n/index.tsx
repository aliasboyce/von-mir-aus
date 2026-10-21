import { createContext, useContext, useMemo, type ReactNode } from 'react';
import de from './de';
import en from './en';
import type { TranslationDictionary } from './de';
import type { SupportedLanguage } from '../data/types';
import { useSettings } from '../state/SettingsContext';

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = { de, en };

const I18nContext = createContext<TranslationDictionary>(de);

/**
 * Provides the active translation dictionary based on the user's language
 * setting. Components read strings with useT(), never by importing a
 * dictionary directly, so language stays centrally controlled.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const dictionary = useMemo(() => dictionaries[settings.language], [settings.language]);
  return <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>;
}

export function useT(): TranslationDictionary {
  return useContext(I18nContext);
}
