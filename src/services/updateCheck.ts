import { useEffect, useState } from 'react';

/**
 * "Update-Benachrichtigung fuer Nutzer"-Auftrag — this is a 100%
 * client-side app with no backend to push a real notification, so
 * this is the closest practical equivalent: periodically re-fetch
 * version.json (now correctly marked no-cache in vercel.json — it
 * wasn't before, meaning Vercel's CDN could briefly keep serving a
 * stale version.json right after a deploy, delaying detection on a
 * first visit) and compare its buildId against this running instance's
 * own __BUILD_ID__ (baked in at build time — see vite.config.ts).
 * A mismatch means a newer version has been deployed since this tab
 * was opened.
 *
 * Checks on: initial mount, the tab regaining focus/visibility (the
 * moment someone actually comes back to actively use the app — the
 * most relevant time to know), and every 30 minutes while the tab
 * stays open and visible in the background.
 */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * "Die Update-Nachricht jetzt oft schon wieder nicht bekommen"-Fund —
 * the old return type (a plain boolean) was fine for detection, but
 * the banner that read it floated at the bottom of every page with no
 * close button, easy to miss or have covered by other UI. Now returns
 * the detected buildId itself too, so the banner can move to a fixed,
 * prominent spot (the Home screen) and track dismissal PER buildId —
 * closing today's notice doesn't suppress a genuinely new one later.
 */
export function useUpdateAvailable(): { available: boolean; buildId: string | null } {
  const [state, setState] = useState<{ available: boolean; buildId: string | null }>({ available: false, buildId: null });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (!cancelled && data.buildId && data.buildId !== __BUILD_ID__) {
          setState({ available: true, buildId: data.buildId });
        }
      } catch {
        // Offline or a transient network hiccup — never treat this as
        // "update available", and never let it surface as an error.
      }
    }

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') check();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return state;
}
