import { Sparkles } from 'lucide-react';
import { useUpdateAvailable } from '../../services/updateCheck';
import { useT } from '../../i18n';

/**
 * "Update-Benachrichtigung fuer Nutzer"-Auftrag — appears once a newer
 * deploy is detected (see updateCheck.ts). The one thing a person
 * actually has to do is reload — the button does that directly, no
 * separate instructions to follow (uninstalling/reinstalling the
 * home-screen shortcut is never necessary, a normal reload is enough
 * since this is a browser-based PWA, not an app-store app).
 */
export function UpdateAvailableBanner() {
  const t = useT();
  const updateAvailable = useUpdateAvailable();
  if (!updateAvailable) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[350] flex items-center gap-3 px-4 py-3 mx-auto"
      style={{
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        maxWidth: 'var(--app-max-width-desktop, 440px)',
        background: 'var(--color-primary)',
        color: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <Sparkles size={18} className="flex-shrink-0" />
      <p className="text-[13px] flex-1">{t.updateBanner.text}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-[13px] font-medium px-3 py-1.5 rounded-full flex-shrink-0"
        style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}
      >
        {t.updateBanner.cta}
      </button>
    </div>
  );
}
