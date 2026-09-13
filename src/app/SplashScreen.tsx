import { useEffect, useState } from 'react';
import { LichtCompanion } from '../components/companion/LichtCompanion';
import { useSettings } from '../state/SettingsContext';

/**
 * "Start-Bild beim App-Start"-Auftrag — a brief, quiet moment before
 * the home screen: just the companion and the app's name, fading in
 * and then out again. Shown once per browser session (sessionStorage,
 * not localStorage) — reopening the app in a fresh tab shows it again,
 * but navigating around inside the app never re-triggers it, and it
 * never blocks anyone from actually using the app (it's timed, not
 * dismiss-gated, and skips itself entirely if reduceMotion is on).
 */
const SESSION_KEY = 'von-mir-aus-splash-shown';
const FADE_MS = 900;
const HOLD_MS = 1100;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>(() => {
    if (settings.reduceMotion) return 'done';
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return 'done';
    } catch {
      // sessionStorage unavailable (private mode etc.) — just skip the splash
      return 'done';
    }
    return 'in';
  });

  useEffect(() => {
    if (phase === 'done') return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // best-effort only
    }
    const t1 = window.setTimeout(() => setPhase('hold'), FADE_MS);
    const t2 = window.setTimeout(() => setPhase('out'), FADE_MS + HOLD_MS);
    const t3 = window.setTimeout(() => setPhase('done'), FADE_MS + HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return <>{children}</>;

  return (
    <>
      <div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-bg)',
          opacity: phase === 'out' ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        <LichtCompanion size="large" />
        <p className="mt-5 text-[22px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          von mir aus
        </p>
      </div>
      {/* Mount the real app underneath right away (not after the splash
          finishes) so the very first paint someone sees post-splash is
          already the fully-loaded home screen, not a blank flash while
          everything initializes. */}
      {children}
    </>
  );
}
