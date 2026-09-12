import { useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { useT } from '../../i18n';

interface PhotoPositionerProps {
  photoDataUrl: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  onChange: (patch: { scale?: number; offsetX?: number; offsetY?: number }) => void;
  size?: number;
}

/** A circular preview the person can drag to reposition and zoom with a
 * slider — deliberately simple (no pinch-gesture math) since drag+slider
 * works identically and reliably on both mouse and touch via pointer events. */
export function PhotoPositioner({ photoDataUrl, scale, offsetX, offsetY, onChange, size = 128 }: PhotoPositionerProps) {
  const t = useT();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX, offsetY };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dxPercent = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dyPercent = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    const clamp = (v: number) => Math.max(-50, Math.min(50, v));
    onChange({
      offsetX: clamp(dragStart.current.offsetX + dxPercent),
      offsetY: clamp(dragStart.current.offsetY + dyPercent),
    });
  }

  function handlePointerUp() {
    dragStart.current = null;
    setDragging(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={frameRef}
        className="relative rounded-full overflow-hidden border border-[var(--color-border)]"
        style={{
          width: size,
          height: size,
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={photoDataUrl}
          alt=""
          draggable={false}
          className="absolute top-1/2 left-1/2 w-full h-full object-cover select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
          }}
        />
      </div>
      <label className="flex items-center gap-2 w-full max-w-[220px]">
        <ZoomIn size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />
        <input
          type="range"
          min={1}
          max={2.5}
          step={0.05}
          value={scale}
          onChange={(e) => onChange({ scale: Number(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
          aria-label={t.network.photoZoom}
        />
      </label>
      <p className="text-[11px] text-[var(--color-text-faint)]">{t.network.photoDragHint}</p>
    </div>
  );
}
