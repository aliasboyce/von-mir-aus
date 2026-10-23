import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type UserSettings } from '../data/types';
import { createKeyValueStore } from '../services/storage/keyValueStore';

const settingsStore = createKeyValueStore<UserSettings>('settings', DEFAULT_SETTINGS);

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Merge stored settings over the current defaults (not just a whole-object
  // fallback) so a returning person's settings JSON — which may predate
  // fields added in a later app version — always has every key populated,
  // without ever needing a destructive migration step.
  const [settings, setSettings] = useState<UserSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...settingsStore.get(),
  }));

  useEffect(() => {
    settingsStore.set(settings);
  }, [settings]);

  function updateSettings(partial: Partial<UserSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
