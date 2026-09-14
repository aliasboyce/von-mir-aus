import { X, Sparkles } from 'lucide-react';
import { useWhatsNew } from '../../services/useWhatsNew';
import { useSettings } from '../../state/SettingsContext';

/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — a small, dismissible
 * card (not a blocking modal — the person can keep using the app
 * underneath it) listing what changed in the most recent update.
 */
export function WhatsNewCard() {
  const { settings } = useSettings();
  const { entry, dismiss } = useWhatsNew();
  if (!entry) return null;
  const items = settings.language === 'en' ? entry.itemsEn : entry.items;

  return (
    <div
      className="fixed left-0 right-0 z-[350] mx-auto px-4"
      style={{ bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))', maxWidth: 'var(--app-max-width-desktop, 440px)' }}
    >
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-start gap-2 mb-2">
          <Sparkles size={16} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[var(--color-text)] flex-1">
            {settings.language === 'en' ? "What's new" : 'Was ist neu'}
          </p>
          <button onClick={dismiss} data-sound="close" aria-label={settings.language === 'en' ? 'Close' : 'Schließen'} className="p-1 -mr-1 -mt-1 text-[var(--color-text-faint)]">
            <X size={16} />
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
