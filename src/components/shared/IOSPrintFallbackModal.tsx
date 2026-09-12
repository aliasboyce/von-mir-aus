import { useState } from 'react';
import { useT } from '../../i18n';

export function IOSPrintFallbackModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [href] = useState(() => window.location.href);
  return (
    <div className="fixed inset-0 z-[245] flex items-end sm:items-center justify-center animate-in" style={{ background: 'rgba(30,28,22,0.55)' }} onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[380px] p-5" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] text-[var(--color-text)] mb-2">{t.common.iosPrintTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-5">{t.common.iosPrintExplanation}</p>
        {/*
         * "In Safari oeffnen funktioniert nicht"-Auftrag — a genuine
         * anchor tag the person taps directly is what reliably breaks
         * out of iOS standalone mode; a programmatically created and
         * auto-clicked <a> (the previous approach, dispatched from a
         * plain button's onClick) is a synthetic click, not a real tap
         * on a real link, and iOS is inconsistent about honoring that
         * as an "open in browser" request. Rendering the real anchor
         * directly and letting the person's own tap land on it is the
         * more reliable version of the same idea.
         */}
        <a
          href={href}
          target="_blank"
          rel="noopener"
          onClick={onClose}
          className="block w-full py-3 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)] mb-2 text-center"
        >
          {t.common.openInSafariCta}
        </a>
        <button onClick={onClose} className="w-full py-2.5 text-[13px] text-[var(--color-text-faint)]">
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
