import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { setCompanionLanguage } from '../components/companion/companionRegistry';

interface CompanionSpeechContextValue {
  /** the line to show right now, or null */
  spoken: { text: string; nonce: number; joy: boolean } | null;
  /** call from anywhere to make the companion say something immediately —
   * e.g. after saving an entry. Overrides the automatic page tip briefly.
   * Pass `joy: true` for genuine completions worth celebrating (creating a
   * bridge/resource, finishing a diary entry, completing a check-in) — it
   * triggers a brief, varied joy animation instead of just showing text. */
  say: (text: string | null, options?: { joy?: boolean }) => void;
}

const CompanionSpeechContext = createContext<CompanionSpeechContextValue | undefined>(undefined);

export function CompanionSpeechProvider({ children }: { children: ReactNode }) {
  const [spoken, setSpoken] = useState<{ text: string; nonce: number; joy: boolean } | null>(null);
  const counter = useRef(0);
  const { settings } = useSettings();

  useEffect(() => {
    setCompanionLanguage(settings.language === 'en' ? 'en' : 'de');
  }, [settings.language]);

  function say(text: string | null, options?: { joy?: boolean }) {
    if (!text) return;
    counter.current += 1;
    setSpoken({ text, nonce: counter.current, joy: !!options?.joy });
  }

  return (
    <CompanionSpeechContext.Provider value={{ spoken, say }}>{children}</CompanionSpeechContext.Provider>
  );
}

/** For pages that want to trigger a specific companion line (e.g. after
 * saving, deleting, or selecting something) rather than waiting for the
 * automatic per-page tip. */
export function useCompanionSay(): (text: string | null, options?: { joy?: boolean }) => void {
  const ctx = useContext(CompanionSpeechContext);
  if (!ctx) throw new Error('useCompanionSay must be used within CompanionSpeechProvider');
  return ctx.say;
}

/** Internal — only CompanionDock reads the spoken value directly. */
export function useCompanionSpoken() {
  const ctx = useContext(CompanionSpeechContext);
  if (!ctx) throw new Error('useCompanionSpoken must be used within CompanionSpeechProvider');
  return ctx.spoken;
}
