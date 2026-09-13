import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useT } from '../../i18n';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** "Umdrehen wie eine Karte"-Auftrag — Ressourcen-Detailansicht nutzt
   * die 3D-Flip-Animation statt des ueblichen sanften Aufklappens. */
  flipAnimation?: boolean;
}

/**
 * Rendered through a React portal directly onto <body> — NOT nested inside
 * the app-frame's normal DOM tree. This is deliberate: the app-frame card
 * uses `overflow: hidden` + `border-radius` on desktop (see index.css),
 * and while `position: fixed` is supposed to escape normal layout
 * regardless of ancestors, real-world browser behavior around fixed
 * positioning inside an `overflow: hidden` + rounded-corner ancestor has
 * enough cross-browser inconsistency that repeated "modal gets cut off /
 * can't reach Save" reports pointed here. A portal sidesteps the ambiguity
 * entirely: there is no ancestor left that could ever clip or reposition
 * this dialog, on any browser.
 *
 * Header/body split so scrolling stays reliable even on mobile browsers
 * where the keyboard shrinks the visual viewport. Also registers itself
 * with the app-wide modal stack (see ModalStackContext) so the bottom
 * navigation hides itself while this is open — that, not z-index tuning,
 * is what guarantees the Save button is never covered by the nav bar.
 */
export function Modal({ open, onClose, title, subtitle, children, flipAnimation }: ModalProps) {
  const t = useT();
  useRegisterModalOpen(open);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex items-end sm:items-center justify-center bg-[rgba(44,42,34,0.35)] animate-in no-print"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-[420px] flex flex-col bg-[var(--color-bg)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] animate-in ${flipAnimation ? 'card-flip' : 'card-reveal'} modal-sheet-height`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="text-[20px] text-[var(--color-text)]">{title}</h2>
            {subtitle && (
              <p className="text-[14px] text-[var(--color-text-muted)] mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            data-sound="close"
            className="p-2 -mr-2 -mt-1 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="flex-1 px-6 overflow-y-auto"
          style={{
            minHeight: 0,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
