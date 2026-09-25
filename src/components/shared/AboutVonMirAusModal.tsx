import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { MarkdownLite } from './MarkdownLite';

interface AboutVonMirAusModalProps {
  text: string;
  onClose: () => void;
}

/**
 * "Die Idee hinter 'Von mir aus' — abrufbar ueber die Startseiten-
 * Ueberschrift, und einmalig nach der Wesen-Vorstellung"-Auftrag.
 * Reused as-is for the Bridges-page info text too (same shape, just a
 * different long string passed in).
 */
export function AboutVonMirAusModal({ text, onClose }: AboutVonMirAusModalProps) {
  const t = useT();
  useRegisterModalOpen(true);

  return createPortal(
    <div className="fixed inset-0 z-[260] bg-[var(--color-bg)] flex flex-col animate-in no-print" role="dialog" aria-modal="true">
      <div className="flex items-center justify-end px-4 pt-4 pb-2" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <button onClick={onClose} aria-label={t.common.close} className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)]">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-10 max-w-[560px] mx-auto w-full">
        <MarkdownLite text={text} />
      </div>
    </div>,
    document.body,
  );
}
