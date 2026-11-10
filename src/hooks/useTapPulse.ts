import { useEffect } from 'react';

/**
 * Deutlicheres Antippen: jedes Antippen eines Knopfes, einer Kachel oder eines Links bekommt kurz einen sichtbaren
 * Puls (leicht eindrücken, zurückfedern, ein Ring, der ausläuft). Rein optisch, ohne die Bedienung zu verzögern.
 * Aus bei „Bewegung reduzieren“ (dann gilt die CSS-Regel [data-reduce-motion]).
 */
const SELECTOR = 'button, a[href], [role="button"], [role="tab"], summary, label.cursor-pointer';

export function useTapPulse(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const el = t?.closest?.(SELECTOR) as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      // Eingabefelder, Slider und Elemente, die selbst Fläche/Overlay sind, nicht pulsen lassen
      if (el.closest('[data-no-pulse]') || el.matches('[data-no-pulse]')) return;
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth * 0.98 && r.height > window.innerHeight * 0.6) return; // vollflächige Hintergründe
      el.classList.remove('tap-pulse');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('tap-pulse');
      const done = () => { el.classList.remove('tap-pulse'); el.removeEventListener('animationend', done); };
      el.addEventListener('animationend', done);
      window.setTimeout(done, 700);
    };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, [enabled]);
}
