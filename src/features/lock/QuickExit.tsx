import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { coverNow, getLockConfig, lockNow, useCovered, useLocked } from '../../services/appLock';

const RETURN_KEY = 'innerpath:quick-exit-return';
const POS_KEY = 'innerpath:quick-exit-pos';
type Pos = { left: number; top: number };

const SIZE = 40;
const clampPos = (p: Pos): Pos => ({
  left: Math.min(Math.max(4, p.left), Math.max(4, window.innerWidth - SIZE - 4)),
  top: Math.min(Math.max(4, p.top), Math.max(4, window.innerHeight - SIZE - 4)),
});
function readPos(): Pos | null {
  try {
    const v = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
    if (v && typeof v.left === 'number' && typeof v.top === 'number') return v;
  } catch { /* egal */ }
  return null;
}

/**
 * A small, calm button: one tap hides the app behind a neutral screen. Underneath, the start page is shown;
 * when you come back in, you land on the page where you stopped. The button can be dragged (like the Wesen),
 * so it never sits in the way.
 */
export function QuickExit({ above }: { above: boolean }) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const locked = useLocked();
  const covered = useCovered();
  const hidden = locked || covered;
  const wasHidden = useRef(hidden);
  const [pos, setPos] = useState<Pos | null>(() => readPos());
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const justDragged = useRef(false);

  // Wieder drin → zurück auf die Seite, auf der man aufgehört hat
  useEffect(() => {
    if (wasHidden.current && !hidden) {
      let back: string | null = null;
      try { back = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch { /* egal */ }
      if (back && back !== '/') navigate(back, { replace: true });
    }
    wasHidden.current = hidden;
  }, [hidden, navigate]);

  // Nach Größenänderung wieder ins Bild holen
  useEffect(() => {
    if (!pos) return;
    const on = () => setPos((p) => (p ? clampPos(p) : p));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [pos]);

  if (!settings.quickExit) return null;
  const label = settings.language === 'en' ? 'Hide now (drag to move)' : 'Schnell weg (zum Verschieben ziehen)';

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* egal */ }
  };
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 7) return;
    d.moved = true;
    setPos(clampPos({ left: d.left + dx, top: d.top + dy }));
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      justDragged.current = true;
      window.setTimeout(() => { justDragged.current = false; }, 80);
      setPos((p) => {
        if (p) { try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* egal */ } }
        return p;
      });
    }
  };
  const click = () => {
    if (justDragged.current || drag.current?.moved) return;
    try { sessionStorage.setItem(RETURN_KEY, `${location.pathname}${location.search}${location.hash}`); } catch { /* egal */ }
    navigate('/', { replace: true });
    if (getLockConfig()) lockNow();
    else coverNow();
  };

  return (
    <button
      ref={btn}
      type="button"
      aria-label={label}
      title={label}
      data-testid="quick-exit"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={click}
      className="fixed z-[120] w-10 h-10 rounded-full flex items-center justify-center no-print"
      style={{
        touchAction: 'none',
        ...(pos ? { left: pos.left, top: pos.top } : { left: 12, bottom: above ? 'calc(var(--nav-height) + env(safe-area-inset-bottom) + 12px)' : 'calc(16px + env(safe-area-inset-bottom))' }),
        background: 'color-mix(in srgb, var(--color-surface) 85%, transparent)',
        border: '1px solid var(--color-border-strong)',
        color: 'var(--color-text-muted)',
      }}
    >
      <EyeOff size={18} />
    </button>
  );
}
