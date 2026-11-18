import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useL } from '../projects/useL';
import { inkFor } from '../nonverbal/commCardsRepo';

export interface ViewerStep {
  text: string;
  emoji?: string;
  /** Hintergrundfarbe; ohne Angabe: weiß */
  color?: string;
  /** Hinweis in kleiner Schrift unter dem Text */
  note?: string;
  /** optionale Zeit in Sekunden – läuft leise mit, nichts passiert am Ende */
  timerSec?: number;
}

/**
 * Ein Schritt (oder eine Karte) füllt den ganzen Bildschirm. Zurück/Weiter, nichts wird bewertet.
 * Wird im Krisenmodus für Skills, Routinen, Brücken-Schritte und Kommunikationskarten genutzt, damit man
 * den Krisenmodus dafür nicht verlassen muss: „Schließen“ führt genau dorthin zurück, wo man war.
 */
export function StepViewer({ title, steps, onClose, startAt = 0, nav = 'buttons', onEdit, onDelete }: { title: string; steps: ViewerStep[]; onClose: () => void; startAt?: number; nav?: 'buttons' | 'swipe'; onEdit?: (index: number) => void; onDelete?: (index: number) => void }) {
  const { L } = useL();
  const [i, setI] = useState(Math.min(startAt, Math.max(0, steps.length - 1)));
  const step = steps[i];
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!step?.timerSec) { setLeft(null); return; }
    const end = Date.now() + step.timerSec * 1000;
    setLeft(step.timerSec);
    const id = window.setInterval(() => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))), 500);
    return () => window.clearInterval(id);
  }, [i, step?.timerSec]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((v) => Math.min(steps.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [steps.length, onClose]);

  const [touchX, setTouchX] = useState<number | null>(null);
  if (!step) return null;
  const bg = step.color ?? '#ffffff';
  const ink = inkFor(bg);
  const last = i === steps.length - 1;
  const mm = left != null ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '';

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex flex-col"
      style={{ background: bg, color: ink }}
      role="dialog"
      aria-label={title}
      data-testid="step-viewer"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 60) setI((v) => (dx < 0 ? Math.min(steps.length - 1, v + 1) : Math.max(0, v - 1)));
        setTouchX(null);
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <p className="text-[14px] opacity-70 min-w-0 truncate">{title}{steps.length > 1 ? ` · ${i + 1}/${steps.length}` : ''}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
        {onEdit && (
          <button onClick={() => onEdit(i)} className="h-11 px-4 rounded-full border-2 text-[14px] font-medium" style={{ borderColor: ink }} data-testid="step-viewer-edit">{L('Bearbeiten', 'Edit')}</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(i)} className="h-11 px-4 rounded-full border-2 text-[14px] font-medium" style={{ borderColor: ink }} data-testid="step-viewer-delete">{L('Löschen', 'Delete')}</button>
        )}
        <button
          onClick={onClose}
          aria-label={L('Schließen', 'Close')}
          className="w-11 h-11 rounded-full flex items-center justify-center border-2 flex-shrink-0"
          style={{ borderColor: ink }}
          data-testid="step-viewer-close"
        >
          <X size={22} />
        </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-7 gap-5 overflow-y-auto">
        {step.emoji && <div style={{ fontSize: 96, lineHeight: 1 }} aria-hidden="true">{step.emoji}</div>}
        <p className="font-medium leading-snug" style={{ fontSize: step.text.length > 90 ? 24 : step.text.length > 40 ? 30 : 38 }} data-testid="step-viewer-text">{step.text}</p>
        {step.note && <p className="text-[15px] opacity-75 leading-relaxed max-w-[320px]">{step.note}</p>}
        {left != null && <p className="text-[22px] tabular-nums opacity-80" aria-live="off">{mm}</p>}
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setI(Math.max(0, i - 1))}
          disabled={i === 0}
          aria-label={L('Zurück', 'Back')}
          className="w-14 h-14 rounded-full flex items-center justify-center border-2 disabled:opacity-25"
          style={{ borderColor: ink }}
          data-testid="step-viewer-prev"
        >
          <ChevronLeft size={26} />
        </button>
        {last ? (
          <button onClick={onClose} className="flex-1 h-14 rounded-full text-[17px] font-medium border-2" style={{ borderColor: ink }} data-testid="step-viewer-done">
            {L('Zurück', 'Back')}
          </button>
        ) : (
          <p className="flex-1 text-center text-[13px] opacity-60">{nav === 'swipe' ? L('Wischen oder Pfeil', 'Swipe or arrow') : ''}</p>
        )}
        <button
          onClick={() => setI(Math.min(steps.length - 1, i + 1))}
          disabled={last}
          aria-label={L('Weiter', 'Next')}
          className="w-14 h-14 rounded-full flex items-center justify-center border-2 disabled:opacity-25"
          style={{ borderColor: ink, background: last ? 'transparent' : ink, color: last ? ink : bg }}
          data-testid="step-viewer-next"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
