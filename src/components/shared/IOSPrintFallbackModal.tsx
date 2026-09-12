import { useT } from '../../i18n';
import { openCurrentUrlInSafari } from '../../services/printSupport';

export function IOSPrintFallbackModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[245] flex items-end sm:items-center justify-center animate-in" style={{ background: 'rgba(30,28,22,0.55)' }} onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[380px] p-5" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] text-[var(--color-text)] mb-2">{t.common.iosPrintTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-5">{t.common.iosPrintExplanation}</p>
        <button
          onClick={() => {
            openCurrentUrlInSafari();
            onClose();
          }}
          className="w-full py-3 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)] mb-2"
        >
          {t.common.openInSafariCta}
        </button>
        <button onClick={onClose} className="w-full py-2.5 text-[13px] text-[var(--color-text-faint)]">
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
