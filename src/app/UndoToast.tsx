import { useEffect, useState } from 'react';
import { onUndoOffer, type UndoOffer } from '../services/undoDelete';
import { useSettings } from '../state/SettingsContext';

/**
 * Feinschliff F6: ruhiger Hinweis „Gelöscht · Rückgängig“ (7 Sekunden, ohne Ton).
 * Entfernen = Hinweis weg, Löschen funktioniert wie vorher.
 */
export function UndoToast() {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  useEffect(() => onUndoOffer(setOffer), []);
  if (!offer) return null;
  return (
    <div
      role="status"
      data-testid="undo-toast"
      className="fixed left-1/2 -translate-x-1/2 z-[230] flex items-center gap-1 pl-4 pr-1.5 rounded-full shadow-[var(--shadow-md)]"
      style={{ bottom: 'calc(var(--nav-height, 64px) + env(safe-area-inset-bottom) + 12px)', background: 'var(--color-text)', color: 'var(--color-bg)' }}
    >
      <span className="text-[14px] py-2">
        {offer.count > 1 ? (en ? `${offer.count} items deleted` : `${offer.count} Einträge gelöscht`) : (en ? 'Deleted' : 'Gelöscht')}
      </span>
      <button
        type="button"
        data-testid="undo-btn"
        onClick={offer.undo}
        className="min-h-[44px] px-4 rounded-full text-[14px] font-medium underline underline-offset-2"
      >
        {en ? 'Undo' : 'Rückgängig'}
      </button>
    </div>
  );
}
