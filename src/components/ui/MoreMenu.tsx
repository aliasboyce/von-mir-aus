import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Ellipsis } from 'lucide-react';

export interface MoreItem {
  id: string;
  label: string;
  /** kleine Zeile unter dem Namen */
  hint?: string;
  icon?: ReactNode;
  onClick: () => void;
  /** zeigt einen Haken (für Ein/Aus-Punkte) */
  checked?: boolean;
  danger?: boolean;
  /** trennende Linie davor */
  divider?: boolean;
}

/**
 * Das „⋯“: eine ruhige Stelle für alles, was nicht jedes Mal gebraucht wird (Übersichten, Einstellungen der Seite,
 * Erklärtexte). Hält die Seite leer und übersichtlich. Öffnet unter dem Knopf, schließt beim Antippen daneben.
 */
export function MoreMenu({ items, label = 'Mehr', testId = 'more-menu', align = 'right', children }: { items: MoreItem[]; label?: string; testId?: string; align?: 'right' | 'left'; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  const toggle = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setPos(align === 'right' ? { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) } : { top: r.bottom + 6, left: Math.max(8, r.left) });
    setOpen((v) => !v);
  };
  return (
    <>
      <button type="button" onClick={(e) => toggle(e.currentTarget)} aria-label={label} aria-expanded={open} aria-haspopup="menu" data-testid={testId} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors">
        <Ellipsis size={22} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[240]" onClick={() => setOpen(false)} data-testid={`${testId}-backdrop`}>
          <div role="menu" className="absolute min-w-[220px] max-w-[min(320px,calc(100vw-16px))] rounded-2xl py-1.5 shadow-xl border border-[var(--color-border)]" style={{ top: pos.top, left: pos.left, right: pos.right, background: 'var(--color-surface)' }} onClick={(e) => e.stopPropagation()} data-testid={`${testId}-list`}>
            {items.map((it) => (
              <div key={it.id}>
                {it.divider && <div className="my-1 border-t border-[var(--color-border)]" />}
                <button type="button" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }} className="w-full flex items-center gap-3 text-left px-4 min-h-[48px] py-2 text-[14.5px] hover:bg-[var(--color-surface-muted)]" style={{ color: it.danger ? 'var(--color-danger)' : 'var(--color-text)' }} data-testid={`${testId}-${it.id}`}>
                  {it.icon && <span className="shrink-0 w-5 flex justify-center text-[var(--color-text-muted)]">{it.icon}</span>}
                  <span className="flex-1 min-w-0">
                    <span className="block">{it.label}</span>
                    {it.hint && <span className="block text-[12px] text-[var(--color-text-muted)] leading-snug">{it.hint}</span>}
                  </span>
                  {it.checked && <Check size={16} className="shrink-0 text-[var(--color-primary)]" />}
                </button>
              </div>
            ))}
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
