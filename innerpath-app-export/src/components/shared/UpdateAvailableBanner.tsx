import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useUpdateAvailable } from '../../services/updateCheck';
import { useT } from '../../i18n';

const DISMISSED_KEY = 'innerpath:update-banner-dismissed-build';

/**
 * "Die Update-Nachricht jetzt oft schon wieder nicht bekommen"-Fund —
 * was a floating bottom banner on every page, no close button, easy
 * to miss entirely or have covered by other UI. Now: lives inline at
 * the top of the Home screen only (rendered there, not globally in
 * AppShell any more), stays put until explicitly closed with the X —
 * no auto-hide, no timer. Dismissal is stored per buildId, so closing
 * today's notice doesn't silently suppress a genuinely new one later.
 */
export function UpdateAvailableBanner() {
  const t = useT();
  const { available, buildId } = useUpdateAvailable();
  const [dismissedBuild, setDismissedBuild] = useState<string | null>(() => localStorage.getItem(DISMISSED_KEY));

  if (!available || !buildId || buildId === dismissedBuild) return null;

  function dismiss() {
    if (buildId) {
      localStorage.setItem(DISMISSED_KEY, buildId);
      setDismissedBuild(buildId);
    }
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 mb-5 rounded-[var(--radius-lg)]"
      style={{ background: 'var(--color-primary)', color: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}
    >
      <Sparkles size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-[13px] flex-1 leading-relaxed">{t.updateBanner.text}</p>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <button onClick={() => window.location.reload()} className="text-[13px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>
          {t.updateBanner.cta}
        </button>
        <button onClick={dismiss} aria-label={t.common.close} className="p-0.5 opacity-80">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
