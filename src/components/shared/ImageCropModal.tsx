import { useRef, useState } from 'react';
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
 * "Bilder zuschneiden"-Auftrag — deliberately the simplest interaction
 * that still gives real control: the photo sits behind a fixed square
 * frame, drag to reposition it, a slider to zoom, confirm extracts
 * exactly what's inside the frame via canvas. No external cropping
 * library needed (keeps the bundle small and avoids a new dependency
 * for one modal), works the same on touch and mouse since it's plain
 * pointer events, and the original uploaded file is never touched —
 * only a new cropped data URL is produced.
 */
export function ImageCropModal({ src, onCancel, onConfirm }: ImageCropModalProps) {
  const t = useT();
  useRegisterModalOpen(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const naturalRef = useRef({ w: 1, h: 1 });

  function onImgLoad() {
    const img = imgRef.current;
    if (img) naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
  }

  function onPointerDown(e: React.PointerEvent) {
    // Capture on currentTarget (the container that actually holds
    // these listeners), not target (which can be the child <img> on
    // some mobile browsers and silently fail to capture there).
    // Guarded because setPointerCapture can throw for pointer ids the
    // platform doesn't recognize as active — a throw here must never
    // prevent the drag from starting.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // dragging still works without capture; capture only prevents
      // the drag from ending early if the pointer leaves the frame.
    }
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: offset.x, startOffY: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.startOffX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.startOffY + (e.clientY - dragRef.current.startY),
    });
  }
  function onPointerUp() {
    dragRef.current = null;
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
          className="relative mx-auto overflow-hidden rounded-[var(--radius-lg)] touch-none"
          style={{ width: FRAME, height: FRAME, background: '#00000015', cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
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
