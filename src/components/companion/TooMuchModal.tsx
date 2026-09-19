import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

interface TooMuchModalProps {
  onClose: () => void;
}

/**
 * "Das ist mir hier jetzt alles zu viel"-Auftrag — a companion-guided
 * entry point into the app's existing "Nur jetzt" mode (which already
 * restricts navigation to just Home / Check-in / Zugang / Krisenmodus
 * — see BottomNav.tsx and AppShell.tsx's NUR_JETZT_ALLOWED_PREFIXES).
 * Deliberately reuses that mechanism rather than building a second,
 * parallel "reduced" system — this is just a warm, explicit door into
 * it, for the moment the app's own breadth becomes part of the
 * overwhelm rather than a resource.
 */
export function TooMuchModal({ onClose }: TooMuchModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  function activate() {
    updateSettings({ nurJetztMode: true });
    onClose();
    navigate('/');
  }

  return (
    <div className="fixed inset-0 z-[420] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[var(--radius-xl)] p-5 animate-in" style={{ background: 'var(--color-surface)' }} onClick={(e) => e.stopPropagation()}>
        <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.companion.tooMuchTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-4">{t.companion.tooMuchExplain}</p>
        {settings.nurJetztMode ? (
          <p className="text-[13px] text-[var(--color-primary)] mb-4">{t.companion.tooMuchAlreadyOn}</p>
        ) : null}
        <button onClick={activate} className="w-full py-3 rounded-full text-[14px] mb-2" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}>
          {t.companion.tooMuchCta}
        </button>
        <button onClick={onClose} className="w-full py-2 text-[13px] text-[var(--color-text-faint)]">
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
