import { useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { Phone } from 'lucide-react';
import { getIcon } from '../../components/icons/networkIcons';
import { seededRandom } from '../../hooks/seededRandom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { connectionCurvesStore, pairKey } from './connectionCurves';
import type { CenterNodeConfig } from './networkCategories';
import type { NetworkCategoryConfig, NetworkEntry } from '../../data/types';

interface NetworkGraphProps {
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  onSelect: (entry: NetworkEntry) => void;
  onMove: (entry: NetworkEntry, position: { x: number; y: number }) => void;
  onSelectCenter?: () => void;
  centerNode?: CenterNodeConfig;
  /** Fullscreen mode enables background pan + wheel/pinch zoom around the canvas. */
  expanded?: boolean;
  /** id of the entry currently waiting for a second tap to complete a new
   * free connection — while set, tapping any OTHER node completes the
   * connection instead of opening it, and tapping the same node cancels. */
  connectingFromId?: string | null;
  onCompleteConnection?: (target: NetworkEntry) => void;
  onCancelConnecting?: () => void;
  /** tap-to-remove for an existing free connection line */
  onRemoveConnection?: (fromId: string, toId: string) => void;
}

function autoPosition(entry: NetworkEntry, index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
  const radius = 0.36;
  const jitter = (seededRandom(entry.id, 'r') - 0.5) * 0.06;
  const x = 0.5 + Math.cos(angle) * (radius + jitter);
  const y = 0.5 + Math.sin(angle) * (radius + jitter);
  return { x: clamp(x), y: clamp(y) };
}

function clamp(v: number, min = 0.08, max = 0.92): number {
  return Math.min(max, Math.max(min, v));
}

const DRAG_THRESHOLD_PX = 6;

export function NetworkGraph({
  entries,
  categories,
  onSelect,
  onMove,
  onSelectCenter,
  centerNode,
  expanded = false,
  connectingFromId = null,
  onCompleteConnection,
  onCancelConnecting,
  onRemoveConnection,
}: NetworkGraphProps) {
  const t = useT();
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef<{ px: number; py: number } | null>(null);
  const [activeCommTip, setActiveCommTip] = useState<{ a: string; b: string; x: number; y: number } | null>(null);
  const [curveDrag, setCurveDrag] = useState<{ key: string; amount: number } | null>(null);
  const curveDragKeyRef = useRef<{ a: string; b: string } | null>(null);

  // Pan/zoom state — only meaningful in expanded (fullscreen) mode.
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const panRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  const positions = new Map<string, { x: number; y: number }>();
  entries.forEach((entry, i) => {
    positions.set(entry.id, entry.position ?? autoPosition(entry, i, entries.length));
  });

  const categoryById = (id: string) => categories.find((c) => c.id === id) ?? categories[0];

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, entry: NetworkEntry) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragMoved.current = false;
      dragStart.current = { px: e.clientX, py: e.clientY };
      setDragId(entry.id);
      setDragPos(positions.get(entry.id) ?? { x: 0.5, y: 0.5 });
    },
    [positions],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragId || !containerRef.current || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.px;
      const dy = e.clientY - dragStart.current.py;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragMoved.current = true;
      if (!dragMoved.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width);
      const y = clamp((e.clientY - rect.top) / rect.height);
      setDragPos({ x, y });
    },
    [dragId],
  );

  const handlePointerUp = useCallback(
    (entry: NetworkEntry) => {
      if (dragMoved.current && dragPos) {
        onMove(entry, dragPos);
      } else if (connectingFromId) {
        if (entry.id === connectingFromId) {
          onCancelConnecting?.();
        } else {
          onCompleteConnection?.(entry);
        }
      } else {
        onSelect(entry);
      }
      setDragId(null);
      setDragPos(null);
      dragStart.current = null;
    },
    [dragPos, onMove, onSelect, connectingFromId, onCompleteConnection, onCancelConnecting],
  );

  // ---- Curve handle dragging (reshapes the connection between two people) ----
  const handleCurveHandleDown = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>, a: NetworkEntry, b: NetworkEntry, currentAmount: number) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      curveDragKeyRef.current = { a: a.id, b: b.id };
      setCurveDrag({ key: pairKey(a.id, b.id), amount: currentAmount });
    },
    [],
  );

  const handleCurveHandleMove = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      const pair = curveDragKeyRef.current;
      if (!pair || !containerRef.current) return;
      const posA = positions.get(pair.a);
      const posB = positions.get(pair.b);
      if (!posA || !posB) return;

      const rect = containerRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const midX = (posA.x + posB.x) / 2;
      const midY = (posA.y + posB.y) / 2;
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const amount = clamp(2 * ((px - midX) * nx + (py - midY) * ny), -0.16, 0.16);
      setCurveDrag({ key: pairKey(pair.a, pair.b), amount });
    },
    [positions],
  );

  const handleCurveHandleUp = useCallback(() => {
    const pair = curveDragKeyRef.current;
    if (pair && curveDrag) {
      connectionCurvesStore.set(pair.a, pair.b, { amount: curveDrag.amount });
    }
    curveDragKeyRef.current = null;
    setCurveDrag(null);
  }, [curveDrag]);

  // ---- Background pan + pinch/wheel zoom (expanded mode only) ----
  const handleBgPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!expanded) return;
      // Without capture, a finger that drifts outside this element's
      // current hit-test bounds during a wide pinch (very easy on a small
      // phone screen) stops delivering move events entirely, breaking the
      // gesture mid-way — this is what made pinch/pan feel unreliable on
      // mobile specifically. The other drag handlers already do this;
      // this one didn't.
      // "Kurz nicht verfuegbar beim Verziehen/Zoomen" (Teil 2)-Auftrag —
      // setPointerCapture itself was unguarded here, unlike every other
      // drag handler in the app (ImageCropModal, PhotoPositioner,
      // FeelingsWheel all wrap it). It can throw for pointer ids the
      // platform doesn't currently recognize as active — an uncaught
      // throw here crashed the whole page (the ErrorBoundary catch,
      // "Kurz nicht verfuegbar"), which is very plausibly what was still
      // happening even after the panRef null-reference fix below.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // dragging/pinching still works without capture in most cases;
        // capture only prevents the gesture from ending early if a
        // finger leaves this element's bounds.
      }
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.current.size === 1) {
        panRef.current = { startX: e.clientX, startY: e.clientY, startTx: view.tx, startTy: view.ty };
      } else if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchRef.current = { startDist: dist, startScale: view.scale };
      }
    },
    [expanded, view],
  );

  const handleBgPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!expanded || !activePointers.current.has(e.pointerId)) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2 && pinchRef.current && pinchRef.current.startDist > 0) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const scale = Math.min(2.5, Math.max(0.6, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
        setView((v) => ({ ...v, scale }));
      } else if (activePointers.current.size === 1 && panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        // Capture these BEFORE calling setView, not inside its updater
        // callback — that callback can run after this function returns
        // (React may defer it), by which point a fast-following
        // pointerup could already have nulled panRef.current out from
        // under it. Reading panRef.current!.startTx inside the
        // callback was exactly the null-reference crash reported.
        const startTx = panRef.current.startTx;
        const startTy = panRef.current.startTy;
        setView((v) => ({ ...v, tx: startTx + dx, ty: startTy + dy }));
      }
    },
    [expanded],
  );

  const handleBgPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) pinchRef.current = null;
    if (activePointers.current.size === 0) {
      panRef.current = null;
    } else if (activePointers.current.size === 1) {
      // "Kurz nicht verfuegbar beim Verziehen/Zoomen"-Auftrag — lifting
      // the second finger during a pinch used to leave panRef.current
      // either stale (still holding the FIRST finger's original
      // down-position from before the pinch even started) or, in some
      // sequences, genuinely null while handleBgPointerMove's pan
      // branch still ran — reading .startTx off that null crashed the
      // whole page. Whenever exactly one pointer remains after a lift,
      // give panRef a fresh baseline from THAT pointer's current
      // position, so the drag continues smoothly from here instead of
      // jumping or crashing.
      const remaining = Array.from(activePointers.current.values())[0];
      if (remaining) {
        panRef.current = { startX: remaining.x, startY: remaining.y, startTx: view.tx, startTy: view.ty };
      }
    }
  }, [view]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!expanded) return;
      e.preventDefault();
      setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.6, v.scale - e.deltaY * 0.001)) }));
    },
    [expanded],
  );

  // Build a set of communication-path pairs (deduplicated, order-independent).
  const commPaths: Array<[NetworkEntry, NetworkEntry]> = [];
  const seenPairs = new Set<string>();
  entries.forEach((entry) => {
    (entry.connections ?? []).forEach((otherId) => {
      const other = entries.find((e) => e.id === otherId);
      if (!other) return;
      const key = [entry.id, other.id].sort().join('::');
      if (seenPairs.has(key)) return;
      seenPairs.add(key);
      commPaths.push([entry, other]);
    });
  });

  // Free, general-purpose connections ("Verbindung hinzufügen") — solid
  // lines, deliberately visually distinct from the dashed communication
  // paths above so the two meanings never get confused at a glance.
  const freeLinks: Array<[NetworkEntry, NetworkEntry]> = [];
  const seenFreeLinks = new Set<string>();
  entries.forEach((entry) => {
    (entry.linkedTo ?? []).forEach((otherId) => {
      const other = entries.find((e) => e.id === otherId);
      if (!other) return;
      const key = [entry.id, other.id].sort().join('::');
      if (seenFreeLinks.has(key)) return;
      seenFreeLinks.add(key);
      freeLinks.push([entry, other]);
    });
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none touch-none ${expanded ? 'h-full' : 'aspect-square'}`}
      style={expanded ? undefined : { maxHeight: 340 }}
      onPointerDown={handleBgPointerDown}
      onPointerMove={handleBgPointerMove}
      onPointerUp={handleBgPointerUp}
      onPointerCancel={handleBgPointerUp}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: expanded ? `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` : undefined,
          transformOrigin: 'center center',
          transition: panRef.current || pinchRef.current ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {entries.map((entry) => {
            const pos = entry.id === dragId && dragPos ? dragPos : positions.get(entry.id)!;
            return (
              <line
                key={entry.id}
                x1="50%"
                y1="50%"
                x2={`${pos.x * 100}%`}
                y2={`${pos.y * 100}%`}
                stroke="var(--color-border-strong)"
                strokeWidth={0.55}
                strokeDasharray="0.4 1.8"
                strokeLinecap="round"
              />
            );
          })}
          {freeLinks.map(([a, b]) => {
            const posA = a.id === dragId && dragPos ? dragPos : positions.get(a.id)!;
            const posB = b.id === dragId && dragPos ? dragPos : positions.get(b.id)!;
            const pathD = `M ${posA.x * 100} ${posA.y * 100} L ${posB.x * 100} ${posB.y * 100}`;
            return (
              <g key={`free-${a.id}-${b.id}`}>
                <path
                  d={pathD}
                  stroke="var(--color-primary)"
                  strokeWidth={0.55}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.6}
                />
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={5}
                  fill="none"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={() => {
                    if (window.confirm(t.network.confirmRemoveConnection)) {
                      onRemoveConnection?.(a.id, b.id);
                    }
                  }}
                />
              </g>
            );
          })}
          {commPaths.map(([a, b]) => {
            const posA = a.id === dragId && dragPos ? dragPos : positions.get(a.id)!;
            const posB = b.id === dragId && dragPos ? dragPos : positions.get(b.id)!;

            const key = pairKey(a.id, b.id);
            const amount = curveDrag?.key === key ? curveDrag.amount : connectionCurvesStore.get(a.id, b.id).amount;

            const midX = (posA.x + posB.x) / 2;
            const midY = (posA.y + posB.y) / 2;
            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const controlX = midX + nx * amount;
            const controlY = midY + ny * amount;
            // true midpoint of the quadratic curve at t=0.5 — this is where
            // the phone icon and the drag handle sit, not the straight midpoint.
            const curveMidX = 0.25 * posA.x + 0.5 * controlX + 0.25 * posB.x;
            const curveMidY = 0.25 * posA.y + 0.5 * controlY + 0.25 * posB.y;

            const pathD = `M ${posA.x * 100} ${posA.y * 100} Q ${controlX * 100} ${controlY * 100} ${posB.x * 100} ${posB.y * 100}`;

            return (
              <g key={key}>
                <path
                  d={pathD}
                  stroke="var(--color-text-faint)"
                  strokeWidth={0.5}
                  strokeDasharray="0.6 1.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85}
                />
                {/* invisible wider hit area so the thin curve is easy to tap */}
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={5}
                  fill="none"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={() =>
                    setActiveCommTip((prev) =>
                      prev && prev.a === a.id && prev.b === b.id
                        ? null
                        : { a: a.id, b: b.id, x: curveMidX, y: curveMidY },
                    )
                  }
                />
                {/* phone icon + drag handle at the curve's true midpoint */}
                <circle
                  cx={curveMidX * 100}
                  cy={curveMidY * 100}
                  r={2.6}
                  fill="var(--color-surface)"
                  stroke="var(--color-text-faint)"
                  strokeWidth={0.3}
                  style={{ cursor: 'grab', pointerEvents: 'all', touchAction: 'none' }}
                  onPointerDown={(e) => handleCurveHandleDown(e, a, b, amount)}
                  onPointerMove={handleCurveHandleMove}
                  onPointerUp={handleCurveHandleUp}
                />
                <Phone
                  x={curveMidX * 100 - 1.1}
                  y={curveMidY * 100 - 1.1}
                  width={2.2}
                  height={2.2}
                  color="var(--color-text-faint)"
                  strokeWidth={2.4}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </svg>

        <button
          type="button"
          onClick={onSelectCenter}
          aria-label={centerNode?.label || t.network.you}
          className="absolute flex flex-col items-center justify-center rounded-full text-[var(--color-surface)] shadow-[var(--shadow-md)] border-none cursor-pointer network-node__dot"
          style={{
            width: 76,
            height: 76,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: centerNode?.color || 'var(--color-primary)',
          }}
        >
          {centerNode?.photoDataUrl ? (
            <img
              src={centerNode.photoDataUrl}
              alt=""
              className="w-full h-full object-cover rounded-full"
              style={{
                transform: `translate(${centerNode.photoOffsetX ?? 0}%, ${centerNode.photoOffsetY ?? 0}%) scale(${centerNode.photoScale ?? 1})`,
              }}
            />
          ) : centerNode?.iconKey ? (
            (() => {
              const CenterIcon = getIcon(centerNode.iconKey, 'sparkles');
              return <CenterIcon size={26} />;
            })()
          ) : (
            <span className="text-[12px] font-semibold tracking-wide px-1 text-center break-words">
              {centerNode?.label || t.network.you}
            </span>
          )}
        </button>

        {entries.map((entry, i) => {
          const pos = entry.id === dragId && dragPos ? dragPos : positions.get(entry.id)!;
          const category = categoryById(entry.category);
          const Icon = getIcon(entry.iconKey, category.iconKey);
          const phase = seededRandom(entry.id, 'p');
          const isDragging = entry.id === dragId && dragMoved.current;

          return (
            <button
              key={entry.id}
              type="button"
              onPointerDown={(e) => handlePointerDown(e, entry)}
              onPointerMove={handlePointerMove}
              onPointerUp={() => handlePointerUp(entry)}
              aria-label={entry.name}
              className={`network-node ${settings.reduceMotion ? '' : 'network-node--float'} ${isDragging ? 'network-node--dragging' : ''} ${connectingFromId === entry.id ? 'network-node--connecting' : ''}`}
              style={
                {
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  touchAction: 'none',
                  '--float-delay': `${phase * -8}s`,
                  '--float-duration': `${6 + phase * 3}s`,
                  zIndex: isDragging ? 20 : 10 + i,
                } as React.CSSProperties
              }
            >
              <span
                className="network-node__dot"
                style={{ background: category.color }}
              >
                {entry.photoDataUrl ? (
                  <img
                    src={entry.photoDataUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                    style={{
                      transform: `translate(${entry.photoOffsetX ?? 0}%, ${entry.photoOffsetY ?? 0}%) scale(${entry.photoScale ?? 1})`,
                    }}
                  />
                ) : (
                  <Icon size={17} color="#fff" />
                )}
              </span>
              <span className="network-node__label">{entry.name}</span>
            </button>
          );
        })}

        {activeCommTip && (() => {
          const a = entries.find((e) => e.id === activeCommTip.a);
          const b = entries.find((e) => e.id === activeCommTip.b);
          if (!a || !b) return null;
          return (
            <div
              className="network-comm-tip"
              style={{ left: `${activeCommTip.x * 100}%`, top: `${activeCommTip.y * 100}%` }}
              onClick={() => setActiveCommTip(null)}
            >
              {a.name} {t.network.connectionsTipAnd} {b.name} {t.network.connectionsTipSuffix}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
