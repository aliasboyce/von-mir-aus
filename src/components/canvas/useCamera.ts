import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

/**
 * A small "infinite canvas" camera shared by the safety net and the mind maps:
 *   screen = (tx, ty) + scale · world
 * Drag the background to pan (with a little momentum), pinch / wheel to zoom around the fingers or
 * the cursor, and `fit()` brings everything back into view. Nothing here distorts the picture –
 * only translate and a uniform scale – so a map looks the same at any zoom or screen shape.
 */
export interface CameraView {
  scale: number;
  tx: number;
  ty: number;
}
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Options {
  enabled: boolean;
  minScale?: number;
  maxScale?: number;
  initial?: CameraView;
  /** called for a press-and-release on the empty background that did not move (a "tap") */
  onBackgroundTap?: (clientX: number, clientY: number) => void;
}

export function useCamera(containerRef: RefObject<HTMLElement | null>, opts: Options) {
  const { enabled, minScale = 0.1, maxScale = 6, onBackgroundTap } = opts;
  const [view, setViewState] = useState<CameraView>(opts.initial ?? { scale: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [gesturing, setGesturing] = useState(false);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pan = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean; t: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number; mx: number; my: number; tx: number; ty: number } | null>(null);
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const raf = useRef(0);
  const tapRef = useRef(onBackgroundTap);
  tapRef.current = onBackgroundTap;

  const setView = useCallback((v: CameraView | ((p: CameraView) => CameraView)) => {
    setViewState((p) => {
      const n = typeof v === 'function' ? v(p) : v;
      viewRef.current = n;
      return n;
    });
  }, []);

  const clampScale = useCallback((s: number) => Math.min(maxScale, Math.max(minScale, s)), [minScale, maxScale]);

  const stopMomentum = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  /** zoom by a factor around a screen point (container-relative); defaults to the centre */
  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      stopMomentum();
      const el = containerRef.current;
      const rect = el?.getBoundingClientRect();
      const px = cx ?? (rect ? rect.width / 2 : 0);
      const py = cy ?? (rect ? rect.height / 2 : 0);
      setView((v) => {
        const scale = clampScale(v.scale * factor);
        const k = scale / v.scale;
        return { scale, tx: px - k * (px - v.tx), ty: py - k * (py - v.ty) };
      });
    },
    [clampScale, containerRef, setView, stopMomentum],
  );

  /** bring a world rectangle into view (never zooms in beyond 1.4×, so a tiny map is not blown up) */
  const fit = useCallback(
    (b: Bounds, padding = 48) => {
      stopMomentum();
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const bw = Math.max(1, b.maxX - b.minX);
      const bh = Math.max(1, b.maxY - b.minY);
      const scale = Math.min(1.4, clampScale(Math.min((w - padding * 2) / bw, (h - padding * 2) / bh)));
      setView({ scale, tx: w / 2 - scale * (b.minX + bw / 2), ty: h / 2 - scale * (b.minY + bh / 2) });
    },
    [clampScale, containerRef, setView, stopMomentum],
  );

  /** container-relative screen → world */
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const v = viewRef.current;
      const x = clientX - (rect?.left ?? 0);
      const y = clientY - (rect?.top ?? 0);
      return { x: (x - v.tx) / v.scale, y: (y - v.ty) / v.scale };
    },
    [containerRef],
  );

  // wheel / trackpad zoom – needs a non-passive listener to be able to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopMomentum();
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        setView((v) => ({ ...v, tx: v.tx - e.deltaX, ty: v.ty - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef, enabled, setView, stopMomentum, zoomAt]);

  useEffect(() => stopMomentum, [stopMomentum]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      stopMomentum();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // gesture still works without capture
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setGesturing(true);
      const v = viewRef.current;
      if (pointers.current.size === 1) {
        pan.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty, moved: false, t: performance.now() };
        samples.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const rect = containerRef.current?.getBoundingClientRect();
        pinch.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          scale: v.scale,
          mx: (a.x + b.x) / 2 - (rect?.left ?? 0),
          my: (a.y + b.y) / 2 - (rect?.top ?? 0),
          tx: v.tx,
          ty: v.ty,
        };
        if (pan.current) pan.current.moved = true;
      }
    },
    [containerRef, enabled, stopMomentum],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || !pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size >= 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = containerRef.current?.getBoundingClientRect();
        const p = pinch.current;
        const scale = clampScale(p.scale * (dist / p.dist));
        const k = scale / p.scale;
        // follow the fingers' centre as well as the spread
        const cx = (a.x + b.x) / 2 - (rect?.left ?? 0);
        const cy = (a.y + b.y) / 2 - (rect?.top ?? 0);
        setView({ scale, tx: cx - k * (p.mx - p.tx), ty: cy - k * (p.my - p.ty) });
      } else if (pointers.current.size === 1 && pan.current) {
        const dx = e.clientX - pan.current.x;
        const dy = e.clientY - pan.current.y;
        if (!pan.current.moved && Math.hypot(dx, dy) > 5) pan.current.moved = true;
        if (pan.current.moved) {
          const { tx, ty } = pan.current;
          setView((v) => ({ ...v, tx: tx + dx, ty: ty + dy }));
          const now = performance.now();
          samples.current.push({ x: e.clientX, y: e.clientY, t: now });
          samples.current = samples.current.filter((s) => now - s.t < 100);
        }
      }
    },
    [clampScale, containerRef, enabled, setView],
  );

  const end = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const had = pointers.current.delete(e.pointerId);
      if (!had) return;
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        setGesturing(false);
        const p = pan.current;
        pan.current = null;
        if (p && !p.moved && e.type === 'pointerup') {
          tapRef.current?.(e.clientX, e.clientY);
          return;
        }
        // momentum: keep gliding a little in the direction of the last flick
        const s = samples.current;
        if (p?.moved && s.length >= 2 && e.type === 'pointerup') {
          const a = s[0];
          const b = s[s.length - 1];
          const dt = Math.max(1, b.t - a.t);
          let vx = (b.x - a.x) / dt;
          let vy = (b.y - a.y) / dt;
          if (Math.hypot(vx, vy) > 0.25 && performance.now() - b.t < 60) {
            let last = performance.now();
            const step = (now: number) => {
              const d = now - last;
              last = now;
              const f = Math.pow(0.0035, d / 1000);
              vx *= f;
              vy *= f;
              setView((v) => ({ ...v, tx: v.tx + vx * d, ty: v.ty + vy * d }));
              raf.current = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
            };
            raf.current = requestAnimationFrame(step);
          }
        }
      } else if (pointers.current.size === 1) {
        // one finger stays: continue panning from where it is, no jump
        const [r] = [...pointers.current.values()];
        const v = viewRef.current;
        pan.current = { x: r.x, y: r.y, tx: v.tx, ty: v.ty, moved: true, t: performance.now() };
      }
    },
    [enabled, setView],
  );

  return {
    view,
    setView,
    gesturing,
    zoomAt,
    fit,
    toWorld,
    stopMomentum,
    bind: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  };
}
