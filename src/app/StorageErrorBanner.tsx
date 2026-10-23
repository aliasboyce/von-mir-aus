import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { onStorageWriteFailed } from '../services/storage/storageFailureNotice';
import { useT } from '../i18n';

/**
 * Deliberately app-wide and minimal rather than per-page: a failed save
 * can happen from almost any screen (diary, garden, letters, ...), and
 * the person needs to know regardless of which one they're on. Shows
 * once per failure event and stays until dismissed — this is
 * information worth not losing to an accidental tap-away, unlike a
 * typical toast that vanishes on its own.
 */
export function StorageErrorBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onStorageWriteFailed(() => setVisible(true));
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[240] rounded-[var(--radius-lg)] p-4 flex items-start gap-3 shadow-[var(--shadow-lg)]"
      style={{ bottom: 'max(16px, env(safe-area-inset-bottom))', background: 'var(--color-surface)', border: '1.5px solid var(--color-accent-clay)' }}
      role="alert"
    >
      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent-clay)' }} />
      <p className="text-[13px] text-[var(--color-text)] leading-relaxed flex-1">{t.common.storageErrorText}</p>
      <button onClick={() => setVisible(false)} aria-label={t.common.close} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
