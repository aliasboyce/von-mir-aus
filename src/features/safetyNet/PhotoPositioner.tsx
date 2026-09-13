import { useEffect, useRef, useState } from 'react';
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

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;

/**
 * "Zoom-Regler bei Person bearbeiten geht nicht"-Auftrag — same fix as
 * ImageCropModal.tsx: setPointerCapture is unreliable for touch-origin
 * pointers on iOS Safari specifically, so a real finger drifting
 * slightly outside this small circular frame during a drag silently
 * stopped the drag from continuing. Rewritten to use document-level
 * pointer listeners for the duration of a drag instead, which keep
 * receiving events regardless of where the finger physically is.
 * Also adds real two-finger pinch-to-zoom alongside the existing
 * slider, matching the same "mit den Fingern groesser stellen"
 * capability added there.
 */
export function PhotoPositioner({ photoDataUrl, scale, offsetX, offsetY, onChange, size = 128 }: PhotoPositionerProps) {
  const t = useT();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [dragging, setDragging] = useState(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const offsetRef = useRef({ x: offsetX, y: offsetY });
  offsetRef.current = { x: offsetX, y: offsetY };

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (!pinchRef.current) {
          pinchRef.current = { startDist: dist, startScale: scaleRef.current };
        } else {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
          onChange({ scale: next });
        }
        return;
      }
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
    function handleUp(e: PointerEvent) {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) pinchRef.current = null;
      if (activePointers.current.size === 0) {
        dragStart.current = null;
        setDragging(false);
      }
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
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offsetRef.current.x, offsetY: offsetRef.current.y };
      setDragging(true);
    }
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
          min={MIN_SCALE}
          max={MAX_SCALE}
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
