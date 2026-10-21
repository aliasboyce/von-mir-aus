import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

interface ImageCropModalProps {
  src: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

const FRAME = 280;

/**
 * "Bildausschnitt waehlen am Handy geht nicht"-Auftrag — the previous
 * version relied on setPointerCapture to keep receiving move events
 * once a drag started. iOS Safari has long-standing, well-documented
 * unreliability with setPointerCapture specifically for touch-origin
 * pointers — it can silently fail to actually capture, so the moment
 * a real finger (imprecise, unlike a mouse) drifts a few pixels
 * outside this deliberately small 280px frame during a drag, move
 * events simply stop arriving and the drag appears to "not work" —
 * matching exactly what was reported. The robust, capture-independent
 * fix: attach the move/up listeners to the document itself for the
 * duration of the drag, so they keep firing no matter where the
 * finger physically is on screen. Also adds real two-finger pinch to
 * zoom (the second half of "mit den Fingern groesser stellen"),
 * alongside the existing slider — both control the same zoom value.
 */
export function ImageCropModal({ src, onCancel, onConfirm }: ImageCropModalProps) {
  const t = useT();
  useRegisterModalOpen(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const imgRef = useRef<HTMLImageElement>(null);
  const naturalRef = useRef({ w: 1, h: 1 });
  const frameRef = useRef<HTMLDivElement>(null);

  function onImgLoad() {
    const img = imgRef.current;
    if (img) naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
  }

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      // Two fingers down: pinch-to-zoom, drag is suspended for the
      // duration (matches the natural feel of photo apps).
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (!pinchRef.current) {
          pinchRef.current = { startDist: dist, startZoom: zoom };
        } else {
          const scale = dist / pinchRef.current.startDist;
          const next = Math.min(3, Math.max(1, pinchRef.current.startZoom * scale));
          setZoom(next);
        }
        return;
      }
      if (!dragRef.current) return;
      setOffset({
        x: dragRef.current.startOffX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.startOffY + (e.clientY - dragRef.current.startY),
      });
    }
    function handleUp(e: PointerEvent) {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) pinchRef.current = null;
      if (activePointers.current.size === 0) dragRef.current = null;
    }
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  function onPointerDown(e: React.PointerEvent) {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
      dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: offset.x, startOffY: offset.y };
    }
  }

  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    // Base scale: image is shown covering the frame at zoom=1, exactly
    // like the visible <img> below (object-fit: cover behavior,
    // computed by hand since we need the same numbers for the canvas
    // extraction as for the on-screen preview).
    const { w: nw, h: nh } = naturalRef.current;
    const coverScale = Math.max(FRAME / nw, FRAME / nh) * zoom;
    const displayW = nw * coverScale;
    const displayH = nh * coverScale;
    // Top-left of the displayed (scaled) image relative to the frame's
    // top-left, given it's centered plus the user's drag offset.
    const imgLeft = (FRAME - displayW) / 2 + offset.x;
    const imgTop = (FRAME - displayH) / 2 + offset.y;
    // The frame's own top-left in the image's natural pixel space.
    const srcX = (0 - imgLeft) / coverScale;
    const srcY = (0 - imgTop) / coverScale;
    const srcSize = FRAME / coverScale;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 480, 480);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  }

  return createPortal(
    <div className="fixed inset-0 z-[245] flex items-center justify-center animate-in" style={{ background: 'rgba(30,28,22,0.75)' }}>
      <div className="bg-[var(--color-surface)] rounded-[24px] p-5 w-[90vw] max-w-[360px]">
        <p className="text-[15px] text-[var(--color-text)] mb-3 text-center">{t.imageCrop.title}</p>
        <div
          ref={frameRef}
          className="relative mx-auto overflow-hidden rounded-[var(--radius-lg)] touch-none"
          style={{ width: FRAME, height: FRAME, background: '#00000015', cursor: 'grab' }}
          onPointerDown={onPointerDown}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={onImgLoad}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${zoom * 100}%`,
              height: `${zoom * 100}%`,
              objectFit: 'cover',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              userSelect: 'none',
            }}
          />
        </div>
        <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-2 mb-3">{t.imageCrop.dragHint}</p>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full mb-4"
          aria-label={t.imageCrop.zoomLabel}
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] border border-[var(--color-border)]">
            {t.common.cancel}
          </button>
          <button onClick={confirm} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">
            {t.imageCrop.confirmCta}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
