import { useRef, useState, useCallback } from 'react';

export interface ChartZoomState {
  /** 1 = fully zoomed out (all days visible). Higher = more zoomed in. */
  zoom: number;
  /** left edge of the visible window, as a 0..1 fraction of the full range */
  windowStart: number;
  windowSize: number;
}

export interface ChartZoomHandlers {
  onWheel: (e: React.WheelEvent<SVGSVGElement | HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<SVGSVGElement | HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<SVGSVGElement | HTMLDivElement>) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement | HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement | HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const MAX_ZOOM = 8;
const MIN_ZOOM = 1;

function touchDistance(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/**
 * A day-range window (not a raw SVG viewBox scale transform) — zooming
 * narrows which days a chart considers "visible" and the chart
 * recomputes point positions for just that subset. This keeps circles,
 * labels, and line thickness a constant, readable size at any zoom
 * level instead of the whole picture (including text) growing or
 * shrinking the way a naive viewBox zoom would, which is what "darf
 * nicht unbrauchbar werden" specifically asked to avoid.
 *
 * Three independent input paths converge on the same zoom/windowStart
 * state: mouse wheel (desktop), pinch (two-finger touch), and explicit
 * +/- buttons — all three are tested to end up in a consistent,
 * clamped state, so whichever one a person reaches for works the same.
 */
export function useChartZoom(): [ChartZoomState, ChartZoomHandlers] {
  const [zoom, setZoomRaw] = useState(1);
  const [windowStart, setWindowStartRaw] = useState(0);

  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const pinchStartWindowStart = useRef(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartWindowStart = useRef(0);
  const containerWidth = useRef(300);

  const windowSize = 1 / zoom;

  function clampWindowStart(start: number, size: number): number {
    return Math.min(Math.max(start, 0), Math.max(0, 1 - size));
  }

  function setZoom(next: number, anchorFraction = 0.5) {
    const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
    const newSize = 1 / clamped;
    // keep the point under the anchor (cursor / pinch center) stable
    // instead of always zooming from the left edge
    const anchorAbsolute = windowStart + anchorFraction * windowSize;
    const newStart = anchorAbsolute - anchorFraction * newSize;
    setZoomRaw(clamped);
    setWindowStartRaw(clampWindowStart(newStart, newSize));
  }

  const zoomIn = useCallback(() => setZoom(zoom * 1.6), [zoom, windowStart, windowSize]);
  const zoomOut = useCallback(() => setZoom(zoom / 1.6), [zoom, windowStart, windowSize]);
  const reset = useCallback(() => {
    setZoomRaw(1);
    setWindowStartRaw(0);
  }, []);

  function onWheel(e: React.WheelEvent) {
    if (zoom === 1 && e.deltaY > 0) return; // nothing to do, already fully zoomed out
    e.preventDefault();
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    containerWidth.current = rect.width || containerWidth.current;
    const anchorFraction = (e.clientX - rect.left) / (rect.width || 1);
    const direction = e.deltaY > 0 ? -1 : 1;
    setZoom(zoom * (direction > 0 ? 1.15 : 1 / 1.15), Math.min(Math.max(anchorFraction, 0), 1));
  }

  function onTouchStart(e: React.TouchEvent) {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    containerWidth.current = rect.width || containerWidth.current;
    if (e.touches.length === 2) {
      pinchStartDist.current = touchDistance(e.touches);
      pinchStartZoom.current = zoom;
      pinchStartWindowStart.current = windowStart;
    } else if (e.touches.length === 1 && zoom > 1) {
      dragStartX.current = e.touches[0].clientX;
      dragStartWindowStart.current = windowStart;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      const ratio = dist / pinchStartDist.current;
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const anchorFraction = (midX - rect.left) / (rect.width || 1);
      const nextZoom = Math.min(Math.max(pinchStartZoom.current * ratio, MIN_ZOOM), MAX_ZOOM);
      const newSize = 1 / nextZoom;
      const anchorAbsolute =
        pinchStartWindowStart.current + Math.min(Math.max(anchorFraction, 0), 1) * (1 / pinchStartZoom.current);
      const newStart = anchorAbsolute - Math.min(Math.max(anchorFraction, 0), 1) * newSize;
      setZoomRaw(nextZoom);
      setWindowStartRaw(clampWindowStart(newStart, newSize));
    } else if (e.touches.length === 1 && dragStartX.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartX.current;
      const fracDelta = -dx / (containerWidth.current || 1) / zoom;
      setWindowStartRaw(clampWindowStart(dragStartWindowStart.current + fracDelta, windowSize));
    }
  }

  function onTouchEnd() {
    pinchStartDist.current = null;
    dragStartX.current = null;
  }

  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    containerWidth.current = rect.width || containerWidth.current;
    dragStartX.current = e.clientX;
    dragStartWindowStart.current = windowStart;
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    const fracDelta = -dx / (containerWidth.current || 1) / zoom;
    setWindowStartRaw(clampWindowStart(dragStartWindowStart.current + fracDelta, windowSize));
  }

  function onMouseUp() {
    dragStartX.current = null;
  }

  return [
    { zoom, windowStart, windowSize },
    {
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      zoomIn,
      zoomOut,
      reset,
    },
  ];
}
